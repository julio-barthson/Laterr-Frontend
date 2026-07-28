"use client"

import Link from "next/link"
import { ArrowRight, Clock, MapPin } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { LOCATION_LABELS } from "@/lib/api/schedule-types"
import { usePublicHost } from "@/lib/hooks/use-public-booking"
import { formatDuration } from "@/lib/time"

export function HostPage({ username }: { username: string }) {
  const { data, isLoading, isError } = usePublicHost(username)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="py-10 text-center">
          <h1 className="font-heading text-xl">No such page</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            We couldn&apos;t find anyone at @{username}.
          </p>
        </CardContent>
      </Card>
    )
  }

  const { host, eventTypes } = data

  return (
    <div className="mx-auto max-w-2xl">
      <header className="flex items-center gap-4">
        <Avatar className="h-14 w-14">
          {host.avatarUrl && <AvatarImage src={host.avatarUrl} alt="" />}
          <AvatarFallback>
            {(host.displayName ?? host.username ?? "?")
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase() ?? "")
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="font-heading truncate text-2xl sm:text-3xl">
            {host.displayName ?? `@${host.username}`}
          </h1>
          <p className="text-muted-foreground text-sm">@{host.username}</p>
        </div>
      </header>

      {eventTypes.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="py-10 text-center">
            <p className="font-heading text-lg">Nothing bookable right now</p>
            <p className="text-muted-foreground mt-1 text-sm">
              This host hasn&apos;t published any event types yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="mt-6 space-y-3">
          {eventTypes.map((eventType) => (
            <li key={eventType.id}>
              <Link
                href={`/book/${host.username}/${eventType.slug}`}
                className="block"
              >
                <Card className="hover:border-primary/40 transition-colors">
                  <CardContent className="flex items-center gap-4">
                    <span
                      aria-hidden
                      className="h-10 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: eventType.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-heading truncate text-lg">
                        {eventType.name}
                      </p>
                      {eventType.description && (
                        <p className="text-muted-foreground mt-0.5 line-clamp-2 text-sm">
                          {eventType.description}
                        </p>
                      )}
                      <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-3 text-xs">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDuration(eventType.durationMinutes)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {LOCATION_LABELS[eventType.locationType]}
                        </span>
                      </p>
                    </div>
                    <ArrowRight className="text-muted-foreground h-4 w-4 shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
