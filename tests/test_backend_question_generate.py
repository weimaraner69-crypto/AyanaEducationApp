import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_api_question_generate_normal():
    """
    正常系: テキストから問題生成APIが正常応答
    """
    payload = {"text": "Python言語は人気があります。JavaScriptも人気です。"}
    res = client.post("/api/question/generate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "data" in data
    assert "question" in data["data"]
    assert "choices" in data["data"]
    assert "answer" in data["data"]


def test_api_question_generate_no_text():
    """
    失敗系: テキストなし
    """
    res = client.post("/api/question/generate", json={})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "fail"
    assert data["reason_code"] == "NO_TEXT_DATA"


def test_api_question_generate_empty_text():
    """
    失敗系: 空文字列
    """
    res = client.post("/api/question/generate", json={"text": "   "})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "fail"
    assert data["reason_code"] == "NO_VALID_SENTENCE"


def test_api_question_generate_no_blankable_word():
    """
    失敗系: 5文字以上の単語がない
    """
    res = client.post("/api/question/generate", json={"text": "a b c d e."})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "fail"
    assert data["reason_code"] == "NO_BLANKABLE_WORD"


def test_api_question_generate_short_sentence():
    """
    境界値: 5文字ちょうどの単語
    """
    res = client.post("/api/question/generate", json={"text": "appleは果物です。"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["data"]["answer"] == "apple"
