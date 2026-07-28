"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
  CalendarPlus,
  CheckCircle2,
  Clock,
  Inbox,
  Mic,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

import { AgendaColumn } from "./agenda-column"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api/client"
import type {
  BookingRequest,
  PersonaType,
  Profile,
  Schedule,
  ScheduleQuota,
} from "@/lib/api/domain-types"
import { cn } from "@/lib/utils"

const PERSONA_GREETING: Record<PersonaType, string> = {
  individual: "what's next?",
  creator: "let's ship something warm.",
  artist: "ready to make it happen?",
  family: "how's the family looking?",
  enterprise: "here's your command center.",
}

const DAY_MS = 24 * 60 * 60 * 1000

function startOfDay(date = new Date()) {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export function Dashboard() {
  const schedules = useQuery({
    queryKey: ["schedules"],
    queryFn: () => api.get<Schedule[]>("/schedules"),
  })

  const quota = useQuery({
    queryKey: ["schedule-quota"],
    queryFn: () => api.get<ScheduleQuota>("/subscriptions/quota"),
  })

  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get<Profile>("/profiles/me"),
  })

  const requests = useQuery({
    queryKey: ["booking-requests"],
    queryFn: () => api.get<BookingRequest[]>("/booking-requests"),
  })

  // Pinned once per mount rather than read during render. Calling Date.now() in
  // the render body is impure: the today/tomorrow buckets could shift on an
  // unrelated re-render and move an item between columns mid-session.
  const [nowMs] = React.useState(() => Date.now())

  if (schedules.isLoading || profile.isLoading) {
    return <DashboardSkeleton />
  }

  const rows = schedules.data ?? []
  const now = nowMs
  const today = startOfDay(new Date(nowMs))
  const tomorrow = new Date(today.getTime() + DAY_MS)
  const dayAfter = new Date(tomorrow.getTime() + DAY_MS)
  const inSevenDays = new Date(today.getTime() + 7 * DAY_MS)

  const upcoming = rows.filter(
    (row) =>
      new Date(row.startsAt).getTime() >= now && row.status === "upcoming"
  )

  const at = (row: Schedule) => new Date(row.startsAt)

  const todayItems = upcoming.filter((row) => at(row) < tomorrow)
  const tomorrowItems = upcoming.filter(
    (row) => at(row) >= tomorrow && at(row) < dayAfter
  )
  const laterThisWeek = upcoming.filter(
    (row) => at(row) >= dayAfter && at(row) < inSevenDays
  )

  const pendingPayments = upcoming.filter((row) => row.category === "payment")
  const pendingRequests = (requests.data ?? []).filter(
    (request) => request.status === "pending"
  )

  const doneThisWeek = rows.filter(
    (row) =>
      row.status === "done" &&
      new Date(row.updatedAt ?? row.startsAt).getTime() >
        today.getTime() - 7 * DAY_MS
  ).length

  const isTrial = quota.data?.isTrial ?? false
  const firstName = profile.data?.displayName?.split(" ")[0] ?? ""
  const greetingTail =
    PERSONA_GREETING[profile.data?.persona ?? "individual"] ?? "what's next?"

  return (
    <>
      <div className="grid gap-4 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-primary text-[11px] tracking-widest uppercase sm:text-xs">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="font-heading mt-2 text-3xl leading-tight sm:text-4xl md:text-5xl">
            Hi{firstName ? ` ${firstName}` : ""},{" "}
            <span className="text-primary italic">{greetingTail}</span>
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="lg" className="rounded-full">
            <Link href="/chat">
              <Sparkles className="mr-2 h-4 w-4" /> Ask Laterr AI
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full">
            <Link href="/chat?q=Voice+capture+a+new+schedule">
              <Mic className="mr-2 h-4 w-4" /> Voice capture
            </Link>
          </Button>
        </div>
      </div>

      {isTrial && (
        <Card className="border-primary/30 bg-primary/5 mt-6">
          <CardContent className="grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-heading text-lg">You&apos;re on the free trial</p>
              <p className="text-muted-foreground text-sm">
                {quota.data
                  ? `${quota.data.used} of ${quota.data.limit} schedules used.`
                  : "1 free schedule to try everything."}{" "}
                Upgrade any time — cancel any time.
              </p>
            </div>
            <Button asChild className="rounded-full">
              <Link href="/pricing">See plans</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <section className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 md:grid-cols-4">
        <StatCard icon={Clock} label="Upcoming" value={upcoming.length} />
        <StatCard
          icon={CalendarPlus}
          label="Today"
          value={todayItems.length}
        />
        <StatCard
          icon={Inbox}
          label="Booking requests"
          value={pendingRequests.length}
          href="/inbox"
        />
        <StatCard
          icon={CheckCircle2}
          label="Done this week"
          value={doneThisWeek}
        />
      </section>

      <section className="mt-6 grid gap-6 sm:mt-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-heading truncate text-xl sm:text-2xl">
                  Your agenda
                </h2>
                <Link
                  href="/schedules"
                  className="text-muted-foreground hover:text-foreground shrink-0 text-sm"
                >
                  View all
                </Link>
              </div>

              <AgendaColumn
                title="Today"
                items={todayItems}
                emptyLabel="Nothing today. Enjoy the quiet."
              />
              <AgendaColumn
                title="Tomorrow"
                items={tomorrowItems}
                emptyLabel="Tomorrow is clear."
              />
              <AgendaColumn
                title="Later this week"
                items={laterThisWeek}
                emptyLabel="Nothing else this week."
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4">
              <h2 className="font-heading text-xl">Payments coming up</h2>
              {pendingPayments.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No payments scheduled.
                </p>
              ) : (
                <ul className="divide-border/60 divide-y">
                  {pendingPayments.map((payment) => (
                    <li
                      key={payment.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {payment.title}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {payment.recipient ?? "—"} ·{" "}
                          {new Date(payment.startsAt).toLocaleString()}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-medium">
                        {formatMoney(payment.amount, payment.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardContent className="space-y-4">
            <h2 className="font-heading text-2xl">New booking requests</h2>
            {pendingRequests.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No pending requests.
              </p>
            ) : (
              <ul className="space-y-3">
                {pendingRequests.slice(0, 5).map((request) => (
                  <li key={request.id} className="border-border rounded-xl border p-3">
                    <p className="truncate text-sm font-medium">
                      {request.guestName}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {request.guestEmail}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Prefers {new Date(request.preferredAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="outline" className="w-full">
              <Link href="/inbox">Open inbox</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon
  label: string
  value: number
  href?: string
}) {
  const inner = (
    <Card className={cn(href && "transition-colors hover:border-primary/40")}>
      <CardContent className="flex items-center gap-3">
        <span className="bg-primary/10 text-primary grid h-10 w-10 shrink-0 place-items-center rounded-xl">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="font-heading text-2xl leading-none">{value}</p>
          <p className="text-muted-foreground truncate text-xs">{label}</p>
        </div>
      </CardContent>
    </Card>
  )

  return href ? <Link href={href}>{inner}</Link> : inner
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-12 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}

/**
 * `amount` arrives as a string — Prisma serialises Decimal that way rather than
 * as a float, so parsing here is deliberate and lossless up to the column's
 * two decimal places.
 */
function formatMoney(amount: string | null, currency: string | null) {
  if (!amount) return "—"

  const value = Number(amount)
  if (Number.isNaN(value)) return "—"

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
    }).format(value)
  } catch {
    // An unknown currency code would throw; fall back rather than blank the row.
    return `${currency ?? ""} ${value.toFixed(2)}`.trim()
  }
}
