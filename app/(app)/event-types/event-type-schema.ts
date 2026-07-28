import { z } from "zod"

/**
 * Numeric field helper.
 *
 * Not `z.coerce.number()`: that types its *input* as `unknown`, which does not
 * match what useForm expects and produces an unassignable resolver. The inputs
 * are registered with `valueAsNumber` instead, so the value really is a number
 * by the time it reaches Zod — and an empty box arrives as NaN, hence the
 * explicit message.
 *
 * `error` is Zod 4 syntax; it replaced `invalid_type_error`/`required_error`.
 */
const num = () =>
  z.number({ error: "Enter a number" }).int("Whole numbers only")

/**
 * Mirrors the API's CreateEventTypeDto bounds exactly.
 *
 * These are deliberately the same numbers as the server's, which in turn are
 * tighter than the database CHECK constraints in several places (duration
 * floors at 5 not 1, buffers cap at 240). Duplicating them buys inline
 * validation without a round trip; the server stays the authority.
 */
export const questionSchema = z.object({
  label: z.string().trim().min(1, "Give the question a label").max(200),
  qtype: z.enum(["text", "textarea", "select", "checkbox", "phone"]),
  /** Comma-separated in the form; split on submit. Only used by `select`. */
  optionsRaw: z.string().max(1000).optional(),
  isRequired: z.boolean(),
})

export const eventTypeSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9-]{2,60}$/,
      "2–60 characters: lowercase letters, numbers and dashes"
    ),
  description: z.string().max(2000).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a colour"),
  durationMinutes: num().min(5, "At least 5 minutes").max(1440),
  kind: z.enum(["one_on_one", "group", "collective", "round_robin"]),
  locationType: z.enum(["google_meet", "zoom", "phone", "in_person", "custom"]),
  locationDetails: z.string().max(500).optional(),
  bufferBeforeMin: num().min(0).max(240),
  bufferAfterMin: num().min(0).max(240),
  minNoticeMin: num().min(0).max(10080),
  rollingDays: num().min(1, "At least 1 day").max(365),
  slotIncrementMin: num().min(5, "At least 5 minutes").max(120),
  capacity: num().min(1).max(100),
  isActive: z.boolean(),
  isHidden: z.boolean(),
  questions: z.array(questionSchema).max(50),
})

export type EventTypeFormValues = z.infer<typeof eventTypeSchema>

export const EVENT_TYPE_DEFAULTS: EventTypeFormValues = {
  name: "",
  slug: "",
  description: "",
  color: "#008fdb",
  durationMinutes: 30,
  kind: "one_on_one",
  locationType: "google_meet",
  locationDetails: "",
  bufferBeforeMin: 0,
  bufferAfterMin: 0,
  minNoticeMin: 60,
  rollingDays: 60,
  slotIncrementMin: 15,
  capacity: 1,
  isActive: true,
  isHidden: false,
  questions: [],
}

/** Derive a URL-safe slug from a name as the user types. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}
