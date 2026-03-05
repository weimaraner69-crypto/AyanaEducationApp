"""backend.services.mext_pdf_parser のユニットテスト。

正常系・失敗系・境界値を網羅。
"""
from __future__ import annotations
import os
import pytest
from backend.services.mext_pdf_parser import parse_mext_pdf, ParseMextPdfError

SAMPLE_PDF_PATH = os.path.join(os.path.dirname(__file__), "sample_mext.pdf")


def _make_fake_pdf_bytes() -> bytes:
    # 最小限のPDFヘッダのみ（pdfplumberは失敗する想定）
    return b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<<>>\nstartxref\n0\n%%EOF"


class TestParseMextPdf:
    def test_parse_valid_pdf_path(self):
        """正常系: 存在するPDFファイルパスでテキスト・表抽出できる"""
        if not os.path.exists(SAMPLE_PDF_PATH):
            pytest.skip("サンプルPDFが存在しないためスキップ")
        result = parse_mext_pdf(SAMPLE_PDF_PATH)
        assert result["status"] == "ok"
        assert isinstance(result["text"], str)
        assert isinstance(result["tables"], list)

    def test_parse_valid_pdf_bytes(self):
        """正常系: PDFバイト列でテキスト・表抽出できる（サンプルPDFが必要）"""
        if not os.path.exists(SAMPLE_PDF_PATH):
            pytest.skip("サンプルPDFが存在しないためスキップ")
        with open(SAMPLE_PDF_PATH, "rb") as f:
            pdf_bytes = f.read()
        result = parse_mext_pdf(pdf_bytes)
        assert result["status"] == "ok"
        assert isinstance(result["text"], str)
        assert isinstance(result["tables"], list)

    def test_parse_invalid_type(self):
        """失敗系: 未対応型入力は例外・理由コード"""
        with pytest.raises(ParseMextPdfError) as e:
            parse_mext_pdf(12345)
        assert e.value.reason_code == "UNSUPPORTED_INPUT_TYPE"

    def test_parse_pdf_syntax_error(self):
        """失敗系: 不正なPDFバイト列は構文エラー理由コード"""
        fake_pdf = _make_fake_pdf_bytes()
        with pytest.raises(ParseMextPdfError) as e:
            parse_mext_pdf(fake_pdf)
        # pdfplumber.pdf.PDFSyntaxError なら PDF_SYNTAX_ERROR
        assert e.value.reason_code in ("PDF_SYNTAX_ERROR", "PDF_PARSE_ERROR")

    def test_parse_file_not_found(self):
        """失敗系: 存在しないファイルパスは解析失敗理由コード"""
        with pytest.raises(ParseMextPdfError) as e:
            parse_mext_pdf("/no/such/file.pdf")
        assert e.value.reason_code == "PDF_PARSE_ERROR"
