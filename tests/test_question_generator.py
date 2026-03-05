import pytest
from backend.services.question_generator import generate_question, QuestionGenerationError


def test_generate_question_normal():
    """
    正常系: テキストから問題・選択肢・正答が生成される
    """
    parsed_pdf = {"text": "Python言語は人気があります。JavaScriptも人気です。"}
    result = generate_question(parsed_pdf)
    assert "question" in result
    assert "choices" in result
    assert "answer" in result
    assert result["answer"] in result["choices"]
    assert "____" in result["question"]


def test_generate_question_no_text():
    """
    失敗系: テキストデータなし
    """
    with pytest.raises(QuestionGenerationError) as e:
        generate_question({})
    assert e.value.reason_code == "NO_TEXT_DATA"


def test_generate_question_empty_text():
    """
    失敗系: 空文字列
    """
    with pytest.raises(QuestionGenerationError) as e:
        generate_question({"text": "   "})
    assert e.value.reason_code == "NO_VALID_SENTENCE"


def test_generate_question_no_blankable_word():
    """
    失敗系: 5文字以上の単語がない
    """
    parsed_pdf = {"text": "a b c d e."}
    with pytest.raises(QuestionGenerationError) as e:
        generate_question(parsed_pdf)
    assert e.value.reason_code == "NO_BLANKABLE_WORD"


def test_generate_question_short_sentence():
    """
    境界値: 5文字ちょうどの単語
    """
    parsed_pdf = {"text": "appleは果物です。"}
    result = generate_question(parsed_pdf)
    assert result["answer"] == "apple"
