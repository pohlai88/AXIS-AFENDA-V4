/**
 * @domain auth
 * @layer constants
 * @responsibility Centralized text constants for auth domain
 * 
 * All hardcoded strings should be imported from this file.
 * Never use string literals in components - always reference constants.
 */

/**
 * Brand (auth shell typography)
 */
export const AUTH_BRAND = {
  NAME: "AFENDA",
  SLOGAN: "MACHINA VITAE",
} as const

/**
 * Button labels
 */
export const AUTH_BUTTON_LABELS = {
  SIGN_IN: "Sign in",
  SIGN_UP: "Sign up",
  SIGN_OUT: "Sign out",
  FORGOT_PASSWORD: "Forgot password?",
  SEND_RESET_LINK: "Send reset link",
  RESET_PASSWORD: "Reset password",
  VERIFY_EMAIL: "Verify email",
  RESEND_CODE: "Resend code",
  BACK_TO_APP: "← Back to App",
  BACK_TO_LOGIN: "← Back to login",
  SIGN_IN_WITH_GOOGLE: "Sign in with Google",
  SIGN_IN_WITH_GITHUB: "Sign in with GitHub",
  SIGN_UP_WITH_GOOGLE: "Sign up with Google",
  SIGN_UP_WITH_GITHUB: "Sign up with GitHub",
  CONTINUE: "Continue",
  NEXT: "Next",
} as const

/**
 * Form labels
 */
export const AUTH_FORM_LABELS = {
  EMAIL: "Email",
  PASSWORD: "Password",
  CONFIRM_PASSWORD: "Confirm password",
  NAME: "Full name",
  VERIFICATION_CODE: "Verification code",
  REMEMBER_ME: "Remember me",
} as const

/**
 * Error messages
 */
export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Invalid email or password. Please try again.",
  EMAIL_ALREADY_EXISTS: "This email is already registered. Try signing in instead.",
  PASSWORDS_DONT_MATCH: "Passwords don't match. Please try again.",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters.",
  PASSWORD_WEAK: "Password must contain uppercase, lowercase, and numbers.",
  EMAIL_REQUIRED: "Email is required",
  PASSWORD_REQUIRED: "Password is required",
  NAME_REQUIRED: "Name is required",
  VERIFICATION_CODE_INVALID: "Invalid verification code. Please try again.",
  VERIFICATION_CODE_EXPIRED: "Verification code expired. Request a new one.",
  EMAIL_NOT_VERIFIED: "Please verify your email to continue.",
  ACCOUNT_DISABLED: "This account has been disabled.",
  TOO_MANY_ATTEMPTS: "Too many login attempts. Please try again later.",
  CAPTCHA_REQUIRED: "Please complete the CAPTCHA verification.",
  CAPTCHA_FAILED: "CAPTCHA verification failed. Please try again.",
  OAUTH_FAILED: "Social login failed. Please try again.",
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
} as const

// Alias for convenience
export const AUTH_ERRORS = AUTH_ERROR_MESSAGES

/**
 * Success messages
 */
export const AUTH_SUCCESS_MESSAGES = {
  SIGN_IN_SUCCESS: "Sign in successful! Redirecting...",
  SIGN_UP_SUCCESS: "Account created successfully!",
  CHECK_EMAIL_FOR_VERIFICATION: "Check your email for verification link.",
  VERIFICATION_CODE_SENT: "Verification code sent to your email.",
  RESET_LINK_SENT: "Password reset link sent to your email.",
  PASSWORD_RESET_SUCCESS: "Password reset successfully! You can now sign in.",
  EMAIL_VERIFIED: "Email verified successfully!",
} as const

/**
 * Page titles
 */
export const AUTH_PAGE_TITLES = {
  SIGN_IN: "Sign in to your account",
  SIGN_UP: "Create your account",
  FORGOT_PASSWORD: "Reset your password",
  VERIFY_EMAIL: "Verify your email",
  RESET_PASSWORD: "Set new password",
  ACCOUNT_SETTINGS: "Account Settings",
  ACCOUNT_SECURITY: "Security",
  ACCOUNT_ORGANIZATIONS: "Organizations",
} as const

/**
 * Page descriptions
 */
export const AUTH_PAGE_DESCRIPTIONS = {
  SIGN_IN: "Enter your credentials to sign in",
  SIGN_UP: "Create a new account to get started",
  FORGOT_PASSWORD: "We'll send you a link to reset your password",
  VERIFY_EMAIL: "Enter the code sent to your email",
  RESET_PASSWORD: "Enter your new password",
  SIGN_IN_ALT: "Don't have an account? Sign up",
  SIGN_UP_ALT: "Already have an account? Sign in",
} as const

/**
 * Alert titles
 */
export const AUTH_ALERT_TITLES = {
  SIGN_IN_FAILED: "Sign in failed",
  SIGN_UP_FAILED: "Sign up failed",
  EMAIL_VERIFICATION_FAILED: "Email verification failed",
  VERIFICATION_REQUIRED: "Verification required",
  RESET_FAILED: "Could not reset password",
  RESET_LINK_FAILED: "Could not send reset link",
  RESEND_FAILED: "Could not resend verification code",
  COULD_NOT_SEND_EMAIL: "Could not send email",
  CHECK_EMAIL: "Check your email",
  EMAIL_SENT: "Email sent",
  VERIFY_SUCCESS: "Email verified",
  INVALID_RESET_LINK: "Invalid reset link",
  PASSWORD_UPDATED: "Password updated",
} as const

/**
 * Loading states
 */
export const AUTH_LOADING_STATES = {
  SIGNING_IN: "Signing in...",
  SIGNING_UP: "Creating account...",
  VERIFYING: "Verifying...",
  RESETTING: "Resetting password...",
  SENDING: "Sending...",
  CHECKING: "Checking session...",
} as const

/**
 * Link text
 */
export const AUTH_LINK_TEXT = {
  SIGN_IN_LINK: "Sign in",
  SIGN_UP_LINK: "Sign up",
  FORGOT_PASSWORD_LINK: "Forgot password?",
  TERMS_LINK: "Terms of service",
  PRIVACY_LINK: "Privacy policy",
  BACK_TO_APP_LINK: "Back to app",
} as const

/**
 * OAuth provider names
 */
export const OAUTH_PROVIDERS = {
  GOOGLE: "google",
  GITHUB: "github",
} as const

/**
 * Validation rules
 */
export const AUTH_VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  VERIFICATION_CODE_LENGTH: 6,
  MAX_LOGIN_ATTEMPTS: 5,
  RESET_TOKEN_EXPIRY_MINUTES: 30,
  VERIFICATION_CODE_EXPIRY_MINUTES: 15,
} as const
/**
 * Unified labels for all auth pages
 * Use this for dynamic text in components
 */
export const AUTH_LABELS = {
  // Button text
  SIGN_IN: "Sign in",
  SIGN_UP: "Sign up",
  SIGN_OUT: "Sign out",
  SIGN_UP_SUBMIT: "Create account",
  CREATE_ACCOUNT: "Create account",
  SIGNING_IN: "Signing in...",
  SIGNING_UP: "Creating account...",
  FORGOT_PASSWORD: "Forgot password?",
  SEND_RESET_LINK: "Send reset link",
  RESET_PASSWORD: "Reset password",
  VERIFY_EMAIL: "Verify email",
  RESEND_CODE: "Resend code",
  BACK_TO_APP: "← Back to App",
  BACK_TO_LOGIN: "← Back to login",
  SIGN_IN_WITH_GOOGLE: "Sign in with Google",
  SIGN_IN_WITH_GITHUB: "Sign in with GitHub",
  SIGN_UP_WITH_GOOGLE: "Sign up with Google",
  SIGN_UP_WITH_GITHUB: "Sign up with GitHub",
  CONTINUE: "Continue",
  NEXT: "Next",

  // Form labels
  EMAIL: "Email",
  PASSWORD: "Password",
  CONFIRM_PASSWORD: "Confirm password",
  NAME: "Full name",
  VERIFICATION_CODE: "Verification code",
  REMEMBER_ME: "Remember me",

  // Text
  OR_CONTINUE_WITH_EMAIL: "Or continue with email",
  OR_CONTINUE_WITH: "Or continue with",
  DONT_HAVE_ACCOUNT: "Don't have an account?",
  ALREADY_HAVE_ACCOUNT: "Already have an account?",
  CHECKING_SESSION: "Checking session...",

  // Page text
  CHECK_EMAIL_FOR_VERIFICATION: "Check your email for verification link.",
  VERIFICATION_CODE_SENT: "Verification code sent to your email.",
  RESET_LINK_SENT: "Password reset link sent to your email.",

  // Forgot / reset password
  FORGOT_PASSWORD_TITLE: "Reset password",
  FORGOT_PASSWORD_DESCRIPTION: "We will email you a secure reset link.",
  ACCOUNT_EXISTS_RESET_SENT: "If an account exists for",
  ACCOUNT_EXISTS_RESET_SENT_END: " we sent a password reset link.",
  REMEMBER_PASSWORD: "Remember your password?",
  SENDING: "Sending…",
  RESET_LINK_INVALID_TITLE: "Reset link invalid",
  RESET_LINK_INVALID_DESCRIPTION: "Request a new reset link to continue.",
  INVALID_RESET_LINK: "Invalid reset link",
  REDIRECTING_TO_RECOVERY: "Redirecting to password recovery…",
  CREATE_NEW_PASSWORD: "Create a new password",
  CHOOSE_STRONG_PASSWORD: "Choose a strong password for your account.",
  PASSWORD_UPDATED: "Password updated",
  REDIRECTING_TO_SIGN_IN: "Redirecting you to sign in…",
  UPDATING_PASSWORD: "Updating password…",
  NEW_PASSWORD: "New password",
  PASSWORD_MIN_HINT: "Must be at least 8 characters long",
  PASSWORD_CONSTRAINT_HINT: "At least 8 characters, with uppercase, lowercase, and numbers",
  PASSWORD_SHOW: "Show password",
  PASSWORD_HIDE: "Hide password",
  RESETTING: "Resetting…",
  RESET_TOKEN_MISSING: "Invalid or missing reset token. Please request a new password reset.",
  REQUEST_NEW_LINK: "Request new link",
  INVALID_PASSWORD: "Invalid password",

  // Verify email
  VERIFY_EMAIL_DESCRIPTION: "Check your inbox for a verification email.",
  VERIFICATION_REQUIRED: "Verification required",
  OPEN_VERIFICATION_EMAIL: "Open the email we sent and click the verification link to continue.",
  EMAIL_SENT: "Email sent",
  CHECK_INBOX: "Please check your inbox.",
  RESEND_VERIFICATION_EMAIL: "Resend verification email",
  GO_TO_SIGN_IN: "Go to sign in",
  VERIFICATION_EMAIL_SENT: "Verification email sent. Please check your inbox.",
  VERIFICATION_EMAIL_FAILED: "Failed to send verification email.",
  TRY_AGAIN_MOMENT: "Please try again in a moment.",

  // Callback
  FINISHING_SIGN_IN: "Finishing sign-in",
  CALLBACK_FAILED_DESCRIPTION: "We couldn't confirm your session. This is usually caused by blocked cookies, a suspended Neon compute, or a mismatched OAuth redirect URL.",
  TRY_THIS: "Try this:",
  GO_BACK_SIGN_IN: "Go back to sign in and try again",
  COOKIES_TIP: "Ensure third-party cookies aren't blocked (Safari/strict modes)",
  REDIRECT_URL_TIP: "Confirm your provider redirect URLs match your app domain",
  BACK_TO_SIGN_IN: "Back to Sign In",
  GO_TO_HOME: "Go to Home",
  FINALIZING_SESSION: "Finalizing your session…",
  CONTINUE_LINK: "continue",
  REDIRECTING: "Redirecting…",

  // Account
  ACCOUNT_SETTINGS_DESCRIPTION: "Manage your profile and preferences.",
  ACCOUNT_SECURITY_DESCRIPTION: "Password and active sessions.",
  ACCOUNT_ORGANIZATIONS_DESCRIPTION: "Manage your organizations and teams.",
  MANAGE_SESSIONS: "Manage sessions",
  VIEW_ORGANIZATIONS: "View organizations",

  // Register verification screen
  VERIFY_YOUR_EMAIL: "Verify your email",
  SENT_VERIFICATION_LINK: "We've sent a verification link to your inbox.",
  NEXT_STEPS: "Next steps:",
  OPEN_EMAIL_INBOX: "Open your email inbox",
  CLICK_VERIFICATION_LINK: "Click the verification link",
  RETURN_TO_SIGN_IN: "Return to sign in",
  TIP_SPAM_FOLDER: "Check your spam folder if you don't see the email within a few minutes.",
  TIP_LABEL: "Tip:",

  // Sign-out page
  SIGN_OUT_PAGE_TITLE: "Sign out",
  SIGN_OUT_PAGE_DESCRIPTION: "Review your session summary before signing out.",
  SESSION_SUMMARY: "Session summary",
  SESSION_SUMMARY_DESCRIPTION: "Current device session details",
  SESSION_DURATION: "Session duration",
  ACTIVE_SESSIONS: "Active sessions",
  ACTIVE_SESSIONS_SINGULAR: "You have 1 active session. Signing out will end this session only.",
  ACTIVE_SESSIONS_PLURAL: "You have {count} active sessions. Signing out will end this session only.",
  THIS_IS_YOUR_ONLY_SESSION: "This is your only session.",
  SIGNING_OUT_FROM: "Signing out from this device",
  SESSION_DEVICE: "Device",
  LAST_ACTIVITY: "Last activity",
  AUDIT_NOTICE: "This sign-out will be recorded in your account activity.",
  AUDIT_SECTION_TITLE: "Account activity",
  STAY_SIGNED_IN: "Stay signed in",
  SIGNING_OUT: "Signing out…",
  SESSION_INFO_UNAVAILABLE: "Session info unavailable. You can still sign out.",
  SESSION_INFO_UNAVAILABLE_DESCRIPTION: "We couldn't load session details. You may sign out or stay signed in.",
  JUST_NOW: "Just now",
  CLEAR_CACHE: "Clear cache",
  CACHE_CLEARED: "Cache cleared",
  EXPORT_SUMMARY_JSON: "Export (JSON)",
  EXPORT_SUMMARY_MARKDOWN: "Export (Markdown)",
  EXPORTED: "Exported",
  ACTION_SUCCESS: "Success",
  ACTION_FAIL: "Failed",
  COPY: "Copy",
  COPIED: "Copied",
  COPY_FAILED: "Copy failed",
  COPY_SECTION: "Copy section",
  SHARE_TO: "Share to",
  SHARE_TO_TEAM_MEMBERS: "Team members",
  SHARE_TO_TEAMS_SAME_TEAM: "Same team",
  SHARE_TO_SAME_ORGANIZATION: "Same organization",
  SAVE_TO_PERSONAL_DB: "Save to personal DB",
  SAVE_TO_PERSONAL_DB_DESCRIPTION: "Save this session summary to your personal database",
  EXPORT_AND_UTILITIES_DESCRIPTION: "Export, share, or save this session summary.",
  // Sign-out empty / loading states
  SESSION_LOADING_LABEL: "Loading session…",
  SESSION_NO_CURRENT_DATA: "No session data for this device",
  SESSION_EMPTY_DESCRIPTION: "Session details will appear here when available",
  ACTIVE_SESSIONS_EMPTY_TITLE: "No other sessions",
  ACTIVE_SESSIONS_EMPTY_DESCRIPTION: "Active sessions will be listed here",
  SIGN_OUT_ACTIONS: "Actions",
  EXPORT_AND_UTILITIES: "Export & utilities",
  // Export file content (for markdown/JSON generation)
  SIGN_OUT_SUMMARY_EXPORT_HEADING: "Sign-out summary",
  EXPORT_SECTION_SESSION: "Session",
  EXPORT_SECTION_ACCOUNT: "Account",
  EXPORT_FOOTER_AUDIT: "This sign-out will be recorded in your account activity.",
  EXPORT_NO_CURRENT_SESSION: "No current session data",

  // Session summary dashboard (sign-out page, no sidebar)
  DASHBOARD_PAGE_TITLE: "Session summary",
  DASHBOARD_PAGE_DESCRIPTION: "Summary of this session and activity before you sign out.",
  SESSION_OVERVIEW: "Session overview",
  STAT_SESSION_DURATION: "Session duration",
  STAT_ACTIVE_SESSIONS: "Active sessions",
  STAT_LAST_ACTIVITY: "Last activity",
  STAT_DEVICE: "Device",
  ACTIVITY_TRAIL: "Activity trail",
  ACTIVITY_TRAIL_DESCRIPTION: "Recent activity in this session",
  ACTIVITY_TRAIL_EMPTY_TITLE: "No activity recorded",
  ACTIVITY_TRAIL_EMPTY_DESCRIPTION: "Activity for this session will appear here",
  ACTIVITY_LOAD_ERROR: "Could not load activity",
  SUMMARY_WHATS_DONE: "What's been done",
  SUMMARY_WHATS_DONE_DESCRIPTION: "Approvals, requests, todo, and completed items this session",
  APPROVALS: "Approvals",
  APPROVALS_EMPTY_TITLE: "No approvals",
  APPROVALS_EMPTY_DESCRIPTION: "Pending approvals will appear here",
  REQUESTS: "Requests",
  REQUESTS_EMPTY_TITLE: "No requests",
  REQUESTS_EMPTY_DESCRIPTION: "Your requests will appear here",
  TODO: "Todo",
  TODO_EMPTY_TITLE: "No todo items",
  TODO_EMPTY_DESCRIPTION: "Todo items for this session will appear here",
  DONE: "Done",
  DONE_EMPTY_TITLE: "No completed items",
  DONE_EMPTY_DESCRIPTION: "Completed items will appear here",

  // Placeholders
  EMAIL_PLACEHOLDER: "your@email.com",
  EMAIL_PLACEHOLDER_ALT: "you@company.com",
  PASSWORD_PLACEHOLDER: "••••••••",
  NAME_PLACEHOLDER: "John Doe",
} as const