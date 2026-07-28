import type {
  BookingStatus,
  EventTypeSummary,
  ScheduleCategory,
} from "./domain-types"

export type EventKind =
  | "one_on_one"
  | "group"
  | "collective"
  | "round_robin"

export type EventLocationType =
  | "google_meet"
  | "zoom"
  | "phone"
  | "in_person"
  | "custom"

export type QuestionType =
  | "text"
  | "textarea"
  | "select"
  | "checkbox"
  | "phone"

export interface EventQuestion {
  id: string
  label: string
  qtype: QuestionType
  options: string[] | null
  isRequired: boolean
  position: number
}

export interface EventType extends EventTypeSummary {
  ownerId: string
  description: string | null
  kind: EventKind
  locationType: EventLocationType
  locationDetails: string | null
  bufferBeforeMin: number
  bufferAfterMin: number
  minNoticeMin: number
  rollingDays: number
  slotIncrementMin: number
  capacity: number
  createdAt: string
  updatedAt: string
  questions?: EventQuestion[]
}

export interface AvailabilityRule {
  id?: string
  weekday: number
  startMin: number
  endMin: number
}

export interface AvailabilitySchedule {
  id: string
  name: string
  timezone: string
  isDefault: boolean
  rules: AvailabilityRule[]
}

export interface DateOverride {
  id: string
  /** Serialised from a DATE column, so always midnight UTC. */
  theDate: string
  isClosed: boolean
  startMin: number | null
  endMin: number | null
}

export interface AvailabilityResponse {
  schedule: AvailabilitySchedule
  rules: AvailabilityRule[]
  overrides: DateOverride[]
}

export interface BookingAnswer {
  id: string
  answer: string | null
  question: { id: string; label: string; qtype: QuestionType }
}

export interface Booking {
  id: string
  inviteeName: string
  inviteeEmail: string
  inviteeTimezone: string
  startsAt: string
  endsAt: string
  status: BookingStatus
  locationType: EventLocationType
  locationDetails: string | null
  meetingUrl: string | null
  notes: string | null
  cancelledAt: string | null
  cancelReason: string | null
  rescheduledAt: string | null
  createdAt: string
  eventType: { id: string; name: string; slug: string; color: string }
  answers: BookingAnswer[]
}

export type MeetingsTab = "upcoming" | "past" | "cancelled" | "all"

export const SCHEDULE_CATEGORIES: ScheduleCategory[] = [
  "meeting",
  "payment",
  "flight",
  "sports",
  "task",
]

export const LOCATION_LABELS: Record<EventLocationType, string> = {
  google_meet: "Google Meet",
  zoom: "Zoom",
  phone: "Phone",
  in_person: "In person",
  custom: "Custom",
}

export const QUESTION_LABELS: Record<QuestionType, string> = {
  text: "Short text",
  textarea: "Long text",
  select: "Dropdown",
  checkbox: "Checkbox",
  phone: "Phone",
}
