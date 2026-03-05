"""
問題生成サービス
PDF解析結果（テキスト・表データ等）から問題文・選択肢・正答を生成する。
"""
from typing import Any, Dict, List

class QuestionGenerationError(Exception):
    """
    問題生成失敗時の例外（理由コード付き）
    """
    def __init__(self, message: str, reason_code: str):
        super().__init__(message)
        self.reason_code = reason_code

def generate_question(parsed_pdf: Dict[str, Any]) -> Dict[str, Any]:
    """
    PDF解析結果から問題文・選択肢・正答を生成する。
    シンプルなルールベース（例: テキストから1文抽出し空欄化、選択肢生成）
    失敗時はQuestionGenerationErrorをraise
    Args:
        parsed_pdf: PDF解析結果（テキスト・表データ等を含むdict）
    Returns:
        問題データ（dict: question, choices, answer, meta）
    Raises:
        QuestionGenerationError: 生成失敗時
    """
    # テキストが存在しない場合はエラー
    text = parsed_pdf.get("text")
    if not text or not isinstance(text, str):
        raise QuestionGenerationError("テキストデータがありません", "NO_TEXT_DATA")

    # 1文目を抽出（ピリオド・句点区切り）
    import re
    sentences = re.split(r'[。\.\n]', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    if not sentences:
        raise QuestionGenerationError("有効な文が抽出できません", "NO_VALID_SENTENCE")
    base_sentence = sentences[0]

    # 英字のみ5文字以上の単語を優先的に抽出
    words = re.findall(r'[A-Za-z]{5,}', base_sentence)
    if not words:
        # それ以外は従来通り
        words = re.findall(r'\w{5,}', base_sentence)
    if not words:
        raise QuestionGenerationError("空欄化できる単語がありません", "NO_BLANKABLE_WORD")
    answer = words[0]
    question = base_sentence.replace(answer, "____", 1)

    # 選択肢生成（正答＋ダミー）
    choices: List[str] = [answer]
    # ダミーは他の文から同じ長さの単語を抽出
    dummy_words: List[str] = []
    for sent in sentences[1:]:
        for w in re.findall(r'\w{5,}', sent):
            if w != answer and w not in dummy_words:
                dummy_words.append(w)
            if len(dummy_words) >= 3:
                break
        if len(dummy_words) >= 3:
            break
    while len(dummy_words) < 3:
        dummy_words.append(f"dummy{len(dummy_words)+1}")
    choices += dummy_words[:3]

    # シャッフル
    import random
    random.shuffle(choices)

    return {
        "question": question,
        "choices": choices,
        "answer": answer,
        "meta": {"source": "rule-based", "base_sentence": base_sentence}
    }