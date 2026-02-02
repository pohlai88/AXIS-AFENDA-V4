import "@/lib/server/only"

import { getAuthContext } from "@/lib/server/auth/context"
import { createNeonDataApiClient } from "@/lib/server/neon/data-api"

export interface UserDataAccessOptions {
  includePrivate?: boolean
  limit?: number
  offset?: number
}

type TaskRow = Record<string, unknown> & { due_date?: unknown }

function normalizeTodo(row: TaskRow) {
  const { due_date, ...rest } = row
  return {
    ...rest,
    due_at: typeof due_date === "string" ? due_date : due_date ?? null,
  }
}

export class UserDataService {
  private static async getAuthenticatedClient() {
    const authContext = await getAuthContext()
    
    if (!authContext.userId) {
      throw new Error("User not authenticated")
    }

    // Neon Data API requires a Neon Auth user JWT as bearer token.
    if (authContext.authSource !== "neon-auth" || !authContext.sessionId) {
      throw new Error("Neon Auth session required for Data API access")
    }

    return {
      client: createNeonDataApiClient(authContext.sessionId),
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
      filter.user_id = authContext.userId
    }

    const response = await client.get("public.tasks", {
      select: "id, title, description, status, due_date, created_at, updated_at",
      filter,
      limit: options.limit || 50,
      offset: options.offset || 0,
      order: "created_at.desc",
    })

    if (response.error) {
      throw new Error(`Failed to fetch todos: ${response.error}`)
    }

    return {
      todos: response.data.map((row) => normalizeTodo(row as TaskRow)),
      authSource: authContext.authSource,
      userId: authContext.userId,
      roles: authContext.roles,
    }
  }

  static async getUserProfile() {
    const { client, authContext } = await this.getAuthenticatedClient()

    // Get user profile from the database
    const response = await client.get("public.user_profiles", {
      select: "user_id, email, created_at",
      filter: { user_id: authContext.userId },
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
      user: {
        id: String((user as Record<string, unknown>)["user_id"] ?? authContext.userId),
        email: (user as Record<string, unknown>)["email"],
        created_at: (user as Record<string, unknown>)["created_at"],
        role: authContext.roles[0] ?? "user",
      },
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

    const response = await client.post("public.tasks", {
      user_id: authContext.userId,
      title: todoData.title,
      description: todoData.description,
      due_date: todoData.due_at,
      status: "todo",
    })

    if (response.error) {
      throw new Error(`Failed to create todo: ${response.error}`)
    }

    return {
      todo: normalizeTodo((response.data[0] ?? {}) as TaskRow),
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
      filter.user_id = authContext.userId
    }

    const { due_at, ...rest } = updates

    const response = await client.patch(
      "public.tasks",
      {
        ...rest,
        ...(due_at ? { due_date: due_at } : {}),
        updated_at: new Date().toISOString(),
      },
      filter
    )

    if (response.error) {
      throw new Error(`Failed to update todo: ${response.error}`)
    }

    return {
      todo: normalizeTodo((response.data[0] ?? {}) as TaskRow),
      authSource: authContext.authSource,
    }
  }

  static async deleteUserTodo(todoId: string) {
    const { client, authContext } = await this.getAuthenticatedClient()

    // Ensure user can only delete their own todos (unless admin)
    const filter: Record<string, unknown> = { id: todoId }
    
    if (!authContext.roles.includes("admin")) {
      filter.user_id = authContext.userId
    }

    const response = await client.delete("public.tasks", filter)

    if (response.error) {
      throw new Error(`Failed to delete todo: ${response.error}`)
    }

    return {
      success: true,
      authSource: authContext.authSource,
    }
  }
}
