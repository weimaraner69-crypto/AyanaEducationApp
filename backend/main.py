"""FastAPI バックエンドのエントリポイント。"""
from __future__ import annotations

import os
import re as _re
import urllib.parse
import urllib.request

from fastapi import FastAPI, Body, File, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from backend.services.mext_fetcher import fetch_latest_mext_pdf_urls
from backend.services.mext_pdf_parser import ParseMextPdfError, parse_mext_pdf
from backend.services.question_generator import QuestionGenerationError, generate_question

# SSRF 保護: PDF処理で許可するドメイン（C-001 準拠）
_PDF_ALLOWED_DOMAINS: tuple[str, ...] = ("www.mext.go.jp", "mext.go.jp")
_PDF_ALLOWED_SCHEMES: tuple[str, ...] = ("http", "https")

# アップロードファイルサイズ上限（DoS 対策、SEC-002 準拠）
MAX_PDF_SIZE = 10 * 1024 * 1024  # 10MB

# CORS オリジンの検証パターン（http(s)://で始まり、ワイルドカードを含まない）
_ORIGIN_RE = _re.compile(r"^https?://[^*]+$")


def _get_cors_origins() -> list[str]:
    """許可する CORS オリジン一覧を返す。

    環境変数 BACKEND_CORS_ORIGINS に指定されたオリジンは検証される：
    - http(s):// で始まる
    - ワイルドカード（*）を含まない
    - "null" など仮想オリジンを含まない

    検証に失敗したオリジンは黙か除外される。
    """
    default_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    env_origins = os.getenv("BACKEND_CORS_ORIGINS", "")
    # 入力検証：http(s)://で始まり、ワイルドカードでないオリジンのみ許可
    extra_origins = [
        origin.strip()
        for origin in env_origins.split(",")
        if origin.strip() and _ORIGIN_RE.match(origin.strip())
    ]

    merged: list[str] = []
    for origin in [*default_origins, *extra_origins]:
        if origin not in merged:
            merged.append(origin)
    return merged


def _is_safe_pdf_url(url: str) -> bool:
    """URL が許可ドメインかつ安全なスキームであるか検証する（SSRF 対策）。"""
    try:
        parsed = urllib.parse.urlparse(url)
    except Exception:
        return False
    if parsed.scheme not in _PDF_ALLOWED_SCHEMES:
        return False
    # パス部分が .pdf で終わることを確認（C-001 準拠）
    if not parsed.path.lower().endswith('.pdf'):
        return False
    hostname = parsed.hostname or ""
    return any(hostname == d or hostname.endswith("." + d) for d in _PDF_ALLOWED_DOMAINS)


app = FastAPI(title="MiraStudy Backend API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.post("/api/question/generate")
async def question_generate(request: Request) -> dict[str, object]:
    """
    PDF解析結果（テキスト・表データ等）を受け取り、問題文・選択肢・正答を返す。
    失敗時は理由コード付きでfail-close。
    """
    try:
        body = await request.json()
        result = generate_question(body)
        return {"status": "ok", "data": result}
    except QuestionGenerationError as qe:
        return {"status": "fail", "reason_code": qe.reason_code, "message": str(qe)}
    except Exception as exc:
        return {"status": "error", "reason_code": "UNEXPECTED_ERROR", "message": f"予期しないエラー: {exc}"}


@app.get("/api/health")
def health_check() -> dict[str, str]:
    """ヘルスチェック結果を返す。"""
    return {"status": "ok"}


@app.get("/api/mext/fetch")
def mext_fetch() -> dict[str, object]:
    """文科省サイトから PDF 候補 URL を取得して返す。

    mext_fetcher.fetch_latest_mext_pdf_urls() に処理を委譲し、
    予期しない例外をフェイルクローズで捕捉して error JSON を返す。
    """
    try:
        return fetch_latest_mext_pdf_urls()
    except Exception as exc:
        return {
            "status": "error",
            "message": f"予期しないエラーが発生しました: {exc}",
            "reason_code": "UNEXPECTED_ERROR",
        }


# B-009: PDF ダウンロード＆解析エンドポイント


@app.post("/api/pdf/process")
async def pdf_process(payload: dict = Body(...)) -> dict[str, object]:
    """
    PDFのURLを受信し、ダウンロードして解析結果（テキスト・表データ）を返す。
    SSRF 保護付き: mext.go.jp ドメインのみ許可（C-001 準拠）。
    失敗時は理由コード付きでfail-close。
    """
    url = payload.get("url")
    if not url or not isinstance(url, str):
        return {"status": "fail", "reason_code": "NO_URL", "message": "URLが指定されていません"}
    if not _is_safe_pdf_url(url):
        return {
            "status": "fail",
            "reason_code": "C001_INVALID_SOURCE_URL",
            "message": "許可されていないURLです",
        }
    try:
        req = urllib.request.Request(
            url, headers={"User-Agent": "AyanaEducationBot/1.0"},
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            pdf_bytes = response.read()
        result = parse_mext_pdf(pdf_bytes)
        return {"status": "ok", "data": result}
    except ParseMextPdfError as pe:
        return {"status": "fail", "reason_code": pe.reason_code, "message": str(pe)}
    except Exception as exc:
        return {"status": "error", "reason_code": "UNEXPECTED_ERROR", "message": f"予期しないエラー: {exc}"}


# B-009: PDF アップロード＆解析エンドポイント


@app.post("/api/pdf/upload")
async def pdf_upload(file: UploadFile = File(...)) -> dict[str, object]:
    """
    PDFファイルを受信し、テキスト・表データを抽出して返す。
    失敗時は理由コード付きでfail-close。
    """
    try:
        content = await file.read(MAX_PDF_SIZE + 1)
        if len(content) > MAX_PDF_SIZE:
            return {
                "status": "fail",
                "reason_code": "FILE_TOO_LARGE",
                "message": f"ファイルサイズが上限（{MAX_PDF_SIZE // 1024 // 1024}MB）を超えています",
            }
        result = parse_mext_pdf(content)
        return {"status": "ok", "data": result}
    except ParseMextPdfError as pe:
        return {"status": "fail", "reason_code": pe.reason_code, "message": str(pe)}
    except Exception as exc:
        return {"status": "error", "reason_code": "UNEXPECTED_ERROR", "message": f"予期しないエラー: {exc}"}
