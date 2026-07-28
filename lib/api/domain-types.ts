/**
 * Response shapes from the Laterr API.
 *
 * Hand-written rather than generated: the API is a separate project, so there
 * is no shared build step. Where a field maps to a database enum the union is
 * spelled out so a typo is a compile error rather than a silent mismatch.
 */

export type ScheduleCategory =
  | "meeting"
  | "payment"
  | "flight"
  | "sports"
  | "task"

export type ScheduleStatus = "upcoming" | "done" | "cancelled" | "rescheduled"

export type PersonaType =
  | "individual"
  | "creator"
  | "artist"
  | "family"
  | "enterprise"

export type PlanTier =
  | "trial"
  | "individual"
  | "family"
  | "business"
  | "enterprise"

export type SubStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"

export type BookingStatus =
  | "confirmed"
  | "cancelled"
  | "rescheduled"
  | "no_show"
  | "completed"

export interface Profile {
  id: string
  username: string | null
  displayName: string | null
  avatarUrl: string | null
  persona: PersonaType
  timezone: string | null
  phone: string | null
  createdAt: string
  updatedAt: string
}

export interface Schedule {
  id: string
  category: ScheduleCategory
  title: string
  description: string | null
  startsAt: string
  endsAt: string | null
  location: string | null
  meetingUrl: string | null
  provider: string | null
  /** Prisma serialises Decimal as a string to avoid float rounding. */
  amount: string | null
  currency: string | null
  recipient: string | null
  flightNo: string | null
  teamName: string | null
  status: ScheduleStatus
  confidential: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface ScheduleQuota {
  plan: PlanTier
  isTrial: boolean
  used: number
  /** null means unlimited. */
  limit: number | null
  remaining: number | null
}

export interface BookingRequest {
  id: string
  guestName: string
  guestEmail: string
  message: string | null
  preferredAt: string
  status: string
  createdAt: string
}

export interface EventTypeSummary {
  id: string
  name: string
  slug: string
  color: string
  durationMinutes: number
  isActive: boolean
  isHidden: boolean
}
