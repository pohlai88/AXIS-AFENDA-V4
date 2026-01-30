# shadcn UI — Best Practices (AFENDA)

This file is the **canonical UI standard** for this repo. Keep UI changes consistent with this document.

## Stack

- **Next.js App Router**
- **Tailwind CSS v4**
- **shadcn/ui components + shadcn Blocks**

## Principles (non-negotiable)

- **Blocks-first for page structure**
  - For layouts and page scaffolding, prefer **shadcn Blocks** patterns (e.g. Sidebar layouts, inset headers).
- **Primitives-first for UI**
  - Use shadcn primitives instead of custom `div` UI:
    - `Card`, `Alert`, `Badge`, `Tabs`, `Table`, `Skeleton`, `Empty`, `Button`, `Input`, `Label`, `Separator`, `Breadcrumb`, `Sidebar`, etc.
- **Token-based styling**
  - Prefer semantic tokens over palette colors:
    - Good: `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-card`, `text-destructive`, `border-border`
    - Avoid: `bg-gray-50`, `text-green-600`, `border-blue-200`, etc.
- **Avoid inline styles / custom CSS**
  - Prefer Tailwind utilities.
  - If global styling is truly needed, put it in `app/globals.css` (and keep it minimal).

## Layout standard for `/app/*`

- The App Shell should remain the single consistent layout entry:
  - Use the shadcn Sidebar pattern (`SidebarProvider`, `Sidebar`, `SidebarInset`, `SidebarTrigger`).
  - Sidebar should highlight the active route via `isActive`.

## Routing

- Never hardcode paths like `"/app/tasks"`.
- Use `lib/routes.ts` helpers everywhere.

## Accessibility defaults

- Prefer shadcn components because they carry accessible semantics by default.
- Ensure any icon-only buttons include `aria-label` and/or `sr-only` text.

## Checklist for any UI PR/changes

- [ ] Used shadcn components/Blocks where appropriate (no bespoke card/div wrappers)
- [ ] No hardcoded palette color classes in app UI (prefer tokens)
- [ ] No inline `style={{...}}` unless required by a shadcn component API
- [ ] Routes use `lib/routes.ts` (no string paths)
- [ ] `/app/*` pages are reachable via the App Shell sidebar
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes

