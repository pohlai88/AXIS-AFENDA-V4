/**
 * @domain auth
 * @layer constants
 * @responsibility Centralized text constants for auth domain
 * 
 * All hardcoded strings should be imported from this file.
 * Never use string literals in components - always reference constants.
 */

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
  RESET_FAILED: "Password reset failed",
  RESET_LINK_FAILED: "Could not send reset link",
  RESEND_FAILED: "Could not resend verification code",
  CHECK_EMAIL: "Check your email",
  VERIFY_SUCCESS: "Email verified",
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
} as const