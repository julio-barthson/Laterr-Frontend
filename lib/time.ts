/** Minutes-from-midnight helpers, matching how availability is stored. */

export const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const

/** 540 -> "09:00". Pads so the value is valid for <input type="time">. */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`
}

/** "09:00" -> 540. Returns null for anything unparseable. */
export function timeToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])

  if (hours > 24 || minutes > 59) return null

  const total = hours * 60 + minutes

  return total <= 1440 ? total : null
}

/** 90 -> "1h 30m". Used for durations, not clock times. */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60

  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}

/**
 * A DATE column arrives as midnight UTC, so it must be read back in UTC. Using
 * the local getters would shift the day for anyone west of UTC.
 */
export function isoDateOnly(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-")
}

/** Long-form date for display, rendered in UTC to match isoDateOnly. */
export function formatDateOnly(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
}

/** The browser's IANA zone, or UTC if it cannot be determined. */
export function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  } catch {
    return "UTC"
  }
}

/**
 * Timezones for the picker. `Intl.supportedValuesOf` is the real list; older
 * runtimes get a short fallback rather than an empty select.
 */
export function timezoneOptions(): string[] {
  try {
    const supported = Intl.supportedValuesOf?.("timeZone")
    if (supported && supported.length > 0) return [...supported]
  } catch {
    // fall through
  }

  return [
    "UTC",
    "Europe/London",
    "Europe/Berlin",
    "Africa/Lagos",
    "America/New_York",
    "America/Chicago",
    "America/Los_Angeles",
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Tokyo",
    "Australia/Sydney",
  ]
}
