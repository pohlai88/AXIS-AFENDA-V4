#!/usr/bin/env python3
"""
MagicFolder OCR fallback — PRODUCTION-FROZEN. Do not modify except security/critical fixes.
Contract: docs/magicfolder-ocr-fallback-contract.md

- argv[1]: image path (or --contract to print CONTRACT_VERSION and exit 0).
- env OCR_LANG: language code (default "en"; "eng" mapped to "en").
- stdout: extracted text only (UTF-8). Exit 0 if text else 1.
- Max stdout length: 512_000 chars (truncated with newline if exceeded).
"""
from __future__ import annotations

import os
import sys

CONTRACT_VERSION = "1"
MAX_OUTPUT_CHARS = 512_000


def get_lang() -> str:
    raw = os.environ.get("OCR_LANG", "en").strip() or "en"
    return "en" if raw == "eng" else raw


def _paddle_line_text(line: object) -> str:
    if not line or not isinstance(line, (list, tuple)) or len(line) < 2:
        return ""
    text_part = line[1]
    if isinstance(text_part, (list, tuple)) and len(text_part) >= 1:
        return str(text_part[0]).strip()
    if isinstance(text_part, str):
        return text_part.strip()
    return ""


def extract_paddle(img_path: str, lang: str) -> str:
    from paddleocr import PaddleOCR

    ocr = PaddleOCR(
        use_angle_cls=False,
        lang=lang,
        show_log=False,
        use_gpu=False,
    )
    result = ocr.ocr(img_path, cls=False)
    if not result:
        return ""
    lines: list[str] = []
    try:
        for page in result:
            if not page:
                continue
            if isinstance(page, (list, tuple)):
                for line in page:
                    t = _paddle_line_text(line)
                    if t:
                        lines.append(t)
            else:
                t = _paddle_line_text(page)
                if t:
                    lines.append(t)
    except (IndexError, TypeError):
        pass
    return "\n".join(lines)


def extract_easyocr(img_path: str, lang: str) -> str:
    import easyocr

    lang_list = [lang] if lang else ["en"]
    reader = easyocr.Reader(lang_list, gpu=False, verbose=False)
    result = reader.readtext(img_path)
    if not result:
        return ""
    lines = []
    for item in result:
        if len(item) >= 2:
            lines.append(str(item[1]).strip())
    return "\n".join(l for l in lines if l)


def main() -> int:
    if len(sys.argv) < 2:
        return 1
    if sys.argv[1] == "--contract":
        print(CONTRACT_VERSION, flush=True)
        return 0
    img_path = sys.argv[1]
    if not os.path.isfile(img_path):
        return 1
    lang = get_lang()
    text = ""

    try:
        text = extract_paddle(img_path, lang)
    except Exception:
        pass

    if not text.strip():
        try:
            text = extract_easyocr(img_path, lang)
        except Exception:
            pass

    out = (text or "").strip()
    if len(out) > MAX_OUTPUT_CHARS:
        out = out[:MAX_OUTPUT_CHARS] + "\n"
    if out:
        if hasattr(sys.stdout, "reconfigure") and getattr(sys.stdout, "encoding", None) and sys.stdout.encoding.lower() != "utf-8":
            sys.stdout.reconfigure(encoding="utf-8")
        print(out, flush=True)
        return 0
    return 1


if __name__ == "__main__":
    sys.exit(main())
