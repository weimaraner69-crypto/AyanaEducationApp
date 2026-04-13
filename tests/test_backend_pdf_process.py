"""B-009: PDF処理エンドポイント（/api/pdf/process, /api/pdf/upload）のテスト。"""

from __future__ import annotations

from io import BytesIO
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from backend.main import MAX_PDF_SIZE, _is_safe_pdf_url, app
from backend.services.mext_pdf_parser import ParseMextPdfError

client = TestClient(app)


# ============================================================
# _is_safe_pdf_url の単体テスト（SSRF 保護）
# ============================================================
class TestIsSafePdfUrl:
    """C-001 準拠: PDF URL のドメイン・スキーム検証。"""

    def test_valid_mext_https(self) -> None:
        """正常系: mext.go.jp の HTTPS URL は許可。"""
        assert _is_safe_pdf_url(
            "https://www.mext.go.jp/content/test.pdf") is True

    def test_valid_mext_http(self) -> None:
        """正常系: mext.go.jp の HTTP URL は許可。"""
        assert _is_safe_pdf_url("http://mext.go.jp/content/test.pdf") is True

    def test_reject_external_domain(self) -> None:
        """失敗系: 外部ドメインは拒否。"""
        assert _is_safe_pdf_url("https://evil.example.com/test.pdf") is False

    def test_reject_localhost(self) -> None:
        """失敗系: localhost は拒否（SSRF 対策）。"""
        assert _is_safe_pdf_url("http://localhost:8080/secret") is False

    def test_reject_internal_ip(self) -> None:
        """失敗系: 内部IPアドレスは拒否（SSRF 対策）。"""
        assert _is_safe_pdf_url("http://127.0.0.1/admin") is False

    def test_reject_file_scheme(self) -> None:
        """失敗系: file:// スキームは拒否。"""
        assert _is_safe_pdf_url("file:///etc/passwd") is False

    def test_reject_javascript_scheme(self) -> None:
        """失敗系: javascript: スキームは拒否。"""
        assert _is_safe_pdf_url("javascript:alert(1)") is False

    def test_reject_empty_string(self) -> None:
        """境界値: 空文字列は拒否。"""
        assert _is_safe_pdf_url("") is False

    def test_reject_similar_domain(self) -> None:
        """失敗系: mext.go.jp に類似するが異なるドメインは拒否。"""
        assert _is_safe_pdf_url("https://not-mext.go.jp/test.pdf") is False

    def test_accept_subdomain(self) -> None:
        """正常系: mext.go.jp のサブドメインは許可。"""
        assert _is_safe_pdf_url(
            "https://sub.mext.go.jp/content/test.pdf") is True

    def test_reject_non_pdf_extension(self) -> None:
        """失敗系: .pdf でない拡張子は拒否（C-001 準拠）。"""
        assert _is_safe_pdf_url("https://www.mext.go.jp/content/document.html") is False

    def test_accept_pdf_extension(self) -> None:
        """正常系: .pdf 拡張子を持つ正しい URL は許可。"""
        assert _is_safe_pdf_url("https://www.mext.go.jp/content/curriculum.pdf") is True


# ============================================================
# POST /api/pdf/process のテスト
# ============================================================
class TestPdfProcess:
    """PDF URL ダウンロード＆解析エンドポイントのテスト。"""

    def test_no_url(self) -> None:
        """失敗系: URL 未指定で理由コード NO_URL を返す。"""
        res = client.post("/api/pdf/process", json={})
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "fail"
        assert data["reason_code"] == "NO_URL"

    def test_invalid_url_type(self) -> None:
        """失敗系: URL が文字列でない場合は NO_URL を返す。"""
        res = client.post("/api/pdf/process", json={"url": 123})
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "fail"
        assert data["reason_code"] == "NO_URL"

    def test_blocked_external_url(self) -> None:
        """失敗系: 外部ドメイン URL は C001_INVALID_SOURCE_URL で拒否。"""
        res = client.post("/api/pdf/process",
                          json={"url": "https://evil.com/payload.pdf"})
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "fail"
        assert data["reason_code"] == "C001_INVALID_SOURCE_URL"

    def test_blocked_localhost_url(self) -> None:
        """失敗系: localhost URL は SSRF 保護で拒否。"""
        res = client.post("/api/pdf/process",
                          json={"url": "http://localhost:8080/secret"})
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "fail"
        assert data["reason_code"] == "C001_INVALID_SOURCE_URL"

    @patch("backend.main.urllib.request.urlopen")
    @patch("backend.main.parse_mext_pdf")
    def test_success_with_valid_mext_url(
        self, mock_parse: MagicMock, mock_urlopen: MagicMock
    ) -> None:
        """正常系: mext.go.jp の URL で PDF 解析成功。"""
        mock_response = MagicMock()
        mock_response.read.return_value = b"%PDF-1.0 test content"
        mock_response.__enter__ = lambda s: s
        mock_response.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = mock_response
        mock_parse.return_value = {"text": "テスト結果", "tables": []}

        res = client.post(
            "/api/pdf/process",
            json={"url": "https://www.mext.go.jp/content/test.pdf"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"
        assert data["data"]["text"] == "テスト結果"

    @patch("backend.main.urllib.request.urlopen")
    def test_network_error(self, mock_urlopen: MagicMock) -> None:
        """失敗系: ネットワークエラー時は UNEXPECTED_ERROR を返す。"""
        mock_urlopen.side_effect = Exception("Connection refused")

        res = client.post(
            "/api/pdf/process",
            json={"url": "https://www.mext.go.jp/content/test.pdf"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "error"
        assert data["reason_code"] == "UNEXPECTED_ERROR"

    @patch("backend.main.urllib.request.urlopen")
    @patch("backend.main.parse_mext_pdf")
    def test_parse_error(
        self, mock_parse: MagicMock, mock_urlopen: MagicMock
    ) -> None:
        """失敗系: ParseMextPdfError 発生時は status: fail と reason_code を返す。"""
        mock_response = MagicMock()
        mock_response.read.return_value = b"%PDF-1.0 broken"
        mock_response.__enter__ = lambda s: s
        mock_response.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = mock_response
        mock_parse.side_effect = ParseMextPdfError("解析失敗", "PARSE_FAILED")

        res = client.post(
            "/api/pdf/process",
            json={"url": "https://www.mext.go.jp/content/test.pdf"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "fail"
        assert data["reason_code"] == "PARSE_FAILED"

    @patch("backend.main.urllib.request.urlopen")
    @patch("backend.main.parse_mext_pdf")
    def test_unexpected_error(
        self, mock_parse: MagicMock, mock_urlopen: MagicMock
    ) -> None:
        """失敗系: 予期しない例外発生時は status: error を返す。"""
        mock_response = MagicMock()
        mock_response.read.return_value = b"%PDF-1.0 test"
        mock_response.__enter__ = lambda s: s
        mock_response.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = mock_response
        mock_parse.side_effect = RuntimeError("予期しない内部エラー")

        res = client.post(
            "/api/pdf/process",
            json={"url": "https://www.mext.go.jp/content/test.pdf"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "error"
        assert data["reason_code"] == "UNEXPECTED_ERROR"


# ============================================================
# POST /api/pdf/upload のテスト
# ============================================================
class TestPdfUpload:
    """PDF ファイルアップロード＆解析エンドポイントのテスト。"""

    @patch("backend.main.parse_mext_pdf")
    def test_success_upload(self, mock_parse: MagicMock) -> None:
        """正常系: PDF ファイルアップロードで解析成功。"""
        mock_parse.return_value = {"text": "アップロードPDFの内容", "tables": []}
        pdf_bytes = b"%PDF-1.0 test content"

        res = client.post(
            "/api/pdf/upload",
            files={"file": ("test.pdf", BytesIO(
                pdf_bytes), "application/pdf")},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"
        assert data["data"]["text"] == "アップロードPDFの内容"

    @patch("backend.main.parse_mext_pdf")
    def test_parse_error(self, mock_parse: MagicMock) -> None:
        """失敗系: PDF 解析エラー時は理由コード付きで返す。"""
        from backend.services.mext_pdf_parser import ParseMextPdfError

        mock_parse.side_effect = ParseMextPdfError("解析失敗", "PARSE_FAILED")

        res = client.post(
            "/api/pdf/upload",
            files={"file": ("test.pdf", BytesIO(
                b"invalid"), "application/pdf")},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "fail"
        assert data["reason_code"] == "PARSE_FAILED"

    def test_file_too_large(self) -> None:
        """失敗系: 上限（MAX_PDF_SIZE）を超えるファイルで FILE_TOO_LARGE を返す。"""
        # MAX_PDF_SIZE + 1 バイトのダミーデータを生成
        oversized_content = b"x" * (MAX_PDF_SIZE + 1)

        res = client.post(
            "/api/pdf/upload",
            files={"file": ("large.pdf", BytesIO(oversized_content), "application/pdf")},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "fail"
        assert data["reason_code"] == "FILE_TOO_LARGE"
