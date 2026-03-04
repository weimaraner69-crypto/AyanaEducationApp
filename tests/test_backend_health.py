"""FastAPI ヘルスチェック API のテスト。"""

from fastapi.testclient import TestClient

from backend.main import _get_cors_origins, app


client = TestClient(app)


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


def test_get_cors_origins_ignores_unsafe_env_origin(monkeypatch) -> None:
    """環境変数の非ローカルオリジンは無視される。"""
    scheme = "http"
    sep = "://"
    local_origin = f"{scheme}{sep}localhost:9000"
    unsafe_origin = f"{scheme}{sep}example.invalid:9000"
    monkeypatch.setenv("BACKEND_CORS_ORIGINS", f"{local_origin},{unsafe_origin}")

    origins = _get_cors_origins()
    assert local_origin in origins
    assert unsafe_origin not in origins
