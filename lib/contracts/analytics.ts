import { z } from "zod"

/**
 * Analytics Contracts for MagicToDo
 *
 * Defines schemas for analytics data, metrics, and insights.
 * Used by analytics API endpoints and client components.
 */

// ============ Analytics Time Ranges ============
export const ANALYTICS_TIME_RANGE = {
  TODAY: "today",
  WEEK: "week",
  MONTH: "month",
  QUARTER: "quarter",
  YEAR: "year",
  ALL_TIME: "all_time",
} as const

export const AnalyticsTimeRange = z.enum([
  ANALYTICS_TIME_RANGE.TODAY,
  ANALYTICS_TIME_RANGE.WEEK,
  ANALYTICS_TIME_RANGE.MONTH,
  ANALYTICS_TIME_RANGE.QUARTER,
  ANALYTICS_TIME_RANGE.YEAR,
  ANALYTICS_TIME_RANGE.ALL_TIME,
])
export type AnalyticsTimeRange = z.infer<typeof AnalyticsTimeRange>

// ============ Task Metrics ============
export const TaskMetricsSchema = z.object({
  totalTasks: z.number(),
  completedTasks: z.number(),
  inProgressTasks: z.number(),
  todoTasks: z.number(),
  cancelledTasks: z.number(),
  completionRate: z.number(), // percentage
  averageCompletionTime: z.number(), // hours
  overdueTasksCount: z.number(),
  tasksCreatedToday: z.number(),
  tasksCompletedToday: z.number(),
})

export type TaskMetrics = z.infer<typeof TaskMetricsSchema>

// ============ Priority Distribution ============
export const PriorityDistributionSchema = z.object({
  urgent: z.object({ count: z.number(), percentage: z.number() }),
  high: z.object({ count: z.number(), percentage: z.number() }),
  medium: z.object({ count: z.number(), percentage: z.number() }),
  low: z.object({ count: z.number(), percentage: z.number() }),
})

export type PriorityDistribution = z.infer<typeof PriorityDistributionSchema>

// ============ Project Analytics ============
export const ProjectAnalyticsSchema = z.object({
  projectId: z.string(),
  projectName: z.string(),
  projectColor: z.string().optional(),
  taskCount: z.number(),
  completedTasks: z.number(),
  completionRate: z.number(),
  averageTaskDuration: z.number(), // hours
  lastActivity: z.string().datetime(), // ISO datetime
})

export type ProjectAnalytics = z.infer<typeof ProjectAnalyticsSchema>

// ============ Productivity Trends ============
export const ProductivityTrendSchema = z.object({
  date: z.string(), // ISO date
  tasksCreated: z.number(),
  tasksCompleted: z.number(),
  completionRate: z.number(),
  focusTime: z.number(), // estimated hours spent
})

export type ProductivityTrend = z.infer<typeof ProductivityTrendSchema>

// ============ Completion Patterns ============
export const CompletionPatternSchema = z.object({
  hourOfDay: z.number(), // 0-23
  dayOfWeek: z.number(), // 0-6 (Sunday=0)
  completionCount: z.number(),
  averageCompletionTime: z.number(), // minutes
})

export type CompletionPattern = z.infer<typeof CompletionPatternSchema>

// ============ Tag Analytics ============
export const TagAnalyticsSchema = z.object({
  tag: z.string(),
  usageCount: z.number(),
  completionRate: z.number(),
  averagePriority: z.number(), // 1-4 scale
  totalTasks: z.number(),
})

export type TagAnalytics = z.infer<typeof TagAnalyticsSchema>

// ============ Analytics Request ============
export const AnalyticsRequestSchema = z.object({
  timeRange: AnalyticsTimeRange.optional().default(ANALYTICS_TIME_RANGE.MONTH),
  projectId: z.string().optional(),
  includePatterns: z.boolean().optional().default(false),
  includeTags: z.boolean().optional().default(false),
})

export type AnalyticsRequest = z.infer<typeof AnalyticsRequestSchema>

// ============ Analytics Response ============
export const AnalyticsResponseSchema = z.object({
  timeRange: AnalyticsTimeRange,
  generatedAt: z.string().datetime(),
  taskMetrics: TaskMetricsSchema,
  priorityDistribution: PriorityDistributionSchema,
  projectAnalytics: z.array(ProjectAnalyticsSchema),
  productivityTrends: z.array(ProductivityTrendSchema),
  completionPatterns: z.array(CompletionPatternSchema).optional(),
  tagAnalytics: z.array(TagAnalyticsSchema).optional(),
})

export type AnalyticsResponse = z.infer<typeof AnalyticsResponseSchema>

// ============ Quick Stats ============
export const QuickStatsSchema = z.object({
  tasksCompletedToday: z.number(),
  tasksDueToday: z.number(),
  overdueTasksCount: z.number(),
  productivityScore: z.number(), // 0-100
  streakDays: z.number(), // consecutive days with completed tasks
})

export type QuickStats = z.infer<typeof QuickStatsSchema>

// ============ Insights ============
export const InsightType = z.enum([
  "productivity_high",
  "productivity_low",
  "overdue_warning",
  "burnout_risk",
  "project_focus",
  "priority_imbalance",
  "tag_trend",
])

export type InsightType = z.infer<typeof InsightType>

export const InsightSchema = z.object({
  id: z.string(),
  type: InsightType,
  title: z.string(),
  description: z.string(),
  severity: z.enum(["low", "medium", "high"]),
  actionable: z.boolean(),
  actionText: z.string().optional(),
  actionUrl: z.string().optional(),
  createdAt: z.string().datetime(),
})

export type Insight = z.infer<typeof InsightSchema>

export const InsightsResponseSchema = z.object({
  insights: z.array(InsightSchema),
  generatedAt: z.string().datetime(),
})

export type InsightsResponse = z.infer<typeof InsightsResponseSchema>
