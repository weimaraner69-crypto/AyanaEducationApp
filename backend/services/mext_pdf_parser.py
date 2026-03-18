"""MEXT PDF 解析サービス: PDFからテキスト・表を抽出する。"""

from __future__ import annotations
from typing import Any, Union
import io


# 型チェック時はimportをスキップ
import typing
if typing.TYPE_CHECKING:
    import pdfplumber
    from pdfminer.pdfparser import PDFSyntaxError as PdfMinerSyntaxError
    from pdfplumber.utils.exceptions import PdfminerException
else:
    import pdfplumber
    from pdfminer.pdfparser import PDFSyntaxError as PdfMinerSyntaxError
    from pdfplumber.utils.exceptions import PdfminerException


class ParseMextPdfError(Exception):
    """PDF解析失敗時の例外（理由コード付き）"""

    def __init__(self, message: str, reason_code: str):
        super().__init__(message)
        self.reason_code = reason_code


def parse_mext_pdf(pdf: Union[str, bytes]) -> dict[str, Any]:
    """
    MEXT配布PDFからテキスト・表を抽出する。

    Args:
        pdf: ファイルパス(str)またはPDFバイト列(bytes)

    Returns:
        {
            "status": "ok",
            "text": 全ページ結合テキスト,
            "tables": [各ページの表データ（2次元リスト）]
        }

    Raises:
        ParseMextPdfError: 解析失敗時（理由コード付き）
    """
    try:
        if isinstance(pdf, str):
            pdf_file = open(pdf, "rb")
            close_file = True
        elif isinstance(pdf, bytes):
            pdf_file: io.BytesIO = io.BytesIO(pdf)  # type: ignore
            close_file = False
        else:
            raise ParseMextPdfError("未対応の入力型", "UNSUPPORTED_INPUT_TYPE")
        try:
            with pdfplumber.open(pdf_file) as pdf_doc:
                all_text = ""
                all_tables = []
                for page in pdf_doc.pages:
                    all_text += page.extract_text() or ""
                    tables = page.extract_tables()
                    all_tables.extend(tables)
        finally:
            if close_file:
                pdf_file.close()
        return {"status": "ok", "text": all_text, "tables": all_tables}
    except (PdfMinerSyntaxError, PdfminerException) as e:
        raise ParseMextPdfError(f"PDF構文エラー: {e}", "PDF_SYNTAX_ERROR")
    except FileNotFoundError as e:
        raise ParseMextPdfError(f"ファイルが存在しません: {e}", "PDF_PARSE_ERROR")
    except ParseMextPdfError:
        raise
    except Exception as e:
        raise ParseMextPdfError(f"PDF解析失敗: {e}", "PDF_PARSE_ERROR")
