# MagicFolder — Python OCR fallback (PaddleOCR + EasyOCR)

When **OCR_PYTHON_FALLBACK** is enabled, the server calls a Python script after Tesseract (and multi-pass PSM). The fallback is **production-frozen**; see [magicfolder-ocr-fallback-contract.md](magicfolder-ocr-fallback-contract.md) and `.cursor/rules/ocr-fallback-frozen.mdc`. If Tesseract returns low confidence or very short text, the script runs **PaddleOCR** first, then **EasyOCR** if needed, and the longer result is used. This improves accuracy before paying for Google Cloud Vision.

---

## 1. When it runs

The fallback is invoked only when **all** of the following are true:

- **OCR_PYTHON_FALLBACK** is set to `1`, `true`, or `yes`.
- The image was processed by Tesseract (including multi-pass PSM).
- Either **confidence &lt; TESSERACT_CONFIDENCE_THRESHOLD** or **extracted text length &lt; 15**.
- The fallback script returns more text than Tesseract; otherwise the Tesseract result is kept.

When the fallback is used, `extractedFields.ocrFallback` is set to `"paddle_easy"` for the document.

---

## 2. Setup

### 2.1 Python

- **Python 3.8+** must be available on the server (or worker) that runs MagicFolder OCR.
- On Windows, if the default command is `python`, set **OCR_PYTHON_EXE=python** (the default is `python3`).

### 2.2 Virtual environment (recommended)

To avoid conflicts with other projects, use a **project-local venv** and install OCR packages there:

From the project root:

```bash
node scripts/setup-ocr-venv.mjs
```

This creates `.venv/` and installs PaddleOCR, EasyOCR, and their dependencies. Then set **OCR_PYTHON_EXE** so the app uses the venv’s Python:

- **Windows:** `OCR_PYTHON_EXE=.venv\Scripts\python.exe` (or absolute path, e.g. `C:\path\to\project\.venv\Scripts\python.exe`)
- **Linux / macOS:** `OCR_PYTHON_EXE=.venv/bin/python` (or absolute path)

The path is resolved from the process working directory (usually the project root when running the app).

### 2.3 Dependencies (without venv)

If you prefer not to use a venv, from the project root:

```bash
pip install -r scripts/requirements-ocr.txt
```

This installs into your global (or current) Python environment:

- **paddlepaddle** and **paddleocr** — primary fallback.
- **easyocr** — used when PaddleOCR returns no text.

### 2.4 Script path

- Default script: **scripts/ocr-fallback.py** (resolved from `process.cwd()`).
- Override with **OCR_PYTHON_SCRIPT** (absolute path) if you deploy the script elsewhere.

### 2.5 Environment

| Variable                  | Default                                 | Description                                       |
| ------------------------- | --------------------------------------- | ------------------------------------------------- |
| **OCR_PYTHON_FALLBACK**   | off                                     | Set `1` / `true` / `yes` to enable.               |
| **OCR_PYTHON_EXE**        | `python3`                               | Python executable.                                |
| **OCR_PYTHON_SCRIPT**     | `process.cwd()/scripts/ocr-fallback.py` | Path to the fallback script.                      |
| **OCR_PYTHON_TIMEOUT_MS** | `90000`                                 | Timeout in ms for the Python process.             |
| **OCR_LANG**              | from **TESSERACT_LANG** (first part)    | Language passed to PaddleOCR/EasyOCR (e.g. `en`). |

---

## 3. Flow

1. Node writes the preprocessed image buffer to a temp file.
2. Node spawns: `OCR_PYTHON_EXE OCR_PYTHON_SCRIPT <temp_path>` with **OCR_LANG** in env.
3. **scripts/ocr-fallback.py** runs PaddleOCR on the image; if the result is empty, runs EasyOCR.
4. Script prints extracted text to stdout (UTF-8) and exits 0 on success.
5. Node reads stdout (with **OCR_PYTHON_TIMEOUT_MS**), then deletes the temp file.
6. If the fallback text is longer than Tesseract’s, it is used and `ocrFallback: "paddle_easy"` is stored.

---

## 4. Deployment notes

- **Vercel serverless:** Python and the script are not available by default. Use this fallback only on a **Node worker** or **VM** that has Python and the dependencies installed (e.g. a BullMQ worker or a long-running server).
- **Docker:** Install Python and `pip install -r scripts/requirements-ocr.txt` in the image if the same container runs OCR jobs.
- **Cold start:** The first PaddleOCR/EasyOCR run in a process can be slow (model load); the 90s default timeout allows for that.

---

## 5. Disabling

- Leave **OCR_PYTHON_FALLBACK** unset or set it to `0` / `false` / `no`. Tesseract (and multi-pass PSM) continue to run as before; the Python script is never called.
