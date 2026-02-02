/**
 * @domain magictodo
 * @layer api
 * @responsibility API route handler for /api/v1/tasks/filter
 */

import { ok, fail } from "@/lib/server/api/response"
import { parseJson } from "@/lib/server/api/validate"
import { TaskFilterService } from "@/lib/server/search"
import { taskFilterRequestSchema } from "@/lib/contracts/tasks"
import { logger } from "@/lib/server/logger"
import { API_ERROR_CODES, HTTP_STATUS, TASK_FILTERING } from "@/lib/constants"

/**
 * POST /api/v1/tasks/filter
 *
 * Returns filtered tasks with advanced search and filtering capabilities.
 * Supports full-text search, date ranges, multi-select filters, and sorting.
 */
export async function POST(request: Request) {
  try {
    // Parse request body
    const filterRequest = await parseJson(request, taskFilterRequestSchema)

    // Get user ID from headers
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return fail(
        { message: "User ID required", code: API_ERROR_CODES.UNAUTHORIZED },
        HTTP_STATUS.UNAUTHORIZED
      )
    }

    const filterService = new TaskFilterService()
    const filteredTasks = await filterService.getFilteredTasks(userId, filterRequest)

    return ok(filteredTasks)
  } catch (error) {
    logger.error({ error }, "[task-filter] POST request failed")

    if (error instanceof Error && error.message.includes("Invalid JSON body")) {
      return fail(
        { message: "Invalid request body", code: API_ERROR_CODES.VALIDATION_ERROR },
        HTTP_STATUS.BAD_REQUEST
      )
    }

    return fail(
      { message: "Failed to filter tasks", code: API_ERROR_CODES.INTERNAL_ERROR },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}

/**
 * GET /api/v1/tasks/facets
 *
 * Returns filter facets (counts) for UI filter components.
 * Used to populate filter options with counts.
 */
export async function GET(request: Request) {
  try {
    // Get user ID from headers
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return fail(
        { message: "User ID required", code: API_ERROR_CODES.UNAUTHORIZED },
        HTTP_STATUS.UNAUTHORIZED
      )
    }

    const filterService = new TaskFilterService()
    const facets = await filterService.getFacets(userId, {
      sortBy: TASK_FILTERING.DEFAULTS.SORT_BY,
      sortOrder: TASK_FILTERING.DEFAULTS.SORT_ORDER,
    })

    return ok(facets)
  } catch (error) {
    logger.error({ error }, "[task-filter] GET facets request failed")
    return fail(
      { message: "Failed to get filter facets", code: API_ERROR_CODES.INTERNAL_ERROR },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}

