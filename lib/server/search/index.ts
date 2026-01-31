/* eslint-disable @typescript-eslint/no-explicit-any */
import "@/lib/server/only"

import {
  and,
  or,
  count,
  eq,
  gte,
  lte,
  sql,
  desc,
  asc,
  ilike,
  inArray,
  isNull,
  isNotNull,
  type SQL,
} from "drizzle-orm"

import { logger } from "@/lib/server/logger"
import { getDb } from "@/lib/server/db"
import { tasks } from "@/lib/server/db/schema"
import {
  AdvancedTaskFilters,
  TaskFilterRequest,
  FilteredTaskListResponse,
  TASK_STATUS
} from "@/lib/contracts/tasks"
import { PAGINATION, TASK_FILTERING } from "@/lib/constants"

/**
 * Advanced Task Filtering Service
 *
 * Provides comprehensive filtering, searching, and sorting capabilities
 * for tasks following the established server-only patterns.
 */

export class TaskFilterService {
  private db = getDb()

  /**
   * Get filtered tasks with facets
   */
  async getFilteredTasks(userId: string, request: TaskFilterRequest): Promise<FilteredTaskListResponse> {
    try {
      const { filters, pagination } = request
      const { limit = PAGINATION.DEFAULT_PAGE_SIZE, offset = PAGINATION.DEFAULT_PAGE } = pagination

      // Build the base query
      let query = this.db
        .select({
          id: tasks.id,
          title: tasks.title,
          description: tasks.description,
          dueDate: tasks.dueDate,
          priority: tasks.priority,
          status: tasks.status,
          projectId: tasks.projectId,
          tags: tasks.tags,
          recurrenceRuleId: tasks.recurrenceRuleId,
          parentTaskId: tasks.parentTaskId,
          userId: tasks.userId,
          createdAt: tasks.createdAt,
          updatedAt: tasks.updatedAt,
          completedAt: tasks.completedAt,
          nextOccurrenceDate: tasks.nextOccurrenceDate,
          isRecurrenceChild: tasks.isRecurrenceChild,
        })
        .from(tasks)
        .where(eq(tasks.userId, userId))

      // Apply filters
      query = this.applyFilters(query, filters || {
        sortBy: TASK_FILTERING.DEFAULTS.SORT_BY,
        sortOrder: TASK_FILTERING.DEFAULTS.SORT_ORDER,
      })

      // Get total count for pagination
      const countQuery = this.db
        .select({ count: count() })
        .from(tasks)
        .where(eq(tasks.userId, userId))

      const countQueryWithFilters = this.applyFilters(countQuery, filters || {
        sortBy: TASK_FILTERING.DEFAULTS.SORT_BY,
        sortOrder: TASK_FILTERING.DEFAULTS.SORT_ORDER,
      })
      const [{ count: total }] = await countQueryWithFilters

      // Apply sorting and pagination
      query = this.applySorting(query, filters.sortBy || TASK_FILTERING.DEFAULTS.SORT_BY, filters.sortOrder || TASK_FILTERING.DEFAULTS.SORT_ORDER)
      query = query.limit(limit).offset(offset)

      // Execute query
      const filteredTasks = await query

      // Get facets for UI
      const facets = await this.getFacets(userId, filters)

      return {
        items: filteredTasks,
        total,
        limit,
        offset,
        filters,
        facets,
      }
    } catch (error) {
      logger.error({ error, userId, request }, "[task-filter] Failed to get filtered tasks")
      throw error
    }
  }

  /**
   * Apply filters to a query
   */
  private applyFilters(query: any, filters: AdvancedTaskFilters): any {
    let filteredQuery = query

    // Search filter
    if (filters.search) {
      filteredQuery = this.applySearchFilter(filteredQuery, filters.search)
    }

    // Date range filters
    if (filters.createdDate) {
      filteredQuery = this.applyDateRangeFilter(filteredQuery, tasks.createdAt, filters.createdDate)
    }

    if (filters.dueDate) {
      filteredQuery = this.applyDateRangeFilter(filteredQuery, tasks.dueDate, filters.dueDate)
    }

    if (filters.completedDate) {
      filteredQuery = this.applyDateRangeFilter(filteredQuery, tasks.completedAt, filters.completedDate)
    }

    // Multi-select filters
    if (filters.status) {
      filteredQuery = this.applyMultiSelectFilter(filteredQuery, tasks.status, filters.status)
    }

    if (filters.priority) {
      filteredQuery = this.applyMultiSelectFilter(filteredQuery, tasks.priority, filters.priority)
    }

    if (filters.tags) {
      filteredQuery = this.applyTagsFilter(filteredQuery, filters.tags)
    }

    if (filters.projects) {
      filteredQuery = this.applyMultiSelectFilter(filteredQuery, tasks.projectId, filters.projects)
    }

    // Boolean filters
    if (filters.hasDueDate !== undefined) {
      filteredQuery = filteredQuery.where(
        filters.hasDueDate ? isNotNull(tasks.dueDate) : isNull(tasks.dueDate)
      )
    }

    if (filters.isOverdue !== undefined) {
      filteredQuery = filteredQuery.where(
        filters.isOverdue
          ? and(
            sql`${tasks.dueDate} < NOW()`,
            eq(tasks.status, TASK_STATUS.TODO)
          )
          : or(
            sql`${tasks.dueDate} >= NOW()`,
            isNull(tasks.dueDate),
            sql`${tasks.status} != 'todo'`
          )
      )
    }

    if (filters.hasRecurrence !== undefined) {
      filteredQuery = filteredQuery.where(
        filters.hasRecurrence ? isNotNull(tasks.recurrenceRuleId) : isNull(tasks.recurrenceRuleId)
      )
    }

    if (filters.hasDescription !== undefined) {
      filteredQuery = filteredQuery.where(
        filters.hasDescription
          ? and(isNotNull(tasks.description), sql`LENGTH(${tasks.description}) > 0`)
          : or(isNull(tasks.description), sql`LENGTH(${tasks.description}) = 0`)
      )
    }

    if (filters.hasTags !== undefined) {
      filteredQuery = filteredQuery.where(
        filters.hasTags
          ? and(isNotNull(tasks.tags), sql`json_array_length(${tasks.tags}) > 0`)
          : or(isNull(tasks.tags), sql`json_array_length(${tasks.tags}) = 0`)
      )
    }

    // Numeric range filters
    if (filters.estimatedDuration) {
      // This would require estimated duration to be stored in the database
      // For now, we'll skip this as it's not in the current schema
    }

    return filteredQuery
  }

  /**
   * Apply search filter
   */
  private applySearchFilter(query: any, search: { query: string; fields: string[]; matchType: string }): any {
    const { query: searchQuery, fields, matchType } = search

    const searchConditions = []

    if (fields.includes("title") || fields.includes("all")) {
      const titleCondition = matchType === "exact"
        ? eq(tasks.title, searchQuery)
        : matchType === "fuzzy"
          ? sql`SIMILARITY(${tasks.title}, ${searchQuery}) > 0.3`
          : ilike(tasks.title, `%${searchQuery}%`)

      searchConditions.push(titleCondition)
    }

    if (fields.includes("description") || fields.includes("all")) {
      const descriptionCondition = matchType === "exact"
        ? eq(tasks.description, searchQuery)
        : matchType === "fuzzy"
          ? sql`SIMILARITY(${tasks.description}, ${searchQuery}) > 0.3`
          : ilike(tasks.description, `%${searchQuery}%`)

      searchConditions.push(descriptionCondition)
    }

    if (fields.includes("tags") || fields.includes("all")) {
      const tagsCondition = matchType === "exact"
        ? sql`${tasks.tags} ? ${searchQuery}`
        : matchType === "fuzzy"
          ? sql`EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(${tasks.tags}) as tag 
            WHERE SIMILARITY(tag, ${searchQuery}) > 0.3
          )`
          : sql`EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(${tasks.tags}) as tag 
            WHERE tag ILIKE ${'%' + searchQuery + '%'}
          )`

      searchConditions.push(tagsCondition)
    }

    return searchConditions.length > 0
      ? query.where(or(...searchConditions))
      : query
  }

  /**
   * Apply date range filter
   */
  private applyDateRangeFilter(query: any, field: any, dateRange: { relativeRange?: string; startDate?: string; endDate?: string }): any {
    if (dateRange.relativeRange) {
      const dateCondition = this.getRelativeDateCondition(field, dateRange.relativeRange)
      return query.where(dateCondition)
    }

    if (dateRange.startDate || dateRange.endDate) {
      const conditions = []

      if (dateRange.startDate) {
        conditions.push(gte(field, dateRange.startDate))
      }

      if (dateRange.endDate) {
        conditions.push(lte(field, dateRange.endDate))
      }

      return conditions.length > 0 ? query.where(and(...conditions)) : query
    }

    return query
  }

  /**
   * Get relative date condition
   */
  private getRelativeDateCondition(field: any, relativeRange: string): SQL {
    switch (relativeRange) {
      case "today":
        return sql`DATE(${field}) = CURRENT_DATE`

      case "yesterday":
        return sql`DATE(${field}) = CURRENT_DATE - INTERVAL '1 day'`

      case "this_week":
        return sql`${field} >= DATE_TRUNC('week', CURRENT_DATE) AND ${field} < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week'`

      case "last_week":
        return sql`${field} >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '1 week' AND ${field} < DATE_TRUNC('week', CURRENT_DATE)`

      case "this_month":
        return sql`DATE_TRUNC('month', ${field}) = DATE_TRUNC('month', CURRENT_DATE)`

      case "last_month":
        return sql`DATE_TRUNC('month', ${field}) = DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'`

      case "this_quarter":
        return sql`DATE_TRUNC('quarter', ${field}) = DATE_TRUNC('quarter', CURRENT_DATE)`

      case "last_quarter":
        return sql`DATE_TRUNC('quarter', ${field}) = DATE_TRUNC('quarter', CURRENT_DATE) - INTERVAL '3 months'`

      case "this_year":
        return sql`DATE_TRUNC('year', ${field}) = DATE_TRUNC('year', CURRENT_DATE)`

      case "last_year":
        return sql`DATE_TRUNC('year', ${field}) = DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '1 year'`

      case "overdue":
        return sql`${field} < NOW() AND ${tasks.status} = 'todo'`

      case "due_today":
        return sql`DATE(${field}) = CURRENT_DATE AND ${tasks.status} = 'todo'`

      case "due_this_week":
        return sql`${field} >= CURRENT_DATE AND ${field} <= CURRENT_DATE + INTERVAL '7 days' AND ${tasks.status} = 'todo'`

      case "due_this_month":
        return sql`DATE_TRUNC('month', ${field}) = DATE_TRUNC('month', CURRENT_DATE) AND ${tasks.status} = 'todo'`

      default:
        return sql`1=1` // No filter
    }
  }

  /**
   * Apply multi-select filter
   */
  private applyMultiSelectFilter(query: any, field: any, filter: { values: string[]; includeMode: string }): any {
    const { values, includeMode } = filter

    if (values.length === 0) return query

    switch (includeMode) {
      case "any":
        return query.where(inArray(field, values))

      case "all":
        // For "all" mode, we'd need multiple conditions
        // This is simplified - in production you might need more complex logic
        return query.where(inArray(field, values))

      case "none":
        return query.where(sql`NOT (${field} = ANY(${values}))`)

      default:
        return query
    }
  }

  /**
   * Apply tags filter (special handling for JSON array)
   */
  private applyTagsFilter(query: any, filter: { values: string[]; includeMode: string }): any {
    const { values, includeMode } = filter

    if (values.length === 0) return query

    switch (includeMode) {
      case "any":
        return query.where(sql`${tasks.tags} ?| ${values}`)

      case "all":
        return query.where(sql`${tasks.tags} @> ${values}`)

      case "none":
        return query.where(sql`NOT (${tasks.tags} ?| ${values})`)

      default:
        return query
    }
  }

  /**
   * Apply sorting
   */
  private applySorting(query: any, sortBy: string, sortOrder: string): any {
    const direction = sortOrder === "asc" ? asc : desc

    switch (sortBy) {
      case "title":
        return query.orderBy(direction(tasks.title))

      case "dueDate":
        return query.orderBy(direction(tasks.dueDate))

      case "priority":
        // Custom priority ordering
        return query.orderBy(
          direction(sql`CASE 
            WHEN ${tasks.priority} = 'urgent' THEN 1
            WHEN ${tasks.priority} = 'high' THEN 2
            WHEN ${tasks.priority} = 'medium' THEN 3
            WHEN ${tasks.priority} = 'low' THEN 4
            ELSE 5
          END`)
        )

      case "status":
        return query.orderBy(direction(tasks.status))

      case "completedAt":
        return query.orderBy(direction(tasks.completedAt))

      case "createdAt":
      default:
        return query.orderBy(direction(tasks.createdAt))
    }
  }

  /**
   * Get filter facets for UI
   */
  async getFacets(userId: string, filters: AdvancedTaskFilters): Promise<{
    statusCounts: Record<string, number>
    priorityCounts: Record<string, number>
    projectCounts: Record<string, number>
    tagCounts: Record<string, number>
    totalCount: number
  }> {
    try {
      // Get status counts
      const statusCounts = await this.db
        .select({
          status: tasks.status,
          count: count(),
        })
        .from(tasks)
        .where(eq(tasks.userId, userId))
        .groupBy(tasks.status)

      // Get priority counts
      const priorityCounts = await this.db
        .select({
          priority: tasks.priority,
          count: count(),
        })
        .from(tasks)
        .where(eq(tasks.userId, userId))
        .groupBy(tasks.priority)

      // Get project counts
      const projectCounts = await this.db
        .select({
          projectId: tasks.projectId,
          count: count(),
        })
        .from(tasks)
        .where(eq(tasks.userId, userId))
        .groupBy(tasks.projectId)

      // Get tag counts (simplified)
      const tagCounts = await this.db
        .select({
          tags: tasks.tags,
        })
        .from(tasks)
        .where(and(
          eq(tasks.userId, userId),
          isNotNull(tasks.tags),
          sql`json_array_length(${tasks.tags}) > 0`
        ))

      // Process tag counts
      const tagCountMap = new Map<string, number>()
      tagCounts.forEach(row => {
        if (row.tags && Array.isArray(row.tags)) {
          row.tags.forEach((tag: string) => {
            tagCountMap.set(tag, (tagCountMap.get(tag) || 0) + 1)
          })
        }
      })

      return {
        statusCounts: Object.fromEntries(statusCounts.map(row => [row.status, Number(row.count)])),
        priorityCounts: Object.fromEntries(priorityCounts.map(row => [row.priority, Number(row.count)])),
        projectCounts: Object.fromEntries(projectCounts.map(row => [row.projectId || "null", Number(row.count)])),
        tagCounts: Object.fromEntries(tagCountMap),
        totalCount: statusCounts.reduce((sum, row) => sum + Number(row.count), 0),
      }
    } catch (error) {
      logger.error({ error, userId, filters }, "[task-filter] Failed to get facets")
      throw error
    }
  }
}
