# MagicFolder — OCR: Tesseract (Installed) vs Google Cloud Vision

Evaluation of **accuracy** and **efficiency** between the current **Tesseract.js (installed)** integration and **Google Cloud Vision API** OCR for MagicFolder image/document text extraction.

---

## 1. Current Setup: Tesseract (Installed)

- **Implementation:** `lib/server/magicfolder/ocr.ts` — dynamic `import("tesseract.js")` for `image/jpeg`, `image/png`, `image/webp`, `image/tiff`.
- **Flow:** Optional sharp resize (max 2000px) → `createWorker(TESSERACT_LANG)` → `worker.recognize(buffer)` → `data.text` → `worker.terminate()`.
- **Config:** `TESSERACT_LANG` (default `eng`), 30s timeout, confidence threshold (store `lowConfidence` if &lt; 60).
- **Cost:** Free (open-source, no API key).
- **Network:** Fully offline; no external calls.

---

## 2. Accuracy Comparison

| Aspect                               | Tesseract (installed)                           | Google Cloud Vision OCR                     |
| ------------------------------------ | ----------------------------------------------- | ------------------------------------------- |
| **Printed text (clear scans)**       | Good                                            | Very good to excellent                      |
| **Handwritten text**                 | Weak                                            | Better (Document AI / handwriting models)   |
| **Complex layout (tables, columns)** | Single text block; no layout                    | Document Text Detection preserves structure |
| **Low resolution / noise / skew**    | Accuracy drops noticeably                       | More robust; ML-based preprocessing         |
| **Multiple fonts / sizes**           | Variable                                        | Handles well                                |
| **Multi-language**                   | Supported via `TESSERACT_LANG` (e.g. `eng+deu`) | Supported; auto-detect or specify           |
| **Confidence / quality signals**     | We expose `confidence` and `lowConfidence`      | API returns confidence per entity/word      |

**Summary:** Google Vision generally gives **higher accuracy** and is more robust on difficult images (handwriting, poor quality, complex layouts). Tesseract is **accurate enough** for clean printed text and simple scans; it degrades on noisy or complex documents.

---

## 3. Efficiency Comparison

### 3.1 Latency (per image)

| Factor                   | Tesseract (installed)                                                  | Google Cloud Vision                                                                         |
| ------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Cold start**           | ~1–3 s (WASM/worker load, first call per process)                      | N/A (stateless API)                                                                         |
| **Per-image processing** | ~0.5–3 s (CPU-bound, depends on size/complexity)                       | Typically **faster** (server-side GPU/TPU); dominated by **network RTT** (often 200–800 ms) |
| **Worker reuse**         | One worker per image today; reuse would reduce cold start amortization | N/A                                                                                         |

**Efficiency (throughput):**  
- **Tesseract:** Bounded by your server CPU; no per-request network cost; cold start hurts first request per process.  
- **Google:** Bounded by network and quota; no local CPU for recognition; often **faster wall-clock per image** once cold start is excluded, especially for larger images.

### 3.2 Resource usage

| Resource        | Tesseract (installed)                               | Google Cloud Vision                             |
| --------------- | --------------------------------------------------- | ----------------------------------------------- |
| **CPU**         | High during `recognize()`                           | Minimal (client only sends request)             |
| **Memory**      | Worker + WASM; moderate                             | Low (buffer + HTTP)                             |
| **Network**     | None for OCR                                        | One HTTPS request (+ response) per image        |
| **Scalability** | Scale by adding workers/processes; no per-image fee | Scale by request count; cost scales with volume |

### 3.3 Cost

|                          | Tesseract (installed) | Google Cloud Vision                                                                                 |
| ------------------------ | --------------------- | --------------------------------------------------------------------------------------------------- |
| **Per image**            | $0                    | First 1,000 images/month free; then **$1.50 per 1,000** (Text Detection or Document Text Detection) |
| **At 10k images/month**  | $0                    | ~\$13.50 (9k billed)                                                                                |
| **At 100k images/month** | $0                    | ~\$148.50                                                                                           |

**Summary:** Tesseract is **more efficient on cost** (free) and **efficient on network** (offline). Google is often **more efficient on time per image** and **server CPU**, at the cost of **recurring spend** and **dependency on network/API**.

---

## 4. When to Use Which

- **Prefer Tesseract (installed)** when:
  - Budget is tight or volume is high (cost efficiency matters).
  - Documents are mostly clean printed text or simple scans.
  - Offline / air-gapped or low-latency network is required.
  - You want no external API keys or vendor lock-in for OCR.

- **Prefer Google Cloud Vision** when:
  - Accuracy is paramount (forms, handwriting, poor scans, complex layout).
  - You want faster per-image processing and are okay with network and per-image cost.
  - You already use GCP and can centralize billing and quotas.

---

## 5. Best-practice alternatives to combine with Tesseract (before Google)

Before switching to Google Cloud Vision, you can **combine Tesseract with** one or more of these to improve accuracy and coverage without adding cost or an external API.

### 5.1 Multi-pass Tesseract (PSM modes) — easiest, same stack

**Idea:** Run Tesseract more than once with different **Page Segmentation Mode (PSM)** and keep the best result (e.g. longest text or highest confidence).

- **PSM 3** (default): automatic page segmentation.
- **PSM 6**: single uniform block of text (good for single-column docs).
- **PSM 11**: sparse text (good for labels, receipts, forms with scattered text).

**How to combine:**  
First run with PSM 3. If `confidence < CONFIDENCE_THRESHOLD` or `text.length` is very short, run again with PSM 6 and/or PSM 11; then take the result with the longest `text` or highest `confidence`. Tesseract.js supports `worker.setParameters({ tessedit_pageseg_mode: 3 })` (or 6, 11) before `recognize()`.

**Pros:** No new dependencies, same Node/TS process, well-documented best practice.  
**Cons:** 2–3× CPU time per image when you run multiple passes.

### 5.2 Stronger preprocessing (before Tesseract)

**Idea:** Improve the image before OCR so Tesseract sees cleaner input.

- You already use **sharp** resize (max 2000px).
- Add **normalise** (contrast) and, if needed, **grayscale** or a simple **threshold** (binarization) for noisy or low-contrast scans.
- **Deskew:** correct rotation (e.g. with sharp’s `rotate()` if you detect skew via a small heuristic or library).

**How to combine:**  
Run this pipeline (resize → normalise → optional grayscale/threshold/deskew) and pass the resulting buffer to Tesseract as you do now. No second OCR engine.

**Pros:** Same stack, no new OCR dependency, often improves Tesseract accuracy noticeably.  
**Cons:** Slightly more CPU per image; deskew logic can be non-trivial.

### 5.3 PaddleOCR or EasyOCR as fallback — best accuracy before Google

**Idea:** Use Tesseract first; if confidence is low or text is empty, call **PaddleOCR** or **EasyOCR** and use that result. Both are open-source and typically more accurate than Tesseract on difficult docs.

- **PaddleOCR:** High accuracy (e.g. ICDAR, document benchmarks), 80+ languages, Apache 2.0.
- **EasyOCR:** Python-based, 70+ languages, simple API.

**How to combine:**  
Both are Python libraries. From Node, invoke a small Python script via `child_process` (e.g. pass image path or base64, read stdout). In `extractTextFromBuffer()`: run Tesseract; if `confidence < threshold` or `!text.trim()`, call the Python OCR and return the fallback text (and optional confidence). Same `{ text, fields? }` contract for the rest of the pipeline.

**Pros:** Best open-source accuracy before Google; no per-image API cost; still self-hosted.  
**Cons:** Requires a Python environment and a small script; extra latency when fallback runs.

---

**Recommendation:** Start with **multi-pass Tesseract (PSM)** and **stronger preprocessing** — both are easy to add in the current codebase. Add **PaddleOCR or EasyOCR as fallback** only when you need higher accuracy on difficult images and can maintain a Python helper. Use **Google Vision** when you want the highest accuracy and are okay with API cost and network dependency.

**Implemented:** Multi-pass PSM and stronger preprocessing are implemented in `lib/server/magicfolder/ocr.ts`. Use `TESSERACT_PSM_MULTI_PASS`, `OCR_PREPROCESS_NORMALISE`, and `OCR_PREPROCESS_GRAYSCALE` (see `.env.example`) to toggle. **PaddleOCR + EasyOCR fallback** is also implemented: set `OCR_PYTHON_FALLBACK=1` and install Python deps with `pip install -r scripts/requirements-ocr.txt`; see [magicfolder-ocr-python-fallback.md](magicfolder-ocr-python-fallback.md).

---

## 6. Hybrid / Optional Google OCR (when you do go to Google)

To get both options in MagicFolder:

1. **Config:** e.g. `OCR_PROVIDER=tesseract` (default) or `OCR_PROVIDER=google` (with `GOOGLE_APPLICATION_CREDENTIALS` or Vision API key).
2. **Code:** In `extractTextFromBuffer()`, branch by provider:  
   - `tesseract` → current Tesseract.js path.  
   - `google` → send buffer to Cloud Vision (Text Detection or Document Text Detection), map response to same `{ text, fields? }` shape.
3. **Same pipeline:** `text.json`, `object_index`, suggestedTags, and FTS stay unchanged; only the extraction step differs.

This keeps **accuracy and efficiency** selectable per deployment (or per tenant, if you add tenant-level config later) without duplicating the rest of the OCR pipeline.

---

## 7. Summary Table

| Criteria                             | Tesseract (installed) | Google Cloud Vision            |
| ------------------------------------ | --------------------- | ------------------------------ |
| **Accuracy (clean print)**           | Good                  | Very good                      |
| **Accuracy (handwriting / complex)** | Weak                  | Better                         |
| **Efficiency (cost)**                | High (free)           | Lower (pay per 1k)             |
| **Efficiency (time per image)**      | 0.5–3 s + cold start  | Often faster (network-bound)   |
| **Efficiency (server CPU)**          | High usage            | Low usage                      |
| **Offline**                          | Yes                   | No                             |
| **Implementation in MagicFolder**    | ✅ Current default     | Optional (add provider branch) |

For MagicFolder, the current **Tesseract-based pipeline is accurate and efficient** for typical document scans and remains the best default when cost and offline operation matter. Add **Google OCR as an optional provider** where higher accuracy or lower server load justifies the API cost.
