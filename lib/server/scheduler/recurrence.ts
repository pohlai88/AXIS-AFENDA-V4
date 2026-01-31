import "@/lib/server/only"

import { addDays, addWeeks, addMonths, addYears, isBefore, isAfter } from "date-fns"
import { eq, and, lte, isNotNull } from "drizzle-orm"

import { getDb } from "@/lib/server/db/client"
import { tasks, recurrenceRules, taskHistory } from "@/lib/server/db/schema"
import { TASK_HISTORY_ACTION, TASK_STATUS, type RecurrenceRule } from "@/lib/contracts/tasks"

/**
 * Background scheduler: generates next task occurrences from recurrence rules.
 *
 * Call this periodically (e.g., daily cron job) to create next occurrences
 * for recurring tasks and update history.
 */

export async function generateNextOccurrences(limit = 100) {
  const db = getDb()
  const now = new Date()
  let generated = 0

  // Find all active recurring tasks (not marked as recurrence child).
  // "recurring" means it has a recurrenceRuleId.
  const recurringTasks = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.isRecurrenceChild, false), isNotNull(tasks.recurrenceRuleId)))
    .limit(limit)

  // For each task with a recurrence rule, check if next occurrence should be generated
  for (const task of recurringTasks) {
    if (!task.recurrenceRuleId) continue

    const [rule] = await db
      .select()
      .from(recurrenceRules)
      .where(eq(recurrenceRules.id, task.recurrenceRuleId))

    if (!rule) continue

    const ruleForCalc: RecurrenceRule = {
      frequency: rule.frequency as RecurrenceRule["frequency"],
      interval: rule.interval ?? 1,
      daysOfWeek: Array.isArray(rule.daysOfWeek) ? (rule.daysOfWeek as number[]) : undefined,
      daysOfMonth: Array.isArray(rule.daysOfMonth) ? (rule.daysOfMonth as number[]) : undefined,
      endDate: rule.endDate ? rule.endDate.toISOString() : undefined,
      maxOccurrences: rule.maxOccurrences ?? undefined,
    }

    // Check if max occurrences reached or end date passed
    if (rule.maxOccurrences && rule.occurrenceCount >= rule.maxOccurrences) {
      continue
    }
    if (rule.endDate && isAfter(now, rule.endDate)) {
      continue
    }

    // Calculate next occurrence date
    const nextDue = calculateNextOccurrence(task.dueDate || now, ruleForCalc)
    if (!nextDue || isBefore(nextDue, now)) {
      continue
    }

    // Create next occurrence task
    try {
      const [newTask] = await db
        .insert(tasks)
        .values({
          userId: task.userId,
          projectId: task.projectId,
          title: task.title,
          description: task.description,
          dueDate: nextDue,
          priority: task.priority,
          status: TASK_STATUS.TODO,
          tags: task.tags,
          isRecurrenceChild: true,
          parentRecurrenceTaskId: task.id,
          recurrenceRuleId: task.recurrenceRuleId,
        })
        .returning()

      // Update rule occurrence count
      await db
        .update(recurrenceRules)
        .set({
          occurrenceCount: rule.occurrenceCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(recurrenceRules.id, rule.id))

      // Log history
      await db.insert(taskHistory).values({
        taskId: newTask.id,
        userId: task.userId,
        action: TASK_HISTORY_ACTION.AUTO_GENERATED,
        previousValues: JSON.stringify({ parentTaskId: task.id }),
      })

      generated++
    } catch (error) {
      console.error(`Failed to generate next occurrence for task ${task.id}:`, error)
    }
  }

  return { generated, timestamp: new Date().toISOString() }
}

/**
 * Calculate next occurrence date based on recurrence rule and current due date.
 */
function calculateNextOccurrence(
  currentDue: Date,
  ruleObj: RecurrenceRule
): Date | null {
  let nextDate: Date

  switch (ruleObj.frequency) {
    case "daily":
      nextDate = addDays(currentDue, ruleObj.interval || 1)
      break

    case "weekly":
      const daysToAdd = ruleObj.daysOfWeek ? calculateWeeklyDate(currentDue, ruleObj.daysOfWeek) : 7
      nextDate = addDays(currentDue, daysToAdd)
      break

    case "biweekly":
      nextDate = addWeeks(currentDue, 2)
      break

    case "monthly":
      if (ruleObj.daysOfMonth && ruleObj.daysOfMonth.length > 0) {
        nextDate = calculateMonthlyDate(currentDue, ruleObj.daysOfMonth)
      } else {
        nextDate = addMonths(currentDue, 1)
      }
      break

    case "yearly":
      nextDate = addYears(currentDue, 1)
      break

    default:
      return null
  }

  // Respect end date
  if (ruleObj.endDate && isAfter(nextDate, new Date(ruleObj.endDate))) {
    return null
  }

  return nextDate
}

/**
 * Helper: get next date matching specified days of week (0=Sun, 6=Sat).
 */
function calculateWeeklyDate(fromDate: Date, daysOfWeek: number[]): number {
  const currentDay = fromDate.getDay()
  const validDays = daysOfWeek.sort()

  // Find next matching day
  for (const day of validDays) {
    if (day > currentDay) {
      return day - currentDay
    }
  }

  // Wrap to next week
  return 7 - currentDay + (validDays[0] || 0)
}

/**
 * Helper: get next date matching specified days of month.
 */
function calculateMonthlyDate(fromDate: Date, daysOfMonth: number[]): Date {
  const currentDate = fromDate.getDate()
  const validDays = daysOfMonth.sort()

  // Find next matching day in current month
  for (const day of validDays) {
    if (day > currentDate) {
      const nextDate = new Date(fromDate)
      nextDate.setDate(day)
      return nextDate
    }
  }

  // Move to next month and pick first valid day
  const nextMonth = addMonths(fromDate, 1)
  const targetDay = validDays[0] || 1
  nextMonth.setDate(Math.min(targetDay, 31))
  return nextMonth
}

/**
 * Cleanup: mark tasks as done if they're overdue and status is still "todo".
 * (Optional: can be called separately or as part of scheduler)
 */
export async function cleanupOverdueTasks() {
  const db = getDb()
  const now = new Date()

  // Find tasks that are 7+ days overdue
  const overdueTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.status, TASK_STATUS.TODO),
        lte(tasks.dueDate, addDays(now, -7)) // Due 7+ days ago
      )
    )

  for (const task of overdueTasks) {
    await db
      .update(tasks)
      .set({
        status: TASK_STATUS.CANCELLED,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, task.id))

    await db.insert(taskHistory).values({
      taskId: task.id,
      userId: task.userId,
      action: TASK_HISTORY_ACTION.AUTO_CANCELLED_OVERDUE,
    })
  }

  return { cleaned: overdueTasks.length }
}
