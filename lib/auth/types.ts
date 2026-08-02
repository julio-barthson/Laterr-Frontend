export type AppRole = "admin" | "member" | "executive_staff" | "owner"

export interface AuthenticatedUser {
  id: string
  email: string
  roles: AppRole[]
  /**
   * Only present on /auth/me, which reads it fresh from the database. The
   * login and register responses omit both of these — they are shaped from
   * the token, which cannot carry a value that changes mid-session.
   */
  emailVerified?: boolean
  /** False for a Google-only account that has never set a password. */
  hasPassword?: boolean
}

export interface SessionResponse {
  user: AuthenticatedUser
}

export interface PlatformSettings {
  maintenanceMode: boolean
  maintenanceMessage: string | null
  broadcastActive: boolean
  broadcastTitle: string | null
  broadcastBody: string | null
  broadcastVariant: string
}
