# MagicFolder — Tesseract.js Evaluation

Evaluation of the Tesseract.js integration for image OCR in `lib/server/magicfolder/ocr.ts`.

---

## 1. Integration summary

- **Package:** `tesseract.js@^7.0.0` (installed).
- **Usage:** Dynamic `import("tesseract.js")` in `extractTextFromBuffer()` for MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/tiff`.
- **Flow:** `createWorker("eng", undefined, { logger: () => {} })` → `worker.recognize(buffer)` → `data.text` → `worker.terminate()`.
- **Fallback:** If the module is missing or recognition throws, we return `{ text: "" }` (no crash).

---

## 2. Accuracy

- **Strengths:** Good for printed text and clear scans; supports 100+ languages (we use `"eng"`).
- **Limitations:** Handwritten text is weaker; low resolution or heavy skew/noise reduce accuracy. No layout analysis (tables, columns) — output is a single text block.
- **Recommendation:** For forms or structured docs, consider adding a second pass (e.g. regex on `data.words`/`data.lines` for coordinates) or a dedicated form OCR later.

---

## 3. Performance

- **Cold start:** First call loads the Tesseract WASM/worker; can add ~1–3s per process.
- **Per image:** Recognition typically 0.5–3s depending on size and complexity.
- **Worker lifecycle:** We create one worker per image and call `terminate()` in a `finally` block to avoid leaks. In serverless (e.g. Vercel), reuse across requests is often not possible (cold invocations), so per-request worker create/terminate is acceptable.
- **Recommendation:** For high throughput, run OCR in a long-lived worker process (e.g. BullMQ worker) so one worker can process many images without repeated startup.

---

## 4. API usage

- **Correct:** We use the public `createWorker` + `recognize(buffer)` + `terminate()` API; `recognize` accepts a Node `Buffer` (typed as `Buffer | string` in our declaration).
- **Logger:** We pass `{ logger: () => {} }` to suppress progress logs in production.
- **Language:** Configurable via `TESSERACT_LANG` (default `"eng"`); use `"eng+deu"` etc. for multi-language.

---

## 5. Possible improvements (implemented)

| Improvement                                    | Status   | Notes                                                                                          |
| ---------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| **Multi-language**                             | Done     | `TESSERACT_LANG` env (default `eng`); e.g. `eng+deu` for multi-language.                       |
| **Preprocessing**                              | Done     | Optional sharp resize (max 2000px) before `recognize` when sharp is available.                 |
| **Confidence threshold**                       | Done     | If `data.confidence` &lt; 60, store `lowConfidence: true` and `confidence` in extractedFields. |
| **Timeout**                                    | Done     | 30s timeout around `recognize()` via Promise.race.                                             |
| **Worker reuse in a dedicated worker process** | Optional | Use job queue (e.g. BullMQ) for batch OCR; in-process queue already enqueues OCR.              |

---

## 6. Conclusion

The current integration is **correct and production-viable**: it degrades gracefully when Tesseract is missing or fails, uses the official API, and cleans up the worker. For higher volume or better accuracy, consider moving OCR to a job queue with worker reuse and optional preprocessing.
