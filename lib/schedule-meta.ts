import {
  CalendarHeart,
  CircleCheck,
  Plane,
  Trophy,
  Wallet,
  type LucideIcon,
} from "lucide-react"

import type { ScheduleCategory, ScheduleStatus } from "@/lib/api/domain-types"

/**
 * One place for how a schedule category looks.
 *
 * This was copied into the dashboard agenda and the schedules list, and a third
 * consumer (the detail page) made the duplication worth removing — the two
 * copies had already started to drift on tint.
 */
export interface CategoryMeta {
  label: string
  icon: LucideIcon
  /** Background + foreground for the category chip. */
  tint: string
}

export const CATEGORY_META: Record<ScheduleCategory, CategoryMeta> = {
  meeting: {
    label: "Meeting",
    icon: CalendarHeart,
    tint: "bg-primary/10 text-primary",
  },
  payment: {
    label: "Payment",
    icon: Wallet,
    tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  flight: {
    label: "Flight",
    icon: Plane,
    tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  sports: {
    label: "Sports",
    icon: Trophy,
    tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  task: {
    label: "Task",
    icon: CircleCheck,
    tint: "bg-muted text-muted-foreground",
  },
}

export const STATUS_TINT: Record<ScheduleStatus, string> = {
  upcoming: "bg-primary/10 text-primary border-primary/30",
  done: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
  cancelled: "",
  rescheduled:
    "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400",
}

/** Money as the user entered it, falling back to a bare number on a bad code. */
export function formatMoney(amount: number, currency: string | null): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency ?? "USD",
    }).format(amount)
  } catch {
    // Intl throws on an unrecognised currency code, and the column is free text.
    return `${amount} ${currency ?? ""}`.trim()
  }
}

/** A human "when", e.g. "Tue 4 Aug, 14:30". */
export function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}
