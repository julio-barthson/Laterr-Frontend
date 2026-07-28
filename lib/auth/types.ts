export type AppRole = "admin" | "member" | "executive_staff" | "owner"

export interface AuthenticatedUser {
  id: string
  email: string
  roles: AppRole[]
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
