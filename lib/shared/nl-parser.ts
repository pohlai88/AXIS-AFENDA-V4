import { TASK_PRIORITY, type NlParseResult, type TaskPriority } from "@/lib/contracts/tasks"

/**
 * Natural Language Task Parser
 * 
 * Extracts structured task information from natural language input.
 * Supports date/time parsing, priority extraction, and tag recognition.
 * 
 * Examples:
 * - "tomorrow 9am call with Bob" → { title: "call with Bob", dueDate: "2024-01-XXT09:00:00Z" }
 * - "urgent finish report by friday" → { title: "finish report", priority: "urgent", dueDate: "..." }
 * - "review #docs #important today" → { title: "review", tags: ["docs", "important"], dueDate: "..." }
 */

// Priority keywords mapping
const PRIORITY_KEYWORDS: Record<string, TaskPriority> = {
  // High priority
  "urgent": TASK_PRIORITY.URGENT,
  "asap": TASK_PRIORITY.URGENT,
  "critical": TASK_PRIORITY.URGENT,
  "emergency": TASK_PRIORITY.URGENT,

  // High priority
  "high": TASK_PRIORITY.HIGH,
  "important": TASK_PRIORITY.HIGH,
  "priority": TASK_PRIORITY.HIGH,

  // Low priority
  "low": TASK_PRIORITY.LOW,
  "later": TASK_PRIORITY.LOW,
  "sometime": TASK_PRIORITY.LOW,
  "eventually": TASK_PRIORITY.LOW,
}

// Date/time patterns
const DATE_PATTERNS = [
  // Relative dates
  {
    pattern: /\b(today|tonight)\b/i, getDate: (match: string) => {
      const now = new Date()
      if (match.toLowerCase() === "tonight") {
        now.setHours(18, 0, 0, 0) // 6 PM
      }
      return now
    }
  },

  {
    pattern: /\b(tomorrow|tmrw)\b/i, getDate: () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow
    }
  },

  {
    pattern: /\byesterday\b/i, getDate: () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      return yesterday
    }
  },

  // Days of the week
  {
    pattern: /\b(monday|mon|tuesday|tue|wednesday|wed|thursday|thu|friday|fri|saturday|sat|sunday|sun)\b/i,
    getDate: (match: string) => {
      const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
      const targetDay = days.indexOf(match.toLowerCase().slice(0, 3))
      const today = new Date()
      const currentDay = today.getDay()

      let daysUntilTarget = targetDay - currentDay
      if (daysUntilTarget <= 0) daysUntilTarget += 7 // Next week if today or past

      const targetDate = new Date(today)
      targetDate.setDate(today.getDate() + daysUntilTarget)
      targetDate.setHours(9, 0, 0, 0) // 9 AM default
      return targetDate
    }
  },

  // Time patterns
  {
    pattern: /\b(\d{1,2})(:(\d{2}))?\s*(am|pm)\b/i,
    getDate: (match: string) => {
      const timeMatch = match.match(/(\d{1,2})(:(\d{2}))?\s*(am|pm)/i)
      if (!timeMatch) return null

      const [, hours, , minutes = "0", period] = timeMatch
      let hour = parseInt(hours)
      const minute = parseInt(minutes)

      if (period.toLowerCase() === "pm" && hour !== 12) hour += 12
      if (period.toLowerCase() === "am" && hour === 12) hour = 0

      const today = new Date()
      today.setHours(hour, minute, 0, 0)

      // If time is in the past, assume tomorrow
      if (today < new Date()) {
        today.setDate(today.getDate() + 1)
      }

      return today
    }
  },
]

// Tag extraction pattern (#hashtag)
const TAG_PATTERN = /#(\w+)/g

export function parseNaturalLanguage(input: string): NlParseResult {
  const result: NlParseResult = {
    title: input.trim(),
  }

  let processedText = input

  // Extract priority
  for (const [keyword, priority] of Object.entries(PRIORITY_KEYWORDS)) {
    const regex = new RegExp(`\\b${keyword}\\b`, "i")
    if (regex.test(input)) {
      result.priority = priority
      processedText = processedText.replace(regex, "").trim()
      break
    }
  }

  // Extract tags
  const tagMatches = input.match(TAG_PATTERN)
  if (tagMatches) {
    result.tags = tagMatches.map(tag => tag.slice(1)) // Remove #
    processedText = processedText.replace(TAG_PATTERN, "").trim()
  }

  // Extract dates/times
  for (const { pattern, getDate } of DATE_PATTERNS) {
    const match = processedText.match(pattern)
    if (match) {
      const date = getDate(match[0])
      if (date) {
        result.dueDate = date.toISOString()
        processedText = processedText.replace(pattern, "").trim()
        break
      }
    }
  }

  // Clean up the title by removing extracted elements and extra spaces
  result.title = processedText
    .replace(/\s+/g, " ")
    .trim()

  return result
}
