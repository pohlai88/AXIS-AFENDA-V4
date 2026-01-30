# `components/`

[← Back to root README](../README.md)

## What lives here

- Shared React UI components used across routes.
- `components/ui/` contains reusable UI primitives (shadcn-style).

## Client/server guidance

- Prefer Server Components by default (especially for layout/static UI).
- Add `"use client"` only to components that need browser APIs, state, or effects.

