/**
 * Compile-time type tests (drift prevention).
 *
 * This file is intentionally NOT imported anywhere at runtime.
 * It exists so `pnpm typecheck` fails fast if our core contracts drift.
 */

import { z } from "zod"

import { ApiErrorSchema, type ApiError } from "@/lib/contracts/api-error"
import { ApiFetchError, apiFetch } from "@/lib/api/client"

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false

type Assert<T extends true> = T

// --- Contract inference locks ---
type _apiError_infers = Assert<Equal<z.infer<typeof ApiErrorSchema>, ApiError>>

// --- apiFetch inference locks ---
const UserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
})
type User = z.infer<typeof UserSchema>

type _apiFetch_returns_data = Assert<
  Equal<Awaited<ReturnType<typeof apiFetch<typeof UserSchema>>>, User>
>

// --- ApiFetchError surface area locks ---
type _apiFetchError_is_error = Assert<Equal<ApiFetchError extends Error ? true : false, true>>
type _apiFetchError_has_code = Assert<Equal<ApiFetchError["code"], string>>
type _apiFetchError_has_details = Assert<Equal<ApiFetchError["details"], unknown | undefined>>
type _apiFetchError_has_requestId = Assert<Equal<ApiFetchError["requestId"], string | undefined>>

