"use client"

import { create } from "zustand"
import type { TaskResponse } from "@/lib/contracts/tasks"

interface TasksStore {
  tasks: TaskResponse[]
  loading: boolean
  error: string | null
  userId: string

  // Actions
  setTasks: (tasks: TaskResponse[]) => void
  setUserId: (userId: string) => void
  addTask: (task: TaskResponse) => void
  updateTask: (id: string, updates: Partial<TaskResponse>) => void
  removeTask: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // API calls (userId now passed as parameter)
  fetchTasks: (userId: string, filters?: { status?: string; priority?: string }) => Promise<void>
  createTask: (userId: string, title: string, details?: Partial<TaskResponse>) => Promise<TaskResponse | null>
  updateTaskStatus: (userId: string, id: string, status: string) => Promise<void>
  deleteTask: (userId: string, id: string) => Promise<void>
}

export const useTasksStore = create<TasksStore>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  userId: "",

  setTasks: (tasks) => set({ tasks }),
  setUserId: (userId) => set({ userId }),
  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  removeTask: (id) => set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchTasks: async (userId, filters) => {
    set({ loading: true, error: null })
    try {
      const params = new URLSearchParams()
      if (filters?.status) params.append("status", filters.status)
      if (filters?.priority) params.append("priority", filters.priority)

      const res = await fetch(`/api/v1/tasks?${params.toString()}`, {
        headers: {
          "x-user-id": userId,
        },
      })

      if (!res.ok) {
        throw new Error("Failed to fetch tasks")
      }

      const data = await res.json()
      set({ tasks: data.data.items || [], loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  createTask: async (userId, title, details) => {
    try {
      const res = await fetch("/api/v1/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({ title, ...details }),
      })

      if (!res.ok) {
        throw new Error("Failed to create task")
      }

      const data = await res.json()
      const task = data.data
      get().addTask(task)
      return task
    } catch (err) {
      set({ error: (err as Error).message })
      return null
    }
  },

  updateTaskStatus: async (userId, id, status) => {
    try {
      const res = await fetch(`/api/v1/tasks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({ status }),
      })

      if (!res.ok) {
        throw new Error("Failed to update task")
      }

      const data = await res.json()
      get().updateTask(id, data.data)
    } catch (err) {
      set({ error: (err as Error).message })
    }
  },

  deleteTask: async (userId, id) => {
    try {
      const res = await fetch(`/api/v1/tasks/${id}`, {
        method: "DELETE",
        headers: {
          "x-user-id": userId,
        },
      })

      if (!res.ok) {
        throw new Error("Failed to delete task")
      }

      get().removeTask(id)
    } catch (err) {
      set({ error: (err as Error).message })
    }
  },
}))
