# MagicFolder OCR — Audit & feedback

Audit of the OCR stack (Tesseract + multi-pass PSM + preprocessing + Python fallback) and how to validate after installation.

---

## 1. Conflict check

| Area                      | Status             | Notes                                                                                                                                                                                                                  |
| ------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Node vs Python**        | No conflict        | Node uses `tesseract.js` and `sharp`; Python is only invoked when `OCR_PYTHON_FALLBACK=1` and Tesseract result is weak. No shared packages.                                                                            |
| **Env vars**              | No overlap         | `TESSERACT_*` and `OCR_*` are distinct. `OCR_LANG` is derived from `TESSERACT_LANG` (first part) when calling the script.                                                                                              |
| **Script path**           | Single source      | `OCR_PYTHON_SCRIPT` defaults to `process.cwd()/scripts/ocr-fallback.py`; no duplicate logic.                                                                                                                           |
| **Python venv vs global** | Your choice        | Use `.venv` (run `node scripts/setup-ocr-venv.mjs`) and set `OCR_PYTHON_EXE=.venv\Scripts\python.exe` (Windows) or `.venv/bin/python` (Unix) to isolate deps. Or use system Python and leave `OCR_PYTHON_EXE` default. |
| **package.json**          | No OCR Python deps | PaddleOCR/EasyOCR are not Node packages; they are installed via pip/venv. No version clash with Node.                                                                                                                  |

---

## 2. Validation script

After installing Node deps (`pnpm install`) and optionally Python/venv + OCR packages:

```bash
pnpm run validate:ocr-setup
```

This checks:

- **scripts/ocr-fallback.py** exists and is readable
- **scripts/requirements-ocr.txt** exists
- **OCR_PYTHON_EXE** (or default `python3`) runs and reports a version
- **ocr-fallback.py** runs (given a missing image it should exit 1; script and deps are loadable)
- **OCR_PYTHON_FALLBACK** state (enabled/disabled) and consistency with the above

If the Python executable is missing or the script fails to run, the validator reports errors when fallback is enabled, and warnings when it is disabled.

---

## 3. Feedback summary

- **Tesseract path:** Preprocessing (resize, normalise, grayscale) → Tesseract with optional multi-pass PSM (3, 6, 11) → if confidence low or text short and `OCR_PYTHON_FALLBACK=1`, run Python script → use longer of Tesseract vs Python result. No conflicting order or duplicate calls.
- **Python path:** PaddleOCR first, then EasyOCR if no text; single stdout contract; Node cleans up temp file and handles timeout. No conflict with Node event loop (spawn is async).
- **Deployment:** Vercel serverless does not run the Python script (no Python in that environment). Use fallback only where Python + script + deps are installed (e.g. BullMQ worker or long-running server). Validation script is for local or worker environments.

---

## 4. Quick reference

| Command                                  | Purpose                                          |
| ---------------------------------------- | ------------------------------------------------ |
| `pnpm install`                           | Node deps (tesseract.js, sharp, pdf-parse, etc.) |
| `node scripts/setup-ocr-venv.mjs`        | Create `.venv` and install PaddleOCR + EasyOCR   |
| `pnpm run validate:ocr-setup`            | Check script, Python, and env (no conflicts)     |
| `pnpm run validate:env-magicfolder-cron` | Check cron/Redis/Tesseract env                   |

If `validate:ocr-setup` passes after your installation, the setup is consistent and there are no detected conflicts.
