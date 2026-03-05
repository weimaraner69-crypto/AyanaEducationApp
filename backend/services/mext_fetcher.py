"""文科省サイトから PDF 候補 URL を取得・検証するサービスモジュール。"""

from __future__ import annotations

import re
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser

# 文科省トップページ（学習指導要領一覧が掲載されているページ）
MEXT_BASE_URL: str = "https://www.mext.go.jp/a_menu/shotou/new-cs/1384661.htm"

# 許可するドメイン（SSRF 対策: mext.go.jp 配下のみ）
_ALLOWED_DOMAINS: tuple[str, ...] = ("www.mext.go.jp", "mext.go.jp")

# 許可するスキーム
_ALLOWED_SCHEMES: tuple[str, ...] = ("http", "https")

# HTTP リクエストに使用する User-Agent（一般的なブラウザを模倣）
_USER_AGENT: str = (
    "Mozilla/5.0 (compatible; AyanaEducationBot/1.0; "
    "+https://github.com/AyanaEducationApp)"
)

# HTML 内の href 抽出用パターン
_HREF_RE = re.compile(r'href=["\']([^"\']+)["\']', re.IGNORECASE)


class _LinkExtractor(HTMLParser):
    """HTML を解析して <a href="..."> のリンクを収集するパーサー。"""

    def __init__(self) -> None:
        super().__init__()
        self.links: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        """タグの href 属性を収集する。"""
        if tag.lower() == "a":
            for attr_name, attr_value in attrs:
                if attr_name.lower() == "href" and attr_value:
                    self.links.append(attr_value)


def _extract_pdf_urls(html: str, base_url: str) -> list[str]:
    """HTML 文字列から PDF 候補 URL を抽出・正規化して返す。

    Args:
        html: パース対象の HTML 文字列。
        base_url: 相対 URL を解決するためのベース URL。

    Returns:
        重複排除済みの絶対 PDF URL リスト。
    """
    parser = _LinkExtractor()
    try:
        parser.feed(html)
    except Exception:
        # パース途中の例外は無視して取得済みリンクを使用する
        pass

    seen: set[str] = set()
    result: list[str] = []

    for href in parser.links:
        # 相対 URL を絶対 URL に変換
        absolute = urllib.parse.urljoin(base_url, href)
        # フラグメントを除去
        absolute = absolute.split("#")[0].strip()

        if absolute in seen:
            continue

        if not absolute.lower().endswith(".pdf"):
            continue

        if not _is_allowed_mext_url(absolute):
            continue

        seen.add(absolute)
        result.append(absolute)

    return result


def _is_allowed_mext_url(url: str) -> bool:
    """URL が許可済みの mext.go.jp ドメインかつ安全なスキームであるか検証する。

    SSRF 対策として、内部 IP アドレス・許可外ドメイン・許可外スキームをすべて拒否する。

    Args:
        url: 検証対象の URL 文字列。

    Returns:
        許可される URL であれば True、それ以外は False。
    """
    try:
        parsed = urllib.parse.urlparse(url)
    except Exception:
        return False

    if parsed.scheme not in _ALLOWED_SCHEMES:
        return False

    hostname = parsed.hostname or ""
    # ドメイン検証（末尾一致で mext.go.jp サブドメインも許可）
    if not any(
        hostname == domain or hostname.endswith("." + domain)
        for domain in _ALLOWED_DOMAINS
    ):
        return False

    # 内部 IP・ローカルホストを拒否（SSRF 対策）
    _BLOCKED_PREFIXES = (
        "127.",
        "10.",
        "192.168.",
        "169.254.",
        "::1",
        "localhost",
        "0.0.0.0",
    )
    if any(hostname.startswith(pfx) or hostname == pfx for pfx in _BLOCKED_PREFIXES):
        return False

    # 172.16.0.0/12 も拒否
    if hostname.startswith("172."):
        try:
            second_octet = int(hostname.split(".")[1])
            if 16 <= second_octet <= 31:
                return False
        except (IndexError, ValueError):
            return False

    return True


def _url_exists(url: str, timeout: float = 5.0) -> bool:
    """URL の実在性を HTTP HEAD（失敗時は GET）で確認する。

    Args:
        url: 確認対象の URL。
        timeout: 接続タイムアウト秒数。

    Returns:
        HTTP 200 が返れば True、それ以外は False。
    """
    if not _is_allowed_mext_url(url):
        return False

    req_head = urllib.request.Request(url, method="HEAD")
    req_head.add_header("User-Agent", _USER_AGENT)

    try:
        with urllib.request.urlopen(req_head, timeout=timeout) as resp:
            return resp.status == 200
    except urllib.error.HTTPError as exc:
        # HEAD を受け付けないサーバがあるため GET にフォールバック
        if exc.code in (405, 501):
            req_get = urllib.request.Request(url, method="GET")
            req_get.add_header("User-Agent", _USER_AGENT)
            try:
                with urllib.request.urlopen(req_get, timeout=timeout) as resp:
                    return resp.status == 200
            except Exception:
                return False
        return False
    except Exception:
        return False


def fetch_latest_mext_pdf_urls() -> dict[str, object]:
    """文科省サイトにアクセスし、PDF 候補 URL を取得・検証して返す。

    処理の概要:
    1. MEXT_BASE_URL の HTML を取得する。
    2. <a href="...pdf"> 形式のリンクを抽出・正規化する。
    3. 各 URL の実在性を HTTP HEAD で確認する。
    4. 成功時は urls リスト付き dict を、失敗時は error dict を返す。

    Returns:
        成功時: {"status": "ok", "source": str, "count": int, "urls": list[str]}
        失敗時: {"status": "error", "message": str, "reason_code": str}
    """
    # ステップ 1: HTML 取得
    try:
        req = urllib.request.Request(MEXT_BASE_URL)
        req.add_header("User-Agent", _USER_AGENT)
        with urllib.request.urlopen(req, timeout=10) as resp:
            raw_bytes: bytes = resp.read()
            # エンコーディングを Content-Type から推定（フォールバック: utf-8）
            content_type: str = resp.headers.get("Content-Type", "")
            charset = "utf-8"
            if "charset=" in content_type:
                charset = content_type.split("charset=")[-1].strip().split(";")[0].strip()
            html = raw_bytes.decode(charset, errors="replace")
    except urllib.error.URLError as exc:
        return {
            "status": "error",
            "message": f"文科省サイトへの接続に失敗しました: {exc.reason}",
            "reason_code": "NETWORK_ERROR",
        }
    except Exception as exc:
        return {
            "status": "error",
            "message": f"HTML 取得中に予期しないエラーが発生しました: {exc}",
            "reason_code": "FETCH_ERROR",
        }

    # ステップ 2: PDF URL 抽出
    try:
        candidate_urls = _extract_pdf_urls(html, MEXT_BASE_URL)
    except Exception as exc:
        return {
            "status": "error",
            "message": f"PDF URL 抽出中にエラーが発生しました: {exc}",
            "reason_code": "PARSE_ERROR",
        }

    if not candidate_urls:
        return {
            "status": "error",
            "message": "PDF URL が見つかりませんでした。ページ構造が変更された可能性があります。",
            "reason_code": "NO_PDF_FOUND",
        }

    # ステップ 3: URL 実在性確認
    try:
        verified_urls = [url for url in candidate_urls if _url_exists(url)]
    except Exception as exc:
        return {
            "status": "error",
            "message": f"URL 実在性確認中にエラーが発生しました: {exc}",
            "reason_code": "VALIDATION_ERROR",
        }

    return {
        "status": "ok",
        "source": MEXT_BASE_URL,
        "count": len(verified_urls),
        "urls": verified_urls,
    }
