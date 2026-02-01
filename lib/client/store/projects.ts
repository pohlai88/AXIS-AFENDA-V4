"use client"

import { create } from "zustand"
import { routes } from "@/lib/routes"
import type { ProjectResponse } from "@/lib/contracts/tasks"

interface ProjectsStore {
  projects: ProjectResponse[]
  loading: boolean
  error: string | null
  userId: string

  // Actions
  setProjects: (projects: ProjectResponse[]) => void
  setUserId: (userId: string) => void
  addProject: (project: ProjectResponse) => void
  updateProject: (id: string, updates: Partial<ProjectResponse>) => void
  removeProject: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // API calls (userId now passed as parameter)
  fetchProjects: (userId: string, includeArchived?: boolean) => Promise<void>
  createProject: (userId: string, projectData: { name: string; description?: string; color?: string }) => Promise<ProjectResponse | null>
  updateProjectApi: (userId: string, id: string, updates: Partial<ProjectResponse>) => Promise<void>
  deleteProject: (userId: string, id: string) => Promise<void>
}

export const useProjectsStore = create<ProjectsStore>((set, get) => ({
  projects: [],
  loading: false,
  error: null,
  userId: "",

  setProjects: (projects) => set({ projects }),
  setUserId: (userId) => set({ userId }),
  addProject: (project) => set((state) => ({ projects: [project, ...state.projects] })),
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  removeProject: (id) => set((state) => ({ projects: state.projects.filter((p) => p.id !== id) })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchProjects: async (userId, includeArchived = false) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(
        `${routes.api.v1.magictodo.projects.list()}${includeArchived ? "?includeArchived=true" : ""}`,
        {
          headers: {
            "x-user-id": userId,
          },
        }
      )

      if (!res.ok) {
        throw new Error("Failed to fetch projects")
      }

      const data = await res.json()
      set({ projects: data.data.items || [], loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  createProject: async (userId, projectData) => {
    try {
      const res = await fetch(routes.api.v1.magictodo.projects.list(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify(projectData),
      })

      if (!res.ok) {
        throw new Error("Failed to create project")
      }

      const data = await res.json()
      const project = data.data
      get().addProject(project)
      return project
    } catch (err) {
      set({ error: (err as Error).message })
      return null
    }
  },

  updateProjectApi: async (userId, id, updates) => {
    try {
      const res = await fetch(routes.api.v1.magictodo.projects.byId(id), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify(updates),
      })

      if (!res.ok) {
        throw new Error("Failed to update project")
      }

      const data = await res.json()
      get().updateProject(id, data.data)
    } catch (err) {
      set({ error: (err as Error).message })
    }
  },

  deleteProject: async (userId, id) => {
    try {
      const res = await fetch(routes.api.v1.magictodo.projects.byId(id), {
        method: "DELETE",
        headers: {
          "x-user-id": userId,
        },
      })

      if (!res.ok) {
        throw new Error("Failed to delete project")
      }

      get().removeProject(id)
    } catch (err) {
      set({ error: (err as Error).message })
    }
  },
}))

export default useProjectsStore
