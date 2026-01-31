/**
 * Feature flags for progressive rollout of organization/team features
 * Following the hybrid methodology's gradual adoption strategy
 */

/**
 * Feature flag definitions
 */
export const FEATURE_FLAGS = {
  // Phase 1: Personal Foundation (Always enabled)
  PERSONAL_TASKS: "personal_tasks",
  PERSONAL_PROJECTS: "personal_projects",
  BASIC_SHARING: "basic_sharing",

  // Phase 2: Team Emergence
  TEAMS_ENABLED: "teams_enabled",
  TEAM_CREATION: "team_creation",
  TEAM_MANAGEMENT: "team_management",
  TEAM_INVITATIONS: "team_invitations",
  TEAM_VIEWS: "team_views",

  // Phase 3: Organization Power
  ORGANIZATIONS_ENABLED: "organizations_enabled",
  ORG_CREATION: "org_creation",
  ORG_MANAGEMENT: "org_management",
  ORG_SETTINGS: "org_settings",
  PERMISSION_SCHEMES: "permission_schemes",
  ADVANCED_SHARING: "advanced_sharing",
  AUDIT_LOGS: "audit_logs",

  // Phase 4: Enterprise Scale
  MULTI_ORG_SUPPORT: "multi_org_support",
  CUSTOM_ROLES: "custom_roles",
  API_ACCESS_CONTROLS: "api_access_controls",
  ADVANCED_ADMIN_TOOLS: "advanced_admin_tools",
  SSO_INTEGRATION: "sso_integration",

  // Progressive UI Features
  TEAM_SIDEBAR: "team_sidebar",
  ORG_HEADER: "org_header",
  ORG_SWITCHER: "org_switcher",
  ADMIN_CONSOLE: "admin_console",
  PERMISSION_BUILDER: "permission_builder",
} as const

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS
export type FeatureFlagValue = (typeof FEATURE_FLAGS)[FeatureFlagKey]

/**
 * Feature flag rollout phases
 */
export const ROLLOUT_PHASES = {
  PHASE_1_PERSONAL: "phase_1_personal",
  PHASE_2_TEAMS: "phase_2_teams",
  PHASE_3_ORGANIZATIONS: "phase_3_organizations",
  PHASE_4_ENTERPRISE: "phase_4_enterprise",
} as const

/**
 * Feature flags grouped by phase
 */
export const PHASE_FEATURES: Record<string, FeatureFlagValue[]> = {
  [ROLLOUT_PHASES.PHASE_1_PERSONAL]: [
    FEATURE_FLAGS.PERSONAL_TASKS,
    FEATURE_FLAGS.PERSONAL_PROJECTS,
    FEATURE_FLAGS.BASIC_SHARING,
  ],
  [ROLLOUT_PHASES.PHASE_2_TEAMS]: [
    FEATURE_FLAGS.TEAMS_ENABLED,
    FEATURE_FLAGS.TEAM_CREATION,
    FEATURE_FLAGS.TEAM_MANAGEMENT,
    FEATURE_FLAGS.TEAM_INVITATIONS,
    FEATURE_FLAGS.TEAM_VIEWS,
    FEATURE_FLAGS.TEAM_SIDEBAR,
  ],
  [ROLLOUT_PHASES.PHASE_3_ORGANIZATIONS]: [
    FEATURE_FLAGS.ORGANIZATIONS_ENABLED,
    FEATURE_FLAGS.ORG_CREATION,
    FEATURE_FLAGS.ORG_MANAGEMENT,
    FEATURE_FLAGS.ORG_SETTINGS,
    FEATURE_FLAGS.PERMISSION_SCHEMES,
    FEATURE_FLAGS.ADVANCED_SHARING,
    FEATURE_FLAGS.AUDIT_LOGS,
    FEATURE_FLAGS.ORG_HEADER,
    FEATURE_FLAGS.ORG_SWITCHER,
  ],
  [ROLLOUT_PHASES.PHASE_4_ENTERPRISE]: [
    FEATURE_FLAGS.MULTI_ORG_SUPPORT,
    FEATURE_FLAGS.CUSTOM_ROLES,
    FEATURE_FLAGS.API_ACCESS_CONTROLS,
    FEATURE_FLAGS.ADVANCED_ADMIN_TOOLS,
    FEATURE_FLAGS.SSO_INTEGRATION,
    FEATURE_FLAGS.ADMIN_CONSOLE,
    FEATURE_FLAGS.PERMISSION_BUILDER,
  ],
}

/**
 * Feature flag triggers - conditions that enable features automatically
 */
export const FEATURE_TRIGGERS = {
  // Teams appear when you have >2 collaborators
  [FEATURE_FLAGS.TEAMS_ENABLED]: {
    type: "collaborator_count",
    threshold: 2,
  },
  // Organization features when >3 teams or admin request
  [FEATURE_FLAGS.ORGANIZATIONS_ENABLED]: {
    type: "team_count",
    threshold: 3,
  },
  // Team sidebar after first successful share
  [FEATURE_FLAGS.TEAM_SIDEBAR]: {
    type: "share_count",
    threshold: 1,
  },
  // Org header when org features enabled
  [FEATURE_FLAGS.ORG_HEADER]: {
    type: "depends_on",
    flag: FEATURE_FLAGS.ORGANIZATIONS_ENABLED,
  },
} as const

/**
 * Default feature flag states (for new users)
 */
export const DEFAULT_FEATURE_FLAGS: Record<FeatureFlagValue, boolean> = {
  // Phase 1 - Always enabled
  [FEATURE_FLAGS.PERSONAL_TASKS]: true,
  [FEATURE_FLAGS.PERSONAL_PROJECTS]: true,
  [FEATURE_FLAGS.BASIC_SHARING]: true,

  // Phase 2 - Disabled by default, enabled by trigger
  [FEATURE_FLAGS.TEAMS_ENABLED]: false,
  [FEATURE_FLAGS.TEAM_CREATION]: false,
  [FEATURE_FLAGS.TEAM_MANAGEMENT]: false,
  [FEATURE_FLAGS.TEAM_INVITATIONS]: false,
  [FEATURE_FLAGS.TEAM_VIEWS]: false,
  [FEATURE_FLAGS.TEAM_SIDEBAR]: false,

  // Phase 3 - Disabled by default, enabled by trigger
  [FEATURE_FLAGS.ORGANIZATIONS_ENABLED]: false,
  [FEATURE_FLAGS.ORG_CREATION]: false,
  [FEATURE_FLAGS.ORG_MANAGEMENT]: false,
  [FEATURE_FLAGS.ORG_SETTINGS]: false,
  [FEATURE_FLAGS.PERMISSION_SCHEMES]: false,
  [FEATURE_FLAGS.ADVANCED_SHARING]: false,
  [FEATURE_FLAGS.AUDIT_LOGS]: false,
  [FEATURE_FLAGS.ORG_HEADER]: false,
  [FEATURE_FLAGS.ORG_SWITCHER]: false,

  // Phase 4 - Disabled by default, opt-in for power users
  [FEATURE_FLAGS.MULTI_ORG_SUPPORT]: false,
  [FEATURE_FLAGS.CUSTOM_ROLES]: false,
  [FEATURE_FLAGS.API_ACCESS_CONTROLS]: false,
  [FEATURE_FLAGS.ADVANCED_ADMIN_TOOLS]: false,
  [FEATURE_FLAGS.SSO_INTEGRATION]: false,
  [FEATURE_FLAGS.ADMIN_CONSOLE]: false,
  [FEATURE_FLAGS.PERMISSION_BUILDER]: false,
}

/**
 * Feature flag descriptions for UI
 */
export const FEATURE_DESCRIPTIONS: Record<FeatureFlagValue, string> = {
  [FEATURE_FLAGS.PERSONAL_TASKS]: "Personal task management",
  [FEATURE_FLAGS.PERSONAL_PROJECTS]: "Personal project organization",
  [FEATURE_FLAGS.BASIC_SHARING]: "Share tasks and projects with others",

  [FEATURE_FLAGS.TEAMS_ENABLED]: "Team collaboration features",
  [FEATURE_FLAGS.TEAM_CREATION]: "Create and manage teams",
  [FEATURE_FLAGS.TEAM_MANAGEMENT]: "Team settings and configuration",
  [FEATURE_FLAGS.TEAM_INVITATIONS]: "Invite members to teams",
  [FEATURE_FLAGS.TEAM_VIEWS]: "Team-specific views and dashboards",
  [FEATURE_FLAGS.TEAM_SIDEBAR]: "Team navigation sidebar",

  [FEATURE_FLAGS.ORGANIZATIONS_ENABLED]: "Organization-level features",
  [FEATURE_FLAGS.ORG_CREATION]: "Create and manage organizations",
  [FEATURE_FLAGS.ORG_MANAGEMENT]: "Organization administration",
  [FEATURE_FLAGS.ORG_SETTINGS]: "Organization settings and preferences",
  [FEATURE_FLAGS.PERMISSION_SCHEMES]: "Custom permission schemes",
  [FEATURE_FLAGS.ADVANCED_SHARING]: "Advanced resource sharing controls",
  [FEATURE_FLAGS.AUDIT_LOGS]: "Activity audit logs",
  [FEATURE_FLAGS.ORG_HEADER]: "Organization header navigation",
  [FEATURE_FLAGS.ORG_SWITCHER]: "Switch between organizations",

  [FEATURE_FLAGS.MULTI_ORG_SUPPORT]: "Multiple organization membership",
  [FEATURE_FLAGS.CUSTOM_ROLES]: "Create custom roles and permissions",
  [FEATURE_FLAGS.API_ACCESS_CONTROLS]: "API access management",
  [FEATURE_FLAGS.ADVANCED_ADMIN_TOOLS]: "Advanced administration tools",
  [FEATURE_FLAGS.SSO_INTEGRATION]: "Single sign-on integration",
  [FEATURE_FLAGS.ADMIN_CONSOLE]: "Full admin console",
  [FEATURE_FLAGS.PERMISSION_BUILDER]: "Visual permission builder",
}
