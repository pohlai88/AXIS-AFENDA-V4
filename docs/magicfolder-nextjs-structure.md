# MagicFolder App Structure (Next.js Best Practice)

This document describes the **MagicFolder** app structure under the App Router, aligned with [Next.js Project Structure](https://nextjs.org/docs/app/getting-started/project-structure) and file conventions.

---

## Route segment

- **Path:** `app/(app)/app/magicfolder/`
- **URL:** `/app/magicfolder`, `/app/magicfolder/inbox`, `/app/magicfolder/documents/[id]`, etc.
- **Route group:** `(app)` is a route group (no URL segment); `app` and `magicfolder` are literal segments.

---

## File conventions (Next.js)

| File                           | Purpose                                                                                 |
| ------------------------------ | --------------------------------------------------------------------------------------- |
| **layout.tsx**                 | Segment layout: wraps all MagicFolder routes, sets metadata (title, description).       |
| **loading.tsx**                | Loading UI (Suspense): shown while the segment or a child page is loading.              |
| **error.tsx**                  | Error boundary: catches runtime errors in MagicFolder routes; must be Client Component. |
| **page.tsx**                   | Public route (one per folder that is a route).                                          |
| **documents/[id]/loading.tsx** | Loading UI for the dynamic document detail route.                                       |

### Layout

- **layout.tsx** is a **Server Component** (default).
- It wraps `children` in a full-width container (`w-full space-y-6`) and exports **metadata** for the segment.
- No `"use client"` in layout so metadata and shell stay on the server.

### Loading

- **loading.tsx** is a **React Suspense** boundary: Next.js shows it while the segment/page is loading (e.g. navigation, streaming).
- Segment-level `loading.tsx` applies to all MagicFolder routes; `documents/[id]/loading.tsx` applies only to the document detail page.

### Error

- **error.tsx** must be a **Client Component** (`"use client"`).
- It receives `error` and `reset`; use `reset()` to retry. Logs error in `useEffect`.

---

## Folder structure

```
app/(app)/app/magicfolder/
├── layout.tsx          # Segment layout + metadata
├── loading.tsx         # Segment loading UI
├── error.tsx            # Segment error boundary
├── page.tsx             # /app/magicfolder (landing)
├── inbox/
│   └── page.tsx         # /app/magicfolder/inbox
├── duplicates/
│   └── page.tsx         # /app/magicfolder/duplicates
├── unsorted/
│   └── page.tsx         # /app/magicfolder/unsorted
├── search/
│   └── page.tsx         # /app/magicfolder/search
├── collections/
│   └── page.tsx         # /app/magicfolder/collections
└── documents/
    └── [id]/
        ├── page.tsx     # /app/magicfolder/documents/:id
        └── loading.tsx  # Loading UI for document detail
```

---

## Colocation and private folders

- **Route-private components:** Use `_components` inside a route segment (e.g. `magicfolder/_components/`) for components used only by MagicFolder pages. Next.js does **not** expose `_folderName` as a route.
- **Shared UI:** MagicFolder blocks live in `@/components/magicfolder`; pages compose them and do not own layout/typography (see `docs/magicfolder-ux-spec.md`).

---

## References

- [Next.js Project Structure](https://nextjs.org/docs/app/getting-started/project-structure)
- [layout.js](https://nextjs.org/docs/app/api-reference/file-conventions/layout)
- [loading.js](https://nextjs.org/docs/app/api-reference/file-conventions/loading)
- [error.js](https://nextjs.org/docs/app/api-reference/file-conventions/error)
- [Route Groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups)
- [Private Folders](https://nextjs.org/docs/app/getting-started/project-structure#private-folders) (`_folderName`)
