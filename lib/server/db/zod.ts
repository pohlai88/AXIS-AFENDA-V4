import "@/lib/server/only"

import { createInsertSchema, createSelectSchema } from "drizzle-zod"

import { users } from "./schema"

export const UserSelectSchema = createSelectSchema(users)
export const UserInsertSchema = createInsertSchema(users)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

