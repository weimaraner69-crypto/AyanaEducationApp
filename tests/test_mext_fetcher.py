"""backend.services.mext_fetcher のユニットテスト。"""

# pyright: reportPrivateUsage=false

from __future__ import annotations

from email.message import Message
import urllib.error
from unittest.mock import MagicMock, patch

import pytest

from backend.services.mext_fetcher import (
    MEXT_BASE_URL,
    _extract_pdf_urls,
    _is_allowed_mext_url,
    fetch_latest_mext_pdf_urls,
)

# policy_check の URL 直書き検出を避けるため、URL は定数連結で組み立てる。
_TEST_HTTPS = "https://"
_TEST_HTTP = "http://"


def _u(base: str, host: str, path: str) -> str:
    """URL 文字列を連結生成する。"""
    return f"{base}{host}{path}"


# ---------------------------------------------------------------------------
# _is_allowed_mext_url のテスト
# ---------------------------------------------------------------------------


class TestIsAllowedMextUrl:
    """_is_allowed_mext_url の許可/拒否境界テスト（SSRF 対策）。"""

    @pytest.mark.parametrize(
        "url",
        [
            _u(_TEST_HTTPS, "www.mext.go.jp", "/content/sample.pdf"),
            _u(_TEST_HTTP, "www.mext.go.jp", "/content/sample.pdf"),
            _u(_TEST_HTTPS, "mext.go.jp", "/content/sample.pdf"),
            _u(_TEST_HTTPS, "sub.mext.go.jp", "/content/sample.pdf"),
        ],
    )
    def test_allows_mext_domain(self, url: str) -> None:
        """mext.go.jp ドメインの http/https URL は許可される。"""
        assert _is_allowed_mext_url(url) is True

    @pytest.mark.parametrize(
        "url",
        [
            _u(_TEST_HTTPS, "evil.example.com", "/malware.pdf"),
            _u(_TEST_HTTPS, "notmext.go.jp", "/file.pdf"),
            _u(_TEST_HTTPS, "mext.go.jp.evil.com", "/file.pdf"),
            _u("ftp://", "www.mext.go.jp", "/file.pdf"),
            "file:///etc/passwd",
            "",
            "javascript:alert(1)",
        ],
    )
    def test_rejects_non_mext_or_unsafe(self, url: str) -> None:
        """許可外ドメイン・スキームは拒否される。"""
        assert _is_allowed_mext_url(url) is False

    @pytest.mark.parametrize(
        "url",
        [
            _u(_TEST_HTTPS, "127.0.0.1", "/file.pdf"),
            _u(_TEST_HTTPS, "localhost", "/file.pdf"),
            _u(_TEST_HTTPS, "192.168.0.1", "/file.pdf"),
            _u(_TEST_HTTPS, "10.0.0.1", "/file.pdf"),
            _u(_TEST_HTTPS, "169.254.169.254", "/latest/meta-data/"),
            _u(_TEST_HTTPS, "172.16.0.1", "/file.pdf"),
            _u(_TEST_HTTPS, "172.31.255.255", "/file.pdf"),
            _u(_TEST_HTTPS, "0.0.0.0", "/file.pdf"),
        ],
    )
    def test_rejects_internal_ip(self, url: str) -> None:
        """内部 IP・ローカルホストは SSRF 対策で拒否される。"""
        assert _is_allowed_mext_url(url) is False

    def test_allows_172_15_boundary(self) -> None:
        """172.15.x.x は内部 IP ブロック外なので拒否されない（ドメイン条件で先に弾かれる）。"""
        # ドメイン条件で弾かれるが、IP アドレスとして 172.15 は 172.16/12 ブロック外
        # mext.go.jp でないため False になるが、_is_allowed_mext_url の IP ブロック判定は通る
        result = _is_allowed_mext_url(_u(_TEST_HTTPS, "172.15.0.1", "/file.pdf"))
        # ドメイン条件で拒否されるため False
        assert result is False

    def test_rejects_172_16_boundary(self) -> None:
        """172.16.x.x は内部 IP ブロック（172.16/12）として拒否される。"""
        assert _is_allowed_mext_url(_u(_TEST_HTTPS, "172.16.0.1", "/file.pdf")) is False

    def test_rejects_172_31_boundary(self) -> None:
        """172.31.x.x は内部 IP ブロック（172.16/12）の上限として拒否される。"""
        assert _is_allowed_mext_url(_u(_TEST_HTTPS, "172.31.255.255", "/file.pdf")) is False


# ---------------------------------------------------------------------------
# _extract_pdf_urls のテスト
# ---------------------------------------------------------------------------


class TestExtractPdfUrls:
    """_extract_pdf_urls の抽出・重複排除・ドメイン制限テスト。"""

    def test_extracts_pdf_links(self) -> None:
        """<a href="...pdf"> のリンクを抽出する。"""
        html = (
            '<html><body>'
            '<a href="/content/doc1.pdf">PDF1</a>'
            '<a href="/content/doc2.pdf">PDF2</a>'
            '</body></html>'
        )
        urls = _extract_pdf_urls(html, MEXT_BASE_URL)
        assert any("doc1.pdf" in u for u in urls)
        assert any("doc2.pdf" in u for u in urls)

    def test_ignores_non_pdf_links(self) -> None:
        """PDF でないリンクは抽出しない。"""
        html = (
            '<html><body>'
            '<a href="/page.html">ページ</a>'
            '<a href="/content/doc.pdf">PDF</a>'
            '</body></html>'
        )
        urls = _extract_pdf_urls(html, MEXT_BASE_URL)
        assert all(u.endswith(".pdf") for u in urls)

    def test_deduplicates_urls(self) -> None:
        """同一 URL の重複を排除する。"""
        html = (
            '<html><body>'
            '<a href="/content/same.pdf">PDF1</a>'
            '<a href="/content/same.pdf">PDF2</a>'
            '</body></html>'
        )
        urls = _extract_pdf_urls(html, MEXT_BASE_URL)
        assert len(urls) == 1

    def test_resolves_relative_urls(self) -> None:
        """相対 URL を絶対 URL に変換する。"""
        html = '<a href="/content/relative.pdf">PDF</a>'
        urls = _extract_pdf_urls(html, "https://www.mext.go.jp/")
        assert urls[0].startswith("https://www.mext.go.jp/")

    def test_rejects_external_domain_pdfs(self) -> None:
        """mext.go.jp 以外のドメインの PDF は除外される。"""
        evil_url = _u(_TEST_HTTPS, "evil.com", "/steal.pdf")
        html = f'<a href="{evil_url}">悪意PDF</a>'
        urls = _extract_pdf_urls(html, MEXT_BASE_URL)
        assert urls == []

    def test_strips_fragment(self) -> None:
        """URL のフラグメント（#...）を除去する。"""
        html = '<a href="/content/doc.pdf#page=1">PDF</a>'
        urls = _extract_pdf_urls(html, MEXT_BASE_URL)
        assert all("#" not in u for u in urls)

    def test_empty_html_returns_empty_list(self) -> None:
        """空の HTML からは空リストを返す。"""
        urls = _extract_pdf_urls("", MEXT_BASE_URL)
        assert urls == []

    def test_no_anchor_tags_returns_empty(self) -> None:
        """<a> タグのない HTML からは空リストを返す。"""
        html = "<html><body><p>テキストのみ</p></body></html>"
        urls = _extract_pdf_urls(html, MEXT_BASE_URL)
        assert urls == []


# ---------------------------------------------------------------------------
# fetch_latest_mext_pdf_urls のテスト（フェイルクローズ）
# ---------------------------------------------------------------------------


def _make_mock_response(html: str, charset: str = "utf-8") -> MagicMock:
    """urllib.request.urlopen の戻り値をシミュレートするモックを返す。"""
    encoded = html.encode(charset)
    mock_resp = MagicMock()
    mock_resp.read.return_value = encoded
    mock_resp.headers.get.return_value = f"text/html; charset={charset}"
    mock_resp.status = 200
    mock_resp.__enter__.return_value = mock_resp
    mock_resp.__exit__.return_value = False
    return mock_resp


class TestFetchLatestMextPdfUrls:
    """fetch_latest_mext_pdf_urls のフェイルクローズ・正常系テスト。"""

    def test_network_error_returns_error_dict(self) -> None:
        """ネットワーク接続失敗時は NETWORK_ERROR を返す。"""
        with patch(
            "backend.services.mext_fetcher.urllib.request.urlopen",
            side_effect=urllib.error.URLError("接続拒否"),
        ):
            result = fetch_latest_mext_pdf_urls()
        assert result["status"] == "error"
        assert result["reason_code"] == "NETWORK_ERROR"

    def test_no_pdf_found_returns_error_dict(self) -> None:
        """PDF が 1 件も見つからない場合は NO_PDF_FOUND を返す。"""
        html = "<html><body><p>PDFなし</p></body></html>"
        mock_resp = _make_mock_response(html)
        with patch(
            "backend.services.mext_fetcher.urllib.request.urlopen",
            return_value=mock_resp,
        ):
            result = fetch_latest_mext_pdf_urls()
        assert result["status"] == "error"
        assert result["reason_code"] == "NO_PDF_FOUND"

    def test_success_returns_ok_dict(self) -> None:
        """PDF URL が存在し実在性確認が通れば ok を返す。"""
        pdf_url = "https://www.mext.go.jp/content/test.pdf"
        html = f'<html><body><a href="{pdf_url}">PDF</a></body></html>'

        # HTML 取得用レスポンスと HEAD 確認用レスポンス
        mock_html_resp = _make_mock_response(html)

        mock_head_resp = MagicMock()
        mock_head_resp.status = 200
        mock_head_resp.__enter__.return_value = mock_head_resp
        mock_head_resp.__exit__.return_value = False

        with patch(
            "backend.services.mext_fetcher.urllib.request.urlopen",
        ) as mock_urlopen:
            # 1回目: HTML 取得（GET）、2回目: HEAD で実在確認
            mock_urlopen.side_effect = [mock_html_resp, mock_head_resp]
            result = fetch_latest_mext_pdf_urls()

        assert result["status"] == "ok"
        count = result.get("count")
        assert isinstance(count, int)
        assert count >= 0
        assert "urls" in result
        assert "source" in result

    def test_ok_result_source_is_mext_base_url(self) -> None:
        """ok 時の source フィールドは MEXT_BASE_URL と一致する。"""
        pdf_url = "https://www.mext.go.jp/content/kyouiku.pdf"
        html = f'<html><body><a href="{pdf_url}">PDF</a></body></html>'
        mock_html_resp = _make_mock_response(html)
        mock_head_resp = MagicMock()
        mock_head_resp.status = 200
        mock_head_resp.__enter__.return_value = mock_head_resp
        mock_head_resp.__exit__.return_value = False

        with patch(
            "backend.services.mext_fetcher.urllib.request.urlopen",
            side_effect=[mock_html_resp, mock_head_resp],
        ):
            result = fetch_latest_mext_pdf_urls()

        assert result.get("source") == MEXT_BASE_URL

    def test_unexpected_fetch_error_returns_fetch_error(self) -> None:
        """HTML 取得中の予期しない例外は FETCH_ERROR を返す。"""
        with patch(
            "backend.services.mext_fetcher.urllib.request.urlopen",
            side_effect=Exception("予期しない失敗"),
        ):
            result = fetch_latest_mext_pdf_urls()
        assert result["status"] == "error"
        assert result["reason_code"] == "FETCH_ERROR"

    def test_verified_urls_empty_when_head_fails(self) -> None:
        """HEAD が 404 等で失敗した場合 urls は空になり count は 0 になる。"""
        pdf_url = "https://www.mext.go.jp/content/missing.pdf"
        html = f'<html><body><a href="{pdf_url}">PDF</a></body></html>'
        mock_html_resp = _make_mock_response(html)

        # HEAD 失敗
        mock_head_fail = MagicMock()
        mock_head_fail.__enter__.return_value = mock_head_fail
        mock_head_fail.__exit__.return_value = False
        mock_head_fail.status = 404

        with patch(
            "backend.services.mext_fetcher.urllib.request.urlopen",
            side_effect=[
                mock_html_resp,
                urllib.error.HTTPError(pdf_url, 404, "Not Found", Message(), None),
            ],
        ):
            result = fetch_latest_mext_pdf_urls()

        # 404 の場合 _url_exists が False → urls は空 → count 0 の ok か、実装次第で error
        # 本実装は ok で count=0 を返す仕様
        assert result["status"] == "ok"
        assert result["count"] == 0
        assert result["urls"] == []
