import { z } from "zod"
import { ORGANIZATION, TEAM, PERMISSIONS, RESOURCE_SHARING } from "@/lib/constants"

/**
 * Organization schemas for API validation
 */

export const createOrganizationSchema = z.object({
  name: z.string()
    .min(1, "Organization name is required")
    .max(ORGANIZATION.MAX_NAME_LENGTH, `Organization name must be less than ${ORGANIZATION.MAX_NAME_LENGTH} characters`),
  slug: z.string()
    .min(1, "Organization slug is required")
    .max(ORGANIZATION.MAX_SLUG_LENGTH, `Organization slug must be less than ${ORGANIZATION.MAX_SLUG_LENGTH} characters`)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string()
    .max(ORGANIZATION.MAX_DESCRIPTION_LENGTH, `Description must be less than ${ORGANIZATION.MAX_DESCRIPTION_LENGTH} characters`)
    .optional(),
  logo: z.string().url().optional(),
})

export const updateOrganizationSchema = createOrganizationSchema.partial()

export const organizationParamsSchema = z.object({
  id: z.string().uuid("Invalid organization ID"),
})

export const organizationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
})

/**
 * Team schemas for API validation
 */

export const createTeamSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID"),
  name: z.string()
    .min(1, "Team name is required")
    .max(TEAM.MAX_NAME_LENGTH, `Team name must be less than ${TEAM.MAX_NAME_LENGTH} characters`),
  slug: z.string()
    .min(1, "Team slug is required")
    .max(TEAM.MAX_SLUG_LENGTH, `Team slug must be less than ${TEAM.MAX_SLUG_LENGTH} characters`)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string()
    .max(TEAM.MAX_DESCRIPTION_LENGTH, `Description must be less than ${TEAM.MAX_DESCRIPTION_LENGTH} characters`)
    .optional(),
  parentId: z.string().uuid("Invalid parent team ID").optional(),
})

export const updateTeamSchema = createTeamSchema.partial().omit({ organizationId: true })

export const teamParamsSchema = z.object({
  id: z.string().uuid("Invalid team ID"),
})

export const teamQuerySchema = organizationQuerySchema

/**
 * Membership schemas for API validation
 */

export const inviteUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["owner", "admin", "member"]),
  teamIds: z.array(z.string().uuid()).optional(),
  message: z.string().max(500, "Message must be less than 500 characters").optional(),
})

export const updateMembershipSchema = z.object({
  role: z.enum(["owner", "admin", "member", "manager"]),
})

export const membershipParamsSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
})

export const membershipQuerySchema = z.object({
  role: z.enum(["owner", "admin", "member"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
})

/**
 * Resource sharing schemas
 */

export const shareResourceSchema = z.object({
  resourceType: z.enum(["project", "task"]),
  resourceId: z.string().uuid("Invalid resource ID"),
  targetType: z.enum(["user", "organization", "team"]),
  targetId: z.string().uuid("Invalid target ID"),
  permissions: z.object({
    read: z.boolean().default(true),
    write: z.boolean().default(false),
    admin: z.boolean().default(false),
  }),
  expiresAt: z.string().datetime().optional(),
})

export const updateShareSchema = z.object({
  permissions: z.object({
    read: z.boolean(),
    write: z.boolean(),
    admin: z.boolean(),
  }),
  expiresAt: z.string().datetime().optional(),
})

export const shareParamsSchema = z.object({
  id: z.string().uuid("Invalid share ID"),
})

export const shareQuerySchema = z.object({
  resourceType: z.enum([RESOURCE_SHARING.RESOURCE_TYPES.PROJECT, RESOURCE_SHARING.RESOURCE_TYPES.TASK]).optional(),
  resourceId: z.string().uuid().optional(),
  targetType: z.enum([
    RESOURCE_SHARING.TARGET_TYPES.USER,
    RESOURCE_SHARING.TARGET_TYPES.TEAM,
    RESOURCE_SHARING.TARGET_TYPES.ORGANIZATION
  ]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

/**
 * Permission check schema
 */

export const checkPermissionSchema = z.object({
  permission: z.string().min(1, "Permission is required"),
  context: z.object({
    organizationId: z.string().uuid().optional(),
    teamId: z.string().uuid().optional(),
    resourceId: z.string().uuid().optional(),
    resourceType: z.enum([RESOURCE_SHARING.RESOURCE_TYPES.PROJECT, RESOURCE_SHARING.RESOURCE_TYPES.TASK]).optional(),
  }).optional(),
})

/**
 * Response types
 */

export const organizationResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  logo: z.string().nullable(),
  settings: z.record(z.string(), z.any()),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  memberCount: z.number().optional(),
  teamCount: z.number().optional(),
})

export const teamResponseSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  parentId: z.string().uuid().nullable(),
  settings: z.record(z.string(), z.any()),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  memberCount: z.number().optional(),
  parentTeam: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }).nullable().optional(),
})

export const membershipResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  teamId: z.string().uuid().nullable(),
  role: z.string(),
  permissions: z.record(z.string(), z.boolean()),
  invitedBy: z.string().uuid().nullable(),
  joinedAt: z.string().datetime(),
  isActive: z.boolean(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string(),
    displayName: z.string().nullable(),
    avatar: z.string().nullable(),
  }),
  team: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }).nullable().optional(),
})

export const shareResponseSchema = z.object({
  id: z.string().uuid(),
  resourceType: z.string(),
  resourceId: z.string().uuid(),
  targetType: z.string(),
  targetId: z.string().uuid(),
  permissions: z.object({
    read: z.boolean(),
    write: z.boolean(),
    admin: z.boolean(),
  }),
  expiresAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid(),
  resource: z.record(z.string(), z.any()).optional(),
  target: z.record(z.string(), z.any()).optional(),
})

export const permissionCheckResponseSchema = z.object({
  hasPermission: z.boolean(),
  permissions: z.array(z.string()),
})

// Type exports
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>
export type OrganizationParams = z.infer<typeof organizationParamsSchema>
export interface OrganizationQuery {
  page: number
  limit: number
  search?: string
  role?: string
}

export type CreateTeamInput = z.infer<typeof createTeamSchema>
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>
export type TeamParams = z.infer<typeof teamParamsSchema>
export interface TeamQuery {
  page: number
  limit: number
  search?: string
  role?: string
}

export type InviteUserInput = z.infer<typeof inviteUserSchema>
export type UpdateMembershipInput = z.infer<typeof updateMembershipSchema>
export type MembershipParams = z.infer<typeof membershipParamsSchema>
export type MembershipQuery = z.infer<typeof membershipQuerySchema>

export type ShareResourceInput = z.infer<typeof shareResourceSchema>
export type UpdateShareInput = z.infer<typeof updateShareSchema>
export type ShareParams = z.infer<typeof shareParamsSchema>
export type ShareQuery = z.infer<typeof shareQuerySchema>

export type CheckPermissionInput = z.infer<typeof checkPermissionSchema>

export type OrganizationResponse = z.infer<typeof organizationResponseSchema>
export type TeamResponse = z.infer<typeof teamResponseSchema>
export type MembershipResponse = z.infer<typeof membershipResponseSchema>
export type ShareResponse = z.infer<typeof shareResponseSchema>
export type PermissionCheckResponse = z.infer<typeof permissionCheckResponseSchema>
