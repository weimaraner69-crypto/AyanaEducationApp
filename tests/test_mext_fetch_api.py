"""GET /api/mext/fetch エンドポイントのテスト。"""

from __future__ import annotations

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


class TestMextFetchEndpointSuccess:
    """正常系: サービスが ok dict を返す場合。"""

    def test_returns_200(self) -> None:
        """/api/mext/fetch は 200 を返す。"""
        mock_result = {
            "status": "ok",
            "source": "https://www.mext.go.jp/a_menu/shotou/new-cs/1384661.htm",
            "count": 2,
            "urls": [
                "https://www.mext.go.jp/content/sample1.pdf",
                "https://www.mext.go.jp/content/sample2.pdf",
            ],
        }
        with patch(
            "backend.main.fetch_latest_mext_pdf_urls", return_value=mock_result
        ):
            response = client.get("/api/mext/fetch")
        assert response.status_code == 200

    def test_payload_structure(self) -> None:
        """/api/mext/fetch は期待する JSON 構造を返す。"""
        mock_result = {
            "status": "ok",
            "source": "https://www.mext.go.jp/a_menu/shotou/new-cs/1384661.htm",
            "count": 1,
            "urls": ["https://www.mext.go.jp/content/test.pdf"],
        }
        with patch(
            "backend.main.fetch_latest_mext_pdf_urls", return_value=mock_result
        ):
            response = client.get("/api/mext/fetch")
        data = response.json()
        assert data["status"] == "ok"
        assert data["count"] == 1
        assert "urls" in data
        assert len(data["urls"]) == 1

    def test_urls_list_empty_when_no_verified(self) -> None:
        """PDF が 0 件でも ok ステータスで返せる（サービスが ok を返す場合）。"""
        mock_result = {
            "status": "ok",
            "source": "https://www.mext.go.jp/a_menu/shotou/new-cs/1384661.htm",
            "count": 0,
            "urls": [],
        }
        with patch(
            "backend.main.fetch_latest_mext_pdf_urls", return_value=mock_result
        ):
            response = client.get("/api/mext/fetch")
        data = response.json()
        assert data["status"] == "ok"
        assert data["count"] == 0
        assert data["urls"] == []


class TestMextFetchEndpointServiceError:
    """失敗系: サービスが error dict を返す場合。"""

    @pytest.mark.parametrize(
        "reason_code",
        ["NETWORK_ERROR", "FETCH_ERROR", "PARSE_ERROR", "NO_PDF_FOUND", "VALIDATION_ERROR"],
    )
    def test_returns_200_with_error_status(self, reason_code: str) -> None:
        """サービスが error dict を返しても HTTP 200 で返す。"""
        mock_result = {
            "status": "error",
            "message": "ダミーエラーメッセージ",
            "reason_code": reason_code,
        }
        with patch(
            "backend.main.fetch_latest_mext_pdf_urls", return_value=mock_result
        ):
            response = client.get("/api/mext/fetch")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "error"
        assert data["reason_code"] == reason_code

    def test_network_error_propagates_reason_code(self) -> None:
        """NETWORK_ERROR の reason_code がレスポンスに含まれる。"""
        mock_result = {
            "status": "error",
            "message": "文科省サイトへの接続に失敗しました: <urlopen error ...>",
            "reason_code": "NETWORK_ERROR",
        }
        with patch(
            "backend.main.fetch_latest_mext_pdf_urls", return_value=mock_result
        ):
            response = client.get("/api/mext/fetch")
        data = response.json()
        assert data["reason_code"] == "NETWORK_ERROR"


class TestMextFetchEndpointUnexpectedError:
    """例外系: サービスが予期しない例外を投げる場合。"""

    def test_unexpected_exception_returns_unexpected_error(self) -> None:
        """サービスが例外を投げると UNEXPECTED_ERROR で応答する。"""
        with patch(
            "backend.main.fetch_latest_mext_pdf_urls",
            side_effect=RuntimeError("予期しない内部エラー"),
        ):
            response = client.get("/api/mext/fetch")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "error"
        assert data["reason_code"] == "UNEXPECTED_ERROR"
        assert "予期しないエラー" in data["message"]

    def test_unexpected_exception_message_contains_original(self) -> None:
        """UNEXPECTED_ERROR のメッセージに元の例外メッセージが含まれる。"""
        with patch(
            "backend.main.fetch_latest_mext_pdf_urls",
            side_effect=ValueError("データ形式不正"),
        ):
            response = client.get("/api/mext/fetch")
        data = response.json()
        assert "データ形式不正" in data["message"]
