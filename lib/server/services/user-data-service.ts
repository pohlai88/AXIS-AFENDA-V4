import "@/lib/server/only"

import { getAuthContext } from "@/lib/server/auth/context"
import { createNeonDataApiClient } from "@/lib/server/neon/data-api"

export interface UserDataAccessOptions {
  includePrivate?: boolean
  limit?: number
  offset?: number
}

export class UserDataService {
  private static async getAuthenticatedClient() {
    const authContext = await getAuthContext()
    
    if (!authContext.userId) {
      throw new Error("User not authenticated")
    }

    return {
      client: createNeonDataApiClient(authContext.userId),
      authContext,
    }
  }

  static async getUserTodos(options: UserDataAccessOptions = {}) {
    const { client, authContext } = await this.getAuthenticatedClient()

    // User can only access their own todos unless they're admin
    const filter: Record<string, unknown> = {}
    
    if (authContext.roles.includes("admin")) {
      // Admins can see all todos, or filter by specific user if requested
      // For now, let admins see all todos
    } else {
      // Regular users can only see their own todos
      filter.owner = authContext.userId
    }

    const response = await client.get("axis.todo_items", {
      select: "id, title, description, status, due_at, created_at, updated_at",
      filter,
      limit: options.limit || 50,
      offset: options.offset || 0,
      order: "created_at.desc",
    })

    if (response.error) {
      throw new Error(`Failed to fetch todos: ${response.error}`)
    }

    return {
      todos: response.data,
      authSource: authContext.authSource,
      userId: authContext.userId,
      roles: authContext.roles,
    }
  }

  static async getUserProfile() {
    const { client, authContext } = await this.getAuthenticatedClient()

    // Get user profile from the database
    const response = await client.get("axis.users", {
      select: "id, email, role, created_at, updated_at",
      filter: { id: authContext.userId },
      limit: 1,
    })

    if (response.error) {
      throw new Error(`Failed to fetch user profile: ${response.error}`)
    }

    const user = response.data[0]
    if (!user) {
      throw new Error("User not found")
    }

    return {
      user,
      authSource: authContext.authSource,
      roles: authContext.roles,
    }
  }

  static async createUserTodo(todoData: {
    title: string
    description?: string
    due_at?: string
  }) {
    const { client, authContext } = await this.getAuthenticatedClient()

    const response = await client.post("axis.todo_items", {
      title: todoData.title,
      description: todoData.description,
      due_at: todoData.due_at,
      status: "pending",
      owner: authContext.userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (response.error) {
      throw new Error(`Failed to create todo: ${response.error}`)
    }

    return {
      todo: response.data[0],
      authSource: authContext.authSource,
    }
  }

  static async updateUserTodo(todoId: string, updates: {
    title?: string
    description?: string
    status?: string
    due_at?: string
  }) {
    const { client, authContext } = await this.getAuthenticatedClient()

    // Ensure user can only update their own todos (unless admin)
    const filter: Record<string, unknown> = { id: todoId }
    
    if (!authContext.roles.includes("admin")) {
      filter.owner = authContext.userId
    }

    const response = await client.patch("axis.todo_items", {
      ...updates,
      updated_at: new Date().toISOString(),
    }, filter)

    if (response.error) {
      throw new Error(`Failed to update todo: ${response.error}`)
    }

    return {
      todo: response.data[0],
      authSource: authContext.authSource,
    }
  }

  static async deleteUserTodo(todoId: string) {
    const { client, authContext } = await this.getAuthenticatedClient()

    // Ensure user can only delete their own todos (unless admin)
    const filter: Record<string, unknown> = { id: todoId }
    
    if (!authContext.roles.includes("admin")) {
      filter.owner = authContext.userId
    }

    const response = await client.delete("axis.todo_items", filter)

    if (response.error) {
      throw new Error(`Failed to delete todo: ${response.error}`)
    }

    return {
      success: true,
      authSource: authContext.authSource,
    }
  }
}
