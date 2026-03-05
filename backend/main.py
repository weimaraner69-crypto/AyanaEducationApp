"""FastAPI バックエンドのエントリポイント。"""

from __future__ import annotations

import os
import re as _re

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from backend.services.mext_fetcher import fetch_latest_mext_pdf_urls
from backend.services.question_generator import generate_question, QuestionGenerationError

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


app = FastAPI(title="MiraStudy Backend API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST"],  # B-008: POSTも許可
    allow_headers=["Content-Type"],
)

# B-008: 問題生成エンドポイント
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
