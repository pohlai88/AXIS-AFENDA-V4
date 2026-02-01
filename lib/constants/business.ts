/**
 * Business domain constants for organizations, teams, permissions, etc.
 * Centralized definitions for multi-tenancy and collaboration features.
 */

/**
 * Organization-related constants
 */
export const ORGANIZATION = {
  /** Maximum length for organization name */
  MAX_NAME_LENGTH: 255,
  /** Maximum length for organization slug */
  MAX_SLUG_LENGTH: 100,
  /** Maximum length for organization description */
  MAX_DESCRIPTION_LENGTH: 1000,
  
  /** Organization roles */
  ROLES: {
    /** Organization owner - full control */
    OWNER: "owner",
    /** Organization admin - management access */
    ADMIN: "admin",
    /** Organization member - basic access */
    MEMBER: "member",
  },
  
  /** Default role for new members */
  DEFAULT_ROLE: "member" as const,
} as const

export type OrganizationRoleKey = keyof typeof ORGANIZATION.ROLES
export type OrganizationRoleValue = (typeof ORGANIZATION.ROLES)[OrganizationRoleKey]

/**
 * Team-related constants
 */
export const TEAM = {
  /** Maximum length for team name */
  MAX_NAME_LENGTH: 255,
  /** Maximum length for team slug */
  MAX_SLUG_LENGTH: 100,
  /** Maximum length for team description */
  MAX_DESCRIPTION_LENGTH: 1000,
  
  /** Team roles */
  ROLES: {
    /** Team manager - full team control */
    MANAGER: "manager",
    /** Team member - basic team access */
    MEMBER: "member",
  },
} as const

export type TeamRoleKey = keyof typeof TEAM.ROLES
export type TeamRoleValue = (typeof TEAM.ROLES)[TeamRoleKey]

/**
 * Permission constants following hybrid methodology
 * (Focalboard + Mattermost + Nextcloud)
 */
export const PERMISSIONS = {
  // System permissions
  /** Full system administration access */
  SYSTEM_ADMIN: "system:admin",
  /** Manage system users */
  SYSTEM_USER_MANAGE: "system:user:manage",
  
  // Organization permissions
  /** Create new organizations */
  ORG_CREATE: "organization:create",
  /** View organization details */
  ORG_READ: "organization:read",
  /** Update organization settings */
  ORG_UPDATE: "organization:update",
  /** Delete organization */
  ORG_DELETE: "organization:delete",
  /** Full organization management */
  ORG_MANAGE: "organization:manage",
  /** Invite members to organization */
  ORG_MEMBER_INVITE: "organization:member:invite",
  /** Manage organization members */
  ORG_MEMBER_MANAGE: "organization:member:manage",
  /** Remove members from organization */
  ORG_MEMBER_REMOVE: "organization:member:remove",
  /** Create teams in organization */
  ORG_TEAM_CREATE: "organization:team:create",
  /** Manage organization teams */
  ORG_TEAM_MANAGE: "organization:team:manage",
  /** Manage organization settings */
  ORG_SETTINGS_MANAGE: "organization:settings:manage",
  
  // Team permissions
  /** Create new teams */
  TEAM_CREATE: "team:create",
  /** View team details */
  TEAM_READ: "team:read",
  /** Update team settings */
  TEAM_UPDATE: "team:update",
  /** Delete team */
  TEAM_DELETE: "team:delete",
  /** Full team management */
  TEAM_MANAGE: "team:manage",
  /** Invite members to team */
  TEAM_MEMBER_INVITE: "team:member:invite",
  /** Manage team members */
  TEAM_MEMBER_MANAGE: "team:member:manage",
  /** Remove members from team */
  TEAM_MEMBER_REMOVE: "team:member:remove",
  /** Manage team settings */
  TEAM_SETTINGS_MANAGE: "team:settings:manage",
  
  // Project permissions
  /** Create new projects */
  PROJECT_CREATE: "project:create",
  /** View projects */
  PROJECT_READ: "project:read",
  /** Update projects */
  PROJECT_UPDATE: "project:update",
  /** Delete projects */
  PROJECT_DELETE: "project:delete",
  /** Share projects with others */
  PROJECT_SHARE: "project:share",
  /** Full project administration */
  PROJECT_ADMIN: "project:admin",
  
  // Task permissions
  /** Create new tasks */
  TASK_CREATE: "task:create",
  /** View tasks */
  TASK_READ: "task:read",
  /** Update tasks */
  TASK_UPDATE: "task:update",
  /** Delete tasks */
  TASK_DELETE: "task:delete",
  /** Assign tasks to users */
  TASK_ASSIGN: "task:assign",
  /** Comment on tasks */
  TASK_COMMENT: "task:comment",
  
  // Sharing permissions
  /** View shared resources */
  SHARE_READ: "share:read",
  /** Edit shared resources */
  SHARE_WRITE: "share:write",
  /** Manage resource sharing */
  SHARE_ADMIN: "share:admin",
} as const

export type PermissionKey = keyof typeof PERMISSIONS
export type PermissionValue = (typeof PERMISSIONS)[PermissionKey]

/**
 * Resource sharing constants
 */
export const RESOURCE_SHARING = {
  /** Resource types that can be shared */
  RESOURCE_TYPES: {
    PROJECT: "project",
    TASK: "task",
  },
  
  /** Target types for sharing */
  TARGET_TYPES: {
    USER: "user",
    TEAM: "team",
    ORGANIZATION: "organization",
  },
  
  /** Default share expiration time (30 days in milliseconds) */
  DEFAULT_EXPIRATION: 30 * 24 * 60 * 60 * 1000,
} as const

export type ResourceTypeKey = keyof typeof RESOURCE_SHARING.RESOURCE_TYPES
export type ResourceTypeValue = (typeof RESOURCE_SHARING.RESOURCE_TYPES)[ResourceTypeKey]
export type TargetTypeKey = keyof typeof RESOURCE_SHARING.TARGET_TYPES
export type TargetTypeValue = (typeof RESOURCE_SHARING.TARGET_TYPES)[TargetTypeKey]

/**
 * Task filtering constants
 */
export const TASK_FILTERING = {
  /** Fields that can be searched */
  SEARCH_FIELDS: {
    TITLE: "title",
    DESCRIPTION: "description",
    TAGS: "tags",
    ASSIGNEE: "assignee",
    REPORTER: "reporter",
    ALL: "all",
  },
  
  /** Search match types */
  SEARCH_MATCH_TYPES: {
    EXACT: "exact",
    PARTIAL: "partial",
    FUZZY: "fuzzy",
    CONTAINS: "contains",
  },
  
  /** Include modes for filters */
  INCLUDE_MODES: {
    ANY: "any",
    ALL: "all",
    NONE: "none",
  },
  
  /** Sort options */
  SORT_OPTIONS: {
    CREATED_AT: "createdAt",
    UPDATED_AT: "updatedAt",
    DUE_DATE: "dueDate",
    PRIORITY: "priority",
    STATUS: "status",
    TITLE: "title",
  },
  
  /** Sort order */
  SORT_ORDER: {
    ASC: "asc",
    DESC: "desc",
  },
  
  /** Default values */
  DEFAULTS: {
    SORT_BY: "createdAt",
    SORT_ORDER: "desc",
    PAGE: 1,
    LIMIT: 20,
  },
} as const

/**
 * UI-specific task filtering constants
 */
export const TASK_FILTERING_UI = {
  /** Maximum number of filters */
  MAX_FILTERS: 10,
  /** Maximum number of tags per filter */
  MAX_TAGS_PER_FILTER: 20,
  /** Section labels for UI */
  SECTION_LABELS: {
    STATUS: "Status",
    PRIORITY: "Priority",
    ASSIGNEE: "Assignee",
    TAGS: "Tags",
    DUE_DATE: "Due Date",
    QUICK_FILTERS: "Quick Filters",
  },
  /** Quick filter options */
  QUICK_FILTERS: {
    ALL: "all",
    MY_TASKS: "my_tasks",
    DUE_TODAY: "due_today",
    DUE_THIS_WEEK: "due_this_week",
    OVERDUE: "overdue",
    COMPLETED: "completed",
  },
} as const

/**
 * Circuit breaker constants for resilience
 */
export const CIRCUIT_BREAKER = {
  /** Failure threshold before opening circuit */
  FAILURE_THRESHOLD: 5,
  /** Timeout for requests (milliseconds) */
  TIMEOUT: 10000,
  /** Reset timeout (milliseconds) */
  RESET_TIMEOUT: 60000,
  /** Window size for tracking failures */
  WINDOW_SIZE: 10,
  /** Duration circuit stays open (milliseconds) */
  OPEN_DURATION_MS: 30000,
  /** Maximum probes in half-open state */
  HALF_OPEN_MAX_PROBES: 3,
} as const