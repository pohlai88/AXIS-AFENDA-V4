/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { create } from "zustand"
import { routes } from "@/lib/routes"
import { apiFetch } from "@/lib/api/client"
import { z } from "zod"
import type {
  TaskResponse,
  AdvancedTaskFilters,
  TaskFilterRequest,
  TaskStatus
} from "@/lib/contracts/tasks"
import { parseNaturalLanguage } from "@/lib/shared/nl-parser"
import { TASK_PRIORITY, TASK_STATUS } from "@/lib/contracts/tasks"

// Simple passthrough schema for API calls without validation
const passthroughSchema = z.any()

interface TasksStore {
  tasks: TaskResponse[]
  loading: boolean
  error: string | null
  userId: string

  // Advanced filtering
  filters: AdvancedTaskFilters
  facets: {
    statusCounts: Record<string, number>
    priorityCounts: Record<string, number>
    projectCounts: Record<string, number>
    tagCounts: Record<string, number>
    totalCount: number
  } | null

  // Actions
  setTasks: (tasks: TaskResponse[]) => void
  setUserId: (userId: string) => void
  addTask: (task: TaskResponse) => void
  updateTaskLocal: (id: string, updates: Partial<TaskResponse>) => void
  removeTask: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Advanced filtering actions
  setFilters: (filters: AdvancedTaskFilters) => void
  clearFilters: () => void
  updateFilter: (key: keyof AdvancedTaskFilters, value: unknown) => void

  // API calls (userId now passed as parameter)
  fetchTasks: (userId: string, filters?: { status?: string; priority?: string; projectId?: string }) => Promise<void>
  createTask: (userId: string, title: string, details?: Partial<TaskResponse>) => Promise<TaskResponse | null>
  updateTask: (userId: string, id: string, updates: Partial<TaskResponse>) => Promise<void>
  updateTaskStatus: (userId: string, id: string, status: string) => Promise<void>
  deleteTask: (userId: string, id: string) => Promise<void>

  // Advanced filtering API calls
  fetchFilteredTasks: (userId: string, request: TaskFilterRequest) => Promise<void>
  fetchFacets: (userId: string) => Promise<void>
  applyFilters: (userId: string, filters: AdvancedTaskFilters) => Promise<void>
}

export const useTasksStore = create<TasksStore>((set, get) => ({
  // Initial state
  tasks: [],
  loading: false,
  error: null,
  userId: "",
  filters: {
    sortBy: "createdAt",
    sortOrder: "desc",
  },
  facets: null,

  // Basic actions
  setTasks: (tasks) => set({ tasks }),
  setUserId: (userId) => set({ userId }),
  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
  updateTaskLocal: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  removeTask: (id) => set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Advanced filtering actions
  setFilters: (filters) => set({ filters }),
  clearFilters: () => set({
    filters: {
      sortBy: "createdAt",
      sortOrder: "desc",
    }
  }),
  updateFilter: (key, value) => set((state) => ({
    filters: {
      ...state.filters,
      [key]: value
    }
  })),

  // API calls
  fetchTasks: async (userId, filters) => {
    set({ loading: true, error: null })
    try {
      const queryParams = new URLSearchParams()
      if (filters?.status) queryParams.set('status', filters.status)
      if (filters?.priority) queryParams.set('priority', filters.priority)
      if (filters?.projectId) queryParams.set('projectId', filters.projectId)

      const tasks = await apiFetch(
        `${routes.api.v1.magictodo.tasks.list()}?${queryParams.toString()}`,
        { headers: { "x-user-id": userId } },
        passthroughSchema
      ) as { items: TaskResponse[] }

      set({ tasks: tasks.items || [], loading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch tasks"
      set({ error: errorMessage, loading: false })
    }
  },

  fetchFilteredTasks: async (userId, request) => {
    set({ loading: true, error: null })
    try {
      const filteredTasks = await apiFetch(
        `${routes.api.v1.magictodo.tasks.filter()}`,
        {
          method: 'POST',
          headers: { "x-user-id": userId, "Content-Type": "application/json" },
          body: JSON.stringify(request)
        },
        passthroughSchema
      ) as { items: TaskResponse[]; facets?: any; filters?: AdvancedTaskFilters }

      set({
        tasks: filteredTasks.items || [],
        facets: filteredTasks.facets || null,
        filters: filteredTasks.filters || get().filters,
        loading: false
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch filtered tasks"
      set({ error: errorMessage, loading: false })
    }
  },

  fetchFacets: async (userId) => {
    try {
      const facets = await apiFetch(
        `${routes.api.v1.magictodo.tasks.filter()}?facets=true`,
        { headers: { "x-user-id": userId } },
        passthroughSchema
      ) as { statusCounts: Record<string, number>; priorityCounts: Record<string, number>; projectCounts: Record<string, number>; tagCounts: Record<string, number>; totalCount: number }

      set({ facets })
    } catch (error) {
      console.error("Failed to fetch facets:", error)
    }
  },

  applyFilters: async (userId, filters) => {
    const request: TaskFilterRequest = {
      filters,
      pagination: { limit: 50, offset: 0 }
    }

    await get().fetchFilteredTasks(userId, request)
  },

  createTask: async (userId, title, details) => {
    set({ loading: true, error: null })
    try {
      const nlResult = parseNaturalLanguage(title)

      const taskData = {
        title: nlResult.title,
        description: details?.description || (nlResult as any).description,
        dueDate: details?.dueDate || nlResult.dueDate,
        priority: details?.priority || (nlResult as any).priority || TASK_PRIORITY.MEDIUM,
        status: details?.status || TASK_STATUS.TODO,
        projectId: details?.projectId,
        tags: details?.tags || (nlResult as any).tags || [],
        ...details
      }

      const task = await apiFetch(
        routes.api.v1.magictodo.tasks.list(),
        {
          method: 'POST',
          headers: { "x-user-id": userId, "Content-Type": "application/json" },
          body: JSON.stringify(taskData)
        },
        passthroughSchema
      ) as TaskResponse

      set((state) => ({ tasks: [task, ...state.tasks], loading: false }))
      return task
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create task"
      set({ error: errorMessage, loading: false })
      return null
    }
  },

  updateTask: async (userId, id, updates) => {
    set({ loading: true, error: null })
    try {
      await apiFetch(
        routes.api.v1.magictodo.tasks.byId(id),
        {
          method: 'PATCH',
          headers: { "x-user-id": userId, "Content-Type": "application/json" },
          body: JSON.stringify(updates)
        },
        passthroughSchema
      )

      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        loading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update task"
      set({ error: errorMessage, loading: false })
    }
  },

  updateTaskStatus: async (userId, id, status) => {
    await get().updateTask(userId, id, { status: status as TaskStatus })
  },

  deleteTask: async (userId, id) => {
    set({ loading: true, error: null })
    try {
      await apiFetch(
        routes.api.v1.magictodo.tasks.byId(id),
        {
          method: 'DELETE',
          headers: { "x-user-id": userId },
          body: null
        },
        passthroughSchema
      )

      set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id), loading: false }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete task"
      set({ error: errorMessage, loading: false })
    }
  },
}))
