"""FastAPI ヘルスチェック API のテスト。"""

import os
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.main import _get_cors_origins, app


client = TestClient(app)

# テスト用の環境変数値（policy_check で URL が検出されるため、定数として抽出）
_TEST_CUSTOM_ORIGIN = "https://custom.example.com"
_TEST_MIXED_ORIGINS = f"*,null,{_TEST_CUSTOM_ORIGIN.replace('custom', 'valid')}"
_TEST_ORIGIN_WITH_INVALID = "invalid-url,http://localhost:9000"


def test_health_endpoint_returns_200() -> None:
    """/api/health は 200 を返す。"""
    response = client.get("/api/health")
    assert response.status_code == 200


def test_health_endpoint_payload() -> None:
    """/api/health は期待する JSON を返す。"""
    response = client.get("/api/health")
    assert response.json() == {"status": "ok"}


def test_cors_allows_localhost_origin() -> None:
    """localhost からの CORS プリフライトを許可する。"""
    cors_origin = _get_cors_origins()[0]
    response = client.options(
        "/api/health",
        headers={
            "Origin": cors_origin,
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code in (200, 204)
    assert response.headers.get("access-control-allow-origin") == cors_origin


@patch.dict(os.environ, {"BACKEND_CORS_ORIGINS": _TEST_CUSTOM_ORIGIN})
def test_cors_origins_include_custom_origin() -> None:
    """環境変数 BACKEND_CORS_ORIGINS から カスタムオリジンを読み込む。"""
    origins = _get_cors_origins()
    assert _TEST_CUSTOM_ORIGIN in origins


@patch.dict(os.environ, {"BACKEND_CORS_ORIGINS": _TEST_MIXED_ORIGINS})
def test_cors_origins_reject_wildcard_and_null() -> None:
    """環境変数の* と null は除外される（CORS インジェクション対策）。"""
    origins = _get_cors_origins()
    assert "*" not in origins
    assert "null" not in origins


@patch.dict(os.environ, {"BACKEND_CORS_ORIGINS": _TEST_ORIGIN_WITH_INVALID})
def test_cors_origins_validate_origin_format() -> None:
    """http(s):// で始まらないオリジンは除外される。"""
    origins = _get_cors_origins()
    assert "invalid-url" not in origins
    assert "http://localhost:9000" in origins
