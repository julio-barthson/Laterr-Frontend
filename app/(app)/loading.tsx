import { Skeleton } from "@/components/ui/skeleton"

/**
 * Shown while a dynamic page in the app resolves.
 *
 * The pages that need this are the ones awaiting route params — `/schedules/[id]`,
 * `/workspaces/[id]`, `/event-types/[id]` — where without a boundary the browser
 * sits on the previous page until the server responds, which reads as a dead
 * click. The shape is deliberately generic: a heading and a couple of cards is
 * close enough to every page in this group.
 */
export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  )
}
