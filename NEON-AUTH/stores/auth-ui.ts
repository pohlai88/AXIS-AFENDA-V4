/**
 * @domain auth
 * @layer store
 * @responsibility Global auth UI state management (OAuth flows, verification, password reset)
 * 
 * Zustand store for auth multi-step flows that persist across page navigation.
 * Form validation state remains in react-hook-form (local to each page).
 */

import { create } from "zustand"

interface AuthUIState {
  // OAuth flow tracking
  oauthPending: string | null // 'google' | 'github' | null
  setOAuthPending: (provider: string | null) => void

  // Email verification flow
  verifyingEmail: string | null
  setVerifyingEmail: (email: string | null) => void

  // Password reset flow
  resetToken: string | null
  setResetToken: (token: string | null) => void

  // Reset all state (on logout or session change)
  reset: () => void
}

export const useAuthUIStore = create<AuthUIState>((set) => ({
  // OAuth flow
  oauthPending: null,
  setOAuthPending: (provider) => set({ oauthPending: provider }),

  // Email verification
  verifyingEmail: null,
  setVerifyingEmail: (email) => set({ verifyingEmail: email }),

  // Password reset
  resetToken: null,
  setResetToken: (token) => set({ resetToken: token }),

  // Reset all
  reset: () =>
    set({
      oauthPending: null,
      verifyingEmail: null,
      resetToken: null,
    }),
}))
