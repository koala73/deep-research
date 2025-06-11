from pathlib import Path
from typing import Optional
import sys

from fpdf import FPDF

# Use DejaVuSans font which supports a wide range of Unicode characters
DEFAULT_FONT_PATH = Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')

class UnicodePDF(FPDF):
    """FPDF subclass with DejaVuSans loaded for Unicode support."""

    def __init__(self, font_path: Optional[str] = None, **kwargs) -> None:
        super().__init__(**kwargs)
        font_path = font_path or str(DEFAULT_FONT_PATH)
        # Register DejaVuSans as a Unicode font
        self.add_font('DejaVu', '', font_path, uni=True)
        self.set_font('DejaVu', '', 12)

    def add_unicode_page(self) -> None:
        """Convenience to add a page and set the Unicode font."""
        self.add_page()
        self.set_font('DejaVu', '', 12)

def text_to_pdf(text: str, output_path: str, font_path: Optional[str] = None) -> None:
    """Render text to a PDF file using a Unicode font."""
    pdf = UnicodePDF(font_path=font_path)
    pdf.add_unicode_page()
    pdf.write(5, text)
    pdf.output(output_path)


def _main() -> None:
    if len(sys.argv) != 3:
        print("Usage: python -m utils.pdf_utils <input.txt> <output.pdf>")
        raise SystemExit(1)

    text = Path(sys.argv[1]).read_text(encoding="utf-8")
    text_to_pdf(text, sys.argv[2])


if __name__ == "__main__":
    _main()
