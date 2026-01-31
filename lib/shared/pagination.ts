import { z } from "zod"
import { PAGINATION } from "@/lib/constants"

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  pageSize: z.coerce.number().int().min(PAGINATION.MIN_PAGE_SIZE).max(PAGINATION.MAX_PAGE_SIZE).default(PAGINATION.DEFAULT_PAGE_SIZE),
  cursor: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  nextCursor?: string
  prevCursor?: string
}

export interface PaginatedResult<T> {
  data: T[]
  meta: PaginationMeta
}

/**
 * Creates pagination metadata
 */
export function createPaginationMeta({
  page,
  pageSize,
  total,
  nextCursor,
  prevCursor,
}: {
  page: number
  pageSize: number
  total: number
  nextCursor?: string
  prevCursor?: string
}): PaginationMeta {
  const totalPages = Math.ceil(total / pageSize)

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    nextCursor,
    prevCursor,
  }
}

/**
 * Creates a paginated result
 */
export function createPaginatedResult<T>({
  data,
  meta,
}: {
  data: T[]
  meta: PaginationMeta
}): PaginatedResult<T> {
  return { data, meta }
}

/**
 * Calculates offset for database queries
 */
export function calculateOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize
}

/**
 * Builds pagination query parameters
 */
export function buildPaginationQuery(query: Partial<PaginationQuery>): string {
  const params = new URLSearchParams()

  if (query.page) params.set('page', query.page.toString())
  if (query.pageSize) params.set('pageSize', query.pageSize.toString())
  if (query.cursor) params.set('cursor', query.cursor)
  if (query.sort) params.set('sort', query.sort)
  if (query.order) params.set('order', query.order)

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}
