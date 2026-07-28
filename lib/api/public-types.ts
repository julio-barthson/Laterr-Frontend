import type { PersonaType } from "./domain-types"
import type {
  EventKind,
  EventLocationType,
  QuestionType,
} from "./schedule-types"

/** The six columns the API's public projection exposes. Never includes phone. */
export interface PublicHost {
  id: string
  username: string | null
  displayName: string | null
  avatarUrl: string | null
  persona: PersonaType
  timezone: string | null
}

export interface PublicEventType {
  id: string
  ownerId: string
  name: string
  slug: string
  description: string | null
  color: string
  durationMinutes: number
  kind: EventKind
  locationType: EventLocationType
  locationDetails: string | null
  bufferBeforeMin: number
  bufferAfterMin: number
  minNoticeMin: number
  rollingDays: number
  slotIncrementMin: number
  capacity: number
}

export interface PublicQuestion {
  id: string
  label: string
  qtype: QuestionType
  options: string[] | null
  isRequired: boolean
  position: number
}

export interface HostPageResponse {
  host: PublicHost
  eventTypes: PublicEventType[]
}

export interface EventTypePageResponse {
  host: PublicHost
  eventType: PublicEventType
  questions: PublicQuestion[]
}

export interface SlotsResponse {
  host: PublicHost
  eventType: PublicEventType
  /** The host's timezone. Slots themselves are UTC instants. */
  timezone: string
  slots: string[]
}

export interface CreatedBooking {
  id: string
  cancelToken: string
  startsAt: string
  endsAt: string
}

export interface TokenBooking {
  id: string
  status: string
  startsAt: string
  endsAt: string
  inviteeName: string
  inviteeEmail: string
  inviteeTimezone: string
  locationType: EventLocationType
  locationDetails: string | null
  meetingUrl: string | null
  notes: string | null
  cancelledAt: string | null
  cancelReason: string | null
  rescheduledAt: string | null
  eventType: {
    name: string
    slug: string
    durationMinutes: number
    description: string | null
  }
  host: {
    profile: {
      username: string | null
      displayName: string | null
      timezone: string | null
    } | null
  }
  addToCalendar: { google: string; outlook: string }
}
