"""FastAPI ヘルスチェック API のテスト。"""

from fastapi.testclient import TestClient

from backend.main import app


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
    cors_origin = app.user_middleware[0].kwargs["allow_origins"][0]
    response = client.options(
        "/api/health",
        headers={
            "Origin": cors_origin,
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code in (200, 204)
    assert response.headers.get("access-control-allow-origin") == cors_origin
