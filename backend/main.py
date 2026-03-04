"""FastAPI バックエンドのエントリポイント。"""

from __future__ import annotations

import os
from urllib.parse import urlparse

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def _is_safe_local_origin(origin: str) -> bool:
    """ローカル開発用として安全なオリジンか判定する。"""
    parsed = urlparse(origin)
    return (
        parsed.scheme in {"http", "https"}
        and parsed.hostname in {"localhost", "127.0.0.1"}
        and parsed.path in {"", "/"}
        and not parsed.query
        and not parsed.fragment
    )


def _get_cors_origins() -> list[str]:
    """許可する CORS オリジン一覧を返す。"""
    default_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    env_origins = os.getenv("BACKEND_CORS_ORIGINS", "")
    extra_origins = [
        origin.strip()
        for origin in env_origins.split(",")
        if origin.strip() and _is_safe_local_origin(origin.strip())
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
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    """ヘルスチェック結果を返す。"""
    return {"status": "ok"}
