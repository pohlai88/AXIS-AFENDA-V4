# MagicFolder OCR fallback — Production contract (frozen)

**Do not change the fallback implementation except for security or critical fixes.** This document is the single source of truth for the interface between Node and the Python script. Changes here would require coordinated updates and re-validation.

---

## Ignore in Cursor / editor (avoid accidental edits)

Same idea as `.env` in `.gitignore`: keep the fallback out of normal flow so you don’t touch it by mistake.

1. **`.cursorignore`** (project root) — Excludes files from Cursor’s codebase index so they aren’t suggested for edits. Create or edit `.cursorignore` and add:
   ```
   scripts/ocr-fallback.py
   scripts/requirements-ocr.txt
   docs/magicfolder-ocr-fallback-contract.md
   ```
2. **Workspace exclude** — `.vscode/settings.json` can hide these from the file explorer via `files.exclude` (already configured below if you use this repo).

---

## 1. Contract version

- **Script:** `CONTRACT_VERSION = "1"` in `scripts/ocr-fallback.py`.
- **Check:** Run `OCR_PYTHON_EXE scripts/ocr-fallback.py --contract`; stdout must be `1` and exit code 0.

---

## 2. Invocation (Node → Python)

| Item            | Value                                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Executable**  | `OCR_PYTHON_EXE` env (default `python3`).                                                                                    |
| **Script path** | `OCR_PYTHON_SCRIPT` env or `process.cwd()/scripts/ocr-fallback.py`.                                                          |
| **Argv**        | `[ scriptPath, imagePath ]` where `imagePath` is a temp file (same process user, same machine).                              |
| **Env**         | Inherit `process.env`; set `OCR_LANG` to first part of `TESSERACT_LANG` (e.g. `eng` → passed as `eng`; script maps to `en`). |
| **Stdin**       | Not used.                                                                                                                    |
| **Stdout**      | UTF-8 extracted text only. Node caps at `OCR_PYTHON_MAX_STDOUT_CHARS` (2 Mi chars).                                          |
| **Stderr**      | Ignored by Node.                                                                                                             |

---

## 3. Script interface (Python)

| Item             | Value                                                                          |
| ---------------- | ------------------------------------------------------------------------------ |
| **argv[1]**      | Image file path, or `--contract` to print `CONTRACT_VERSION` and exit 0.       |
| **Env OCR_LANG** | Language code (default `en`). Script maps `eng` → `en`.                        |
| **Stdout**       | Extracted text only, UTF-8. Max length 512_000 chars (truncated with newline). |
| **Exit 0**       | Success; stdout has content.                                                   |
| **Exit 1**       | No text, missing file, or invalid argv.                                        |

---

## 4. Node behaviour

- If script path is not readable → return `""` (no spawn).
- Temp file: `tmpdir()/ocr-<uuid>.<ext>`; `ext` from mime (png, webp, tiff, jpg). Deleted in `finally`.
- Timeout: `OCR_PYTHON_TIMEOUT_MS` (default 90_000 ms). On timeout or stdout overflow, child is killed with SIGTERM.
- Result: if exit 0 and non-empty trimmed stdout, use it; else use `""`. On any error or reject, return `""`.

---

## 5. Files covered by this contract

- **scripts/ocr-fallback.py** — Python entry and logic.
- **lib/server/magicfolder/ocr.ts** — function `runPythonOcrFallback` and constants `OCR_PYTHON_*`, `OCR_PYTHON_MAX_STDOUT_CHARS`.

---

## 6. Allowed changes

- **Security:** Dependency bumps (PaddleOCR, EasyOCR, Python), vulnerability fixes, sanitisation of paths or env.
- **Critical:** Fixes for wrong text extraction (e.g. encoding bug) or crashes that break the contract.
- **Not allowed:** New features, refactors, or behaviour changes that alter the contract above. For those, add a new contract version and document the change here.
