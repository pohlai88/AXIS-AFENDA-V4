import "@/lib/server/only"

import {
  and,
  count,
  eq,
  gte,
  lte,
  sql,
  desc,
} from "drizzle-orm"

import { logger } from "@/lib/server/logger"
import { getDb } from "@/lib/server/db"
import { routes } from "@/lib/routes"
import { tasks, projects } from "@/lib/server/db/schema"
import {
  AnalyticsTimeRange,
  AnalyticsRequest,
  TaskMetrics,
  PriorityDistribution,
  ProjectAnalytics,
  ProductivityTrend,
  CompletionPattern,
  TagAnalytics,
  AnalyticsResponse,
  QuickStats,
  Insight,
  InsightType
} from "@/lib/contracts/analytics"
import { TASK_STATUS, TASK_PRIORITY } from "@/lib/contracts/tasks"

/**
 * Analytics Service - Server-side analytics computation
 *
 * This service provides comprehensive analytics for MagicToDo tasks,
 * following the established server-only patterns and using the
 * existing database layer.
 */

export class AnalyticsService {
  private db = getDb()

  /**
   * Get comprehensive analytics for a user
   */
  async getAnalytics(userId: string, request: AnalyticsRequest): Promise<AnalyticsResponse> {
    try {
      // In production, this would use a proper cache like Redis
      // For now, we compute directly but structure for easy caching

      const [
        taskMetrics,
        priorityDistribution,
        projectAnalytics,
        productivityTrends,
        completionPatterns,
        tagAnalytics
      ] = await Promise.all([
        this.getTaskMetrics(userId, request.timeRange),
        this.getPriorityDistribution(userId, request.timeRange),
        this.getProjectAnalytics(userId, request.timeRange),
        this.getProductivityTrends(userId, request.timeRange),
        request.includePatterns ? this.getCompletionPatterns(userId, request.timeRange) : [],
        request.includeTags ? this.getTagAnalytics(userId, request.timeRange) : []
      ])

      return {
        timeRange: request.timeRange,
        generatedAt: new Date().toISOString(),
        taskMetrics,
        priorityDistribution,
        projectAnalytics,
        productivityTrends,
        completionPatterns,
        tagAnalytics
      }
    } catch (error) {
      logger.error({ error, userId, request }, "[analytics] Failed to compute analytics")
      throw error
    }
  }

  /**
   * Get quick stats for dashboard
   */
  async getQuickStats(userId: string): Promise<QuickStats> {
    try {
      const [
        tasksCompletedToday,
        tasksDueToday,
        overdueTasksCount,
        productivityScore,
        streakDays
      ] = await Promise.all([
        this.getTasksCompletedToday(userId),
        this.getTasksDueToday(userId),
        this.getOverdueTasksCount(userId),
        this.getProductivityScore(userId),
        this.getStreakDays(userId)
      ])

      return {
        tasksCompletedToday,
        tasksDueToday,
        overdueTasksCount,
        productivityScore,
        streakDays
      }
    } catch (error) {
      logger.error({ error, userId }, "[analytics] Failed to get quick stats")
      throw error
    }
  }

  /**
   * Get AI-powered insights
   */
  async getInsights(userId: string): Promise<{ insights: Insight[], generatedAt: string }> {
    try {
      const insights: Insight[] = []
      const quickStats = await this.getQuickStats(userId)

      // Overdue tasks warning
      if (quickStats.overdueTasksCount > 0) {
        insights.push({
          id: "overdue-warning",
          type: "overdue_warning" as InsightType,
          title: "Tasks Overdue",
          description: `You have ${quickStats.overdueTasksCount} overdue task${quickStats.overdueTasksCount > 1 ? 's' : ''}`,
          severity: quickStats.overdueTasksCount > 5 ? "high" : "medium",
          actionable: true,
          actionText: "Review Overdue Tasks",
          actionUrl: `${routes.ui.magictodo.tasks()}?filter=overdue`,
          createdAt: new Date().toISOString()
        })
      }

      // Low productivity warning
      if (quickStats.productivityScore < 30) {
        insights.push({
          id: "low-productivity",
          type: "productivity_low" as InsightType,
          title: "Low Productivity",
          description: "Your task completion rate has been lower than usual lately",
          severity: "medium",
          actionable: true,
          actionText: "View Analytics",
          actionUrl: routes.ui.orchestra.analytics(),
          createdAt: new Date().toISOString()
        })
      }

      // Burnout risk
      const tasksInProgress = await this.getTasksInProgressCount(userId)
      if (tasksInProgress > 10) {
        insights.push({
          id: "burnout-risk",
          type: "burnout_risk" as InsightType,
          title: "High Workload",
          description: `You have ${tasksInProgress} tasks in progress. Consider focusing on completing existing tasks.`,
          severity: "medium",
          actionable: true,
          actionText: "Review Tasks",
          actionUrl: `${routes.ui.magictodo.tasks()}?filter=in_progress`,
          createdAt: new Date().toISOString()
        })
      }

      // Streak celebration
      if (quickStats.streakDays >= 7) {
        insights.push({
          id: "streak-celebration",
          type: "productivity_high" as InsightType,
          title: "Amazing Streak!",
          description: `You've completed tasks for ${quickStats.streakDays} consecutive days!`,
          severity: "low",
          actionable: false,
          createdAt: new Date().toISOString()
        })
      }

      return {
        insights,
        generatedAt: new Date().toISOString()
      }
    } catch (error) {
      logger.error({ error, userId }, "[analytics] Failed to generate insights")
      throw error
    }
  }

  /**
   * Get task metrics for a time range
   */
  private async getTaskMetrics(userId: string, timeRange: AnalyticsTimeRange): Promise<TaskMetrics> {
    const { startDate, endDate } = this.getDateRange(timeRange)

    const baseQuery = this.db
      .select({
        totalTasks: count(tasks.id),
        completedTasks: sql<number>`SUM(CASE WHEN ${tasks.status} = 'done' THEN 1 ELSE 0 END)`,
        inProgressTasks: sql<number>`SUM(CASE WHEN ${tasks.status} = 'in_progress' THEN 1 ELSE 0 END)`,
        todoTasks: sql<number>`SUM(CASE WHEN ${tasks.status} = 'todo' THEN 1 ELSE 0 END)`,
        cancelledTasks: sql<number>`SUM(CASE WHEN ${tasks.status} = 'cancelled' THEN 1 ELSE 0 END)`,
        averageCompletionTime: sql<number>`AVG(EXTRACT(EPOCH FROM (${tasks.completedAt} - ${tasks.createdAt}))/3600)`,
        overdueTasksCount: sql<number>`SUM(CASE WHEN ${tasks.dueDate} < NOW() AND ${tasks.status} = 'todo' THEN 1 ELSE 0 END)`,
      })
      .from(tasks)
      .where(and(
        eq(tasks.userId, userId),
        gte(tasks.createdAt, startDate),
        lte(tasks.createdAt, endDate)
      ))

    const result = await baseQuery.limit(1)
    const metrics = result[0]

    const totalTasks = Number(metrics.totalTasks) || 0
    const completedTasks = Number(metrics.completedTasks) || 0
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    // Get today's specific metrics
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const todayMetrics = await this.db
      .select({
        tasksCreatedToday: count(tasks.id),
        tasksCompletedToday: sql<number>`SUM(CASE WHEN ${tasks.status} = 'done' THEN 1 ELSE 0 END)`,
      })
      .from(tasks)
      .where(and(
        eq(tasks.userId, userId),
        gte(tasks.createdAt, todayStart),
        lte(tasks.createdAt, todayEnd)
      ))
      .limit(1)

    const todayData = todayMetrics[0]

    return {
      totalTasks,
      completedTasks,
      inProgressTasks: Number(metrics.inProgressTasks) || 0,
      todoTasks: Number(metrics.todoTasks) || 0,
      cancelledTasks: Number(metrics.cancelledTasks) || 0,
      completionRate: Math.round(completionRate * 100) / 100,
      averageCompletionTime: Number(metrics.averageCompletionTime) || 0,
      overdueTasksCount: Number(metrics.overdueTasksCount) || 0,
      tasksCreatedToday: Number(todayData.tasksCreatedToday) || 0,
      tasksCompletedToday: Number(todayData.tasksCompletedToday) || 0,
    }
  }

  /**
   * Get priority distribution
   */
  private async getPriorityDistribution(userId: string, timeRange: AnalyticsTimeRange): Promise<PriorityDistribution> {
    const { startDate, endDate } = this.getDateRange(timeRange)

    const priorityStats = await this.db
      .select({
        priority: tasks.priority,
        count: count(tasks.id),
      })
      .from(tasks)
      .where(and(
        eq(tasks.userId, userId),
        gte(tasks.createdAt, startDate),
        lte(tasks.createdAt, endDate)
      ))
      .groupBy(tasks.priority)

    const total = priorityStats.reduce((sum, stat) => sum + Number(stat.count), 0)

    const distribution = {
      urgent: { count: 0, percentage: 0 },
      high: { count: 0, percentage: 0 },
      medium: { count: 0, percentage: 0 },
      low: { count: 0, percentage: 0 },
    }

    priorityStats.forEach(stat => {
      const count = Number(stat.count)
      const percentage = total > 0 ? (count / total) * 100 : 0
      const priority = stat.priority as string

      if (distribution[priority as keyof typeof distribution]) {
        distribution[priority as keyof typeof distribution] = {
          count,
          percentage: Math.round(percentage * 100) / 100
        }
      }
    })

    return distribution
  }

  /**
   * Get project analytics
   */
  private async getProjectAnalytics(userId: string, timeRange: AnalyticsTimeRange): Promise<ProjectAnalytics[]> {
    const { startDate, endDate } = this.getDateRange(timeRange)

    const projectData = await this.db
      .select({
        projectId: projects.id,
        projectName: projects.name,
        projectColor: projects.color,
        taskCount: count(tasks.id),
        completedTasks: sql<number>`SUM(CASE WHEN ${tasks.status} = 'done' THEN 1 ELSE 0 END)`,
        averageTaskDuration: sql<number>`AVG(EXTRACT(EPOCH FROM (${tasks.completedAt} - ${tasks.createdAt}))/3600)`,
        lastActivity: sql<string>`MAX(${tasks.updatedAt})`,
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(and(
        eq(tasks.userId, userId),
        gte(tasks.createdAt, startDate),
        lte(tasks.createdAt, endDate)
      ))
      .groupBy(projects.id, projects.name, projects.color)
      .orderBy(desc(sql`count(${tasks.id})`))

    // Calculate completion rate for each project
    return projectData.map(project => ({
      ...project,
      completionRate: project.taskCount > 0 ? (project.completedTasks / project.taskCount) * 100 : 0,
      projectColor: project.projectColor || undefined,
    }))
  }

  /**
   * Get productivity trends
   */
  private async getProductivityTrends(userId: string, timeRange: AnalyticsTimeRange): Promise<ProductivityTrend[]> {
    const { startDate, endDate } = this.getDateRange(timeRange)

    // Group by day for trends
    const trends = await this.db
      .select({
        date: sql<string>`DATE(${tasks.createdAt})`,
        tasksCreated: count(tasks.id).mapWith(Number),
        tasksCompleted: sql<number>`SUM(CASE WHEN ${tasks.status} = 'done' THEN 1 ELSE 0 END)`,
        focusTime: sql<number>`SUM(CASE WHEN ${tasks.status} = 'done' THEN EXTRACT(EPOCH FROM (${tasks.completedAt} - ${tasks.createdAt}))/3600 ELSE 0 END)`,
      })
      .from(tasks)
      .where(and(
        eq(tasks.userId, userId),
        gte(tasks.createdAt, startDate),
        lte(tasks.createdAt, endDate)
      ))
      .groupBy(sql`DATE(${tasks.createdAt})`)
      .orderBy(sql`DATE(${tasks.createdAt})`)

    return trends.map(trend => {
      const total = Number(trend.tasksCreated) || 0
      const completed = Number(trend.tasksCompleted) || 0
      const completionRate = total > 0 ? (completed / total) * 100 : 0

      return {
        date: trend.date,
        tasksCreated: total,
        tasksCompleted: completed,
        completionRate: Math.round(completionRate * 100) / 100,
        focusTime: Number(trend.focusTime) || 0,
      }
    })
  }

  /**
   * Get completion patterns (hour/day analysis)
   */
  private async getCompletionPatterns(userId: string, timeRange: AnalyticsTimeRange): Promise<CompletionPattern[]> {
    const { startDate, endDate } = this.getDateRange(timeRange)

    // Hour of day pattern
    const hourlyPattern = await this.db
      .select({
        hourOfDay: sql<number>`EXTRACT(HOUR FROM ${tasks.completedAt})`,
        completionCount: count(tasks.id).mapWith(Number),
        averageCompletionTime: sql<number>`AVG(EXTRACT(EPOCH FROM (${tasks.completedAt} - ${tasks.createdAt}))/60)`,
      })
      .from(tasks)
      .where(and(
        eq(tasks.userId, userId),
        eq(tasks.status, TASK_STATUS.DONE),
        gte(tasks.completedAt, startDate),
        lte(tasks.completedAt, endDate)
      ))
      .groupBy(sql`EXTRACT(HOUR FROM ${tasks.completedAt})`)
      .orderBy(sql`EXTRACT(HOUR FROM ${tasks.completedAt})`)

    // Day of week pattern
    const weeklyPattern = await this.db
      .select({
        dayOfWeek: sql<number>`EXTRACT(DOW FROM ${tasks.completedAt})`,
        completionCount: count(tasks.id).mapWith(Number),
        averageCompletionTime: sql<number>`AVG(EXTRACT(EPOCH FROM (${tasks.completedAt} - ${tasks.createdAt}))/60)`,
      })
      .from(tasks)
      .where(and(
        eq(tasks.userId, userId),
        eq(tasks.status, TASK_STATUS.DONE),
        gte(tasks.completedAt, startDate),
        lte(tasks.completedAt, endDate)
      ))
      .groupBy(sql`EXTRACT(DOW FROM ${tasks.completedAt})`)
      .orderBy(sql`EXTRACT(DOW FROM ${tasks.completedAt})`)

    // Combine patterns (simplified for now)
    const patterns: CompletionPattern[] = []

    hourlyPattern.forEach(pattern => {
      patterns.push({
        hourOfDay: Number(pattern.hourOfDay),
        dayOfWeek: 0, // Default value for hourly patterns
        completionCount: Number(pattern.completionCount),
        averageCompletionTime: Number(pattern.averageCompletionTime) || 0,
      })
    })

    weeklyPattern.forEach(pattern => {
      patterns.push({
        hourOfDay: 0, // Default value for weekly patterns
        dayOfWeek: Number(pattern.dayOfWeek),
        completionCount: Number(pattern.completionCount),
        averageCompletionTime: Number(pattern.averageCompletionTime) || 0,
      })
    })

    return patterns
  }

  /**
   * Get tag analytics
   */
  private async getTagAnalytics(userId: string, timeRange: AnalyticsTimeRange): Promise<TagAnalytics[]> {
    const { startDate, endDate } = this.getDateRange(timeRange)

    // This is a simplified version - in production you'd use json_array_elements or similar
    const tasksWithTags = await this.db
      .select({
        tags: tasks.tags,
        status: tasks.status,
        priority: tasks.priority,
      })
      .from(tasks)
      .where(and(
        eq(tasks.userId, userId),
        gte(tasks.createdAt, startDate),
        lte(tasks.createdAt, endDate),
        sql`${tasks.tags} IS NOT NULL`
      ))

    const tagMap = new Map<string, { count: number; completed: number; priorities: number[] }>()

    tasksWithTags.forEach(task => {
      if (task.tags && Array.isArray(task.tags)) {
        task.tags.forEach(tag => {
          const existing = tagMap.get(tag) || { count: 0, completed: 0, priorities: [] }
          existing.count++
          if (task.status === TASK_STATUS.DONE) {
            existing.completed++
          }
          if (task.priority) {
            const priorityValue = this.getPriorityValue(task.priority as string)
            existing.priorities.push(priorityValue)
          }
          tagMap.set(tag, existing)
        })
      }
    })

    return Array.from(tagMap.entries()).map(([tag, stats]) => ({
      tag,
      usageCount: stats.count,
      completionRate: stats.count > 0 ? (stats.completed / stats.count) * 100 : 0,
      averagePriority: stats.priorities.length > 0
        ? stats.priorities.reduce((sum, p) => sum + p, 0) / stats.priorities.length
        : 0,
      totalTasks: stats.count,
    })).sort((a, b) => b.usageCount - a.usageCount)
  }

  // Helper methods
  private getDateRange(timeRange: AnalyticsTimeRange): { startDate: Date; endDate: Date } {
    const now = new Date()
    const endDate = new Date()
    const startDate = new Date()

    switch (timeRange) {
      case "today":
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      case "week":
        startDate.setDate(now.getDate() - 7)
        break
      case "month":
        startDate.setMonth(now.getMonth() - 1)
        break
      case "quarter":
        startDate.setMonth(now.getMonth() - 3)
        break
      case "year":
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case "all_time":
        startDate.setFullYear(2020) // Or use earliest task date
        break
    }

    return { startDate, endDate }
  }

  private getPriorityValue(priority: string): number {
    switch (priority) {
      case TASK_PRIORITY.URGENT: return 4
      case TASK_PRIORITY.HIGH: return 3
      case TASK_PRIORITY.MEDIUM: return 2
      case TASK_PRIORITY.LOW: return 1
      default: return 2
    }
  }

  private async getTasksCompletedToday(userId: string): Promise<number> {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const result = await this.db
      .select({ count: count(tasks.id) })
      .from(tasks)
      .where(and(
        eq(tasks.userId, userId),
        eq(tasks.status, TASK_STATUS.DONE),
        gte(tasks.completedAt, todayStart),
        lte(tasks.completedAt, todayEnd)
      ))
      .limit(1)

    return Number(result[0].count) || 0
  }

  private async getTasksDueToday(userId: string): Promise<number> {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const result = await this.db
      .select({ count: count(tasks.id) })
      .from(tasks)
      .where(and(
        eq(tasks.userId, userId),
        gte(tasks.dueDate, todayStart),
        lte(tasks.dueDate, todayEnd),
        sql`${tasks.status} != 'done'`
      ))
      .limit(1)

    return Number(result[0].count) || 0
  }

  private async getOverdueTasksCount(userId: string): Promise<number> {
    const result = await this.db
      .select({ count: count(tasks.id) })
      .from(tasks)
      .where(and(
        eq(tasks.userId, userId),
        sql`${tasks.dueDate} < NOW()`,
        eq(tasks.status, TASK_STATUS.TODO)
      ))
      .limit(1)

    return Number(result[0].count) || 0
  }

  private async getProductivityScore(userId: string): Promise<number> {
    // Simplified productivity score based on recent completion rate
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const result = await this.db
      .select({
        total: count(tasks.id),
        completed: sql<number>`SUM(CASE WHEN ${tasks.status} = 'done' THEN 1 ELSE 0 END)`,
      })
      .from(tasks)
      .where(and(
        eq(tasks.userId, userId),
        gte(tasks.createdAt, weekAgo)
      ))
      .limit(1)

    const total = Number(result[0].total) || 0
    const completed = Number(result[0].completed) || 0

    return total > 0 ? Math.round((completed / total) * 100) : 0
  }

  private async getStreakDays(userId: string): Promise<number> {
    // Simplified streak calculation - count consecutive days with completed tasks
    // In production, this would be more sophisticated
    const result = await this.db
      .select({
        date: sql<string>`DATE(${tasks.completedAt})`,
        count: count(tasks.id),
      })
      .from(tasks)
      .where(and(
        eq(tasks.userId, userId),
        eq(tasks.status, TASK_STATUS.DONE),
        gte(tasks.completedAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
      ))
      .groupBy(sql`DATE(${tasks.completedAt})`)
      .orderBy(desc(sql`DATE(${tasks.completedAt})`))

    // Simple streak calculation - count consecutive days from today
    let streak = 0
    const today = new Date().toISOString().split('T')[0]

    for (const record of result) {
      if (record.date === today || streak > 0) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  private async getTasksInProgressCount(userId: string): Promise<number> {
    const result = await this.db
      .select({ count: count(tasks.id) })
      .from(tasks)
      .where(and(
        eq(tasks.userId, userId),
        eq(tasks.status, TASK_STATUS.IN_PROGRESS)
      ))
      .limit(1)

    return Number(result[0].count) || 0
  }
}
