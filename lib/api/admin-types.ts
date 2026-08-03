/**
 * Response shapes for the teams, roles, admin and owner surfaces.
 *
 * Split out from domain-types so the scheduling types stay readable — these are
 * only ever imported by the four administrative route trees.
 */

import type { AppRole } from "@/lib/auth/types"
import type { PlanTier, SubStatus } from "@/lib/api/domain-types"

// ---------------------------------------------------------------- plan gate

/** Shared by /workspaces/access and /roles/access. */
export interface PlanAccess {
  allowed: boolean
  plan: PlanTier
  status: SubStatus | "inactive"
  /** True when access comes from a platform role rather than the plan. */
  bypass: boolean
}

// ----------------------------------------------------------------- teams

export type WorkspaceKind = "family" | "enterprise"
export type WorkspaceRole = "owner" | "admin" | "member"
export type InviteStatus = "pending" | "accepted" | "revoked" | "expired"

export interface WorkspaceSummary {
  id: string
  name: string
  kind: WorkspaceKind
  ownerId: string
  createdAt: string
  memberCount: number
  myRole: WorkspaceRole
  isOwner: boolean
}

export interface WorkspaceMember {
  id: string
  userId: string
  role: WorkspaceRole
  createdAt: string
  email: string
  displayName: string | null
  username: string | null
  avatarUrl: string | null
  /** True for the row matching the workspace's `ownerId` — not merely role owner. */
  isWorkspaceOwner: boolean
}

export interface WorkspaceInvite {
  id: string
  invitedEmail: string
  role: WorkspaceRole
  status: InviteStatus
  /** Only returned to workspace owners and admins. */
  code: string
  createdAt: string
  expiresAt: string
  acceptedAt: string | null
}

export interface WorkspaceDetail {
  id: string
  name: string
  kind: WorkspaceKind
  ownerId: string
  createdAt: string
  members: WorkspaceMember[]
  /** Empty for plain members — the code is a credential. */
  invites: WorkspaceInvite[]
  myRole: WorkspaceRole
  isOwner: boolean
}

export interface MyInvite {
  id: string
  role: WorkspaceRole
  code: string
  createdAt: string
  expiresAt: string
  workspace: { id: string; name: string; kind: WorkspaceKind }
}

// ------------------------------------------------------------ role requests

export type RoleRequestStatus =
  | "pending"
  | "approved"
  | "denied"
  | "cancelled"

/** The roles a user may ask for — platform ownership is not requestable. */
export type RequestableRole = "admin" | "member" | "executive_staff"

export interface MyRole {
  role: AppRole
  createdAt: string
}

export interface RoleRequest {
  id: string
  requestedRole: AppRole
  reason: string | null
  status: RoleRequestStatus
  decisionNote: string | null
  decidedAt: string | null
  createdAt: string
}

export interface AdminRoleRequest extends RoleRequest {
  userId: string
  email: string
  displayName: string | null
  username: string | null
}

// ----------------------------------------------------------------- admin

export interface AdminStats {
  users: number
  schedules: number
  followups: number
  /** Confirmed bookings. Distinct from bookingRequests — see below. */
  bookings: number
  /**
   * "Request a time" inbox submissions. Previously reported *as* `bookings`,
   * which made the dashboard show zero on instances that had real bookings.
   */
  bookingRequests: number
  pendingRoleRequests: number
  workspaces: number
  newUsers7d: number
  newSchedules7d: number
}

export interface AdminUser {
  id: string
  displayName: string | null
  username: string | null
  avatarUrl: string | null
  persona: string | null
  createdAt: string
  email: string
  roles: AppRole[]
  subscription: {
    plan: PlanTier
    status: SubStatus
    seats: number
  } | null
}

export interface AdminSchedule {
  id: string
  title: string
  category: string
  status: string
  startsAt: string | null
  userId: string
  createdAt: string
}

// ----------------------------------------------------------------- owner

export interface OwnerOverview {
  totals: {
    users: number
    schedules: number
    bookings: number
    workspaces: number
  }
  growth: {
    new24h: number
    new7d: number
    new30d: number
    schedules7d: number
  }
  revenue: {
    mrrUsd: number
    arrUsd: number
    planCounts: Partial<Record<PlanTier, number>>
    statusCounts: Partial<Record<SubStatus, number>>
    paying: number
  }
  /** YYYY-MM-DD → signups. Sparse: days with none are absent. */
  signupsByDay: Record<string, number>
}

export type BannerVariant = "info" | "success" | "warn" | "danger"

export interface FeatureFlag {
  key: string
  enabled: boolean
  description: string | null
  updatedAt: string
  updatedById: string | null
}

export interface Announcement {
  id: string
  title: string
  body: string
  variant: string
  active: boolean
  startsAt: string
  endsAt: string | null
  createdById: string | null
  createdAt: string
}

/** The subset /platform/announcements returns to ordinary users. */
export interface VisibleAnnouncement {
  id: string
  title: string
  body: string
  variant: string
  createdAt: string
}

/** Who an audit entry refers to. Null when the account has since been deleted. */
export interface AuditParty {
  id: string
  email: string
  displayName: string | null
  username: string | null
}

export interface AuditEntry {
  id: string
  actorId: string
  action: string
  targetUserId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  /** Resolved identities. The bare ids above are unreadable on their own. */
  actor: AuditParty | null
  target: AuditParty | null
}

export interface OwnerWorkspace {
  id: string
  name: string
  kind: WorkspaceKind
  ownerId: string
  createdAt: string
  _count: { members: number }
}
