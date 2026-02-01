import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  // ---- Drift-prevention rules (new standard) ----
  // 1) Never import `server-only` directly; use `@/lib/server/only`.
  {
    rules: {
      "no-restricted-modules": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message: "Import `@/lib/server/only` instead of `server-only`.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["lib/server/only.ts"],
    rules: {
      "no-restricted-modules": "off",
    },
  },
  // Compile-time type tests: allow "unused" symbols (they're assertions).
  {
    files: ["**/_type-tests.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",
    },
  },

  // 2) Client/shared modules must not import server-only code.
  {
    files: [
      "components/**/*.{ts,tsx,js,jsx}",
      "hooks/**/*.{ts,tsx,js,jsx}",
      "lib/client/**/*.{ts,tsx,js,jsx}",
      "lib/api/**/*.{ts,tsx,js,jsx}",
      "lib/shared/**/*.{ts,tsx,js,jsx}",
      "lib/contracts/**/*.{ts,tsx,js,jsx}",
      "lib/constants/**/*.{ts,tsx,js,jsx}",
      "lib/config/**/*.{ts,tsx,js,jsx}",
      "lib/env/public.{ts,js}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/server/**"],
              message:
                "Do not import server-only modules from client/shared code. Move logic to lib/shared or call via API.",
            },
            {
              group: ["@/lib/env/server", "@/lib/server/only"],
              message:
                "Do not import server env or server-only guards from client/shared code.",
            },
          ],
        },
      ],
    },
  },

  // 3) Route handlers must not define schemas or touch DB internals directly.
  //    They should import contracts from lib/contracts and queries from lib/server/db/queries.
  {
    files: ["app/**/route.ts", "app/**/route.tsx"],
    rules: {
      "no-restricted-modules": [
        "error",
        {
          paths: [
            {
              name: "zod",
              message:
                "Do not import `zod` in route handlers. Put schemas in `lib/contracts/*` (or DB-derived in `lib/server/db/zod`).",
            },
            {
              name: "drizzle-orm",
              message:
                "Do not import Drizzle in route handlers. Use `lib/server/db/queries/*` only.",
            },
            {
              name: "drizzle-zod",
              message:
                "Do not import drizzle-zod in route handlers. Use `lib/server/db/zod`.",
            },
            {
              name: "postgres",
              message:
                "Do not create DB clients in route handlers. Use `lib/server/db/client` via queries.",
            },
            {
              name: "@/lib/server/db/client",
              message:
                "Route handlers must not import DB client. Use `lib/server/db/queries/*`.",
            },
            {
              name: "@/lib/server/db/zod",
              message:
                "Route handlers must not import DB zod. Use contracts or queries.",
            },
            {
              name: "@/lib/server/db/schema",
              message:
                "Route handlers must not import DB schema. Use `lib/server/db/queries/*`.",
            },
            {
              name: "@/lib/server/db/schema/index",
              message:
                "Route handlers must not import DB schema. Use `lib/server/db/queries/*`.",
            },
          ],
          patterns: ["drizzle-orm/*"],
        },
      ],
    },
  },

  // 4) Anti-drift: forbid raw "/app" and "/api" strings outside lib/routes.ts
  //    Use `routes.ui.*` and `routes.api.*` from `lib/routes.ts` instead.
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    ignores: [
      "lib/routes.ts",
      // Non-module runtime assets (cannot import routes)
      "public/**",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/^\\/(app|api)(\\/|$)/]",
          message:
            "Do not hardcode '/app' or '/api' paths. Import from `@/lib/routes` (routes.ui.* / routes.api.*).",
        },
        {
          selector: "TemplateElement[value.raw=/^\\/(app|api)(\\/|$)/]",
          message:
            "Do not hardcode '/app' or '/api' paths in template literals. Import from `@/lib/routes` (routes.ui.* / routes.api.*).",
        },
      ],
    },
  },
]);

export default eslintConfig;
