# Standard “Envelope Header” (File Header Template)

Use this **JSDoc header** at the top of **domain-owned modules** (and any shared module that is part of the public surface).
We’ll apply it broadly after the current cleanup is finished.

## Template

```ts
/**
 * @domain <marketing|auth|orchestra|magictodo|tenancy>
 * @layer <ui|client|shared|server|api>
 * @responsibility <one sentence: what this file is responsible for>
 * @owner <team/person/role if desired>
 * @dependencies
 * - shared
 * - <other allowed domains or layers>
 * @exports
 * - <publicSymbolName()>
 */
```

## Rules

- Must match the folder it lives in (no “lying” domains).
- Keep it short (5–12 lines).
- Use `@/lib/server/only` in server modules and `"use client"` in client modules **in addition** to this header.
- Do not add this header to generated files.

