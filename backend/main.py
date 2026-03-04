"""FastAPI バックエンドのエントリポイント。"""

from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def _get_cors_origins() -> list[str]:
    """許可する CORS オリジン一覧を返す。"""
    default_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    env_origins = os.getenv("BACKEND_CORS_ORIGINS", "")
    extra_origins = [origin.strip()
                     for origin in env_origins.split(",") if origin.strip()]

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
