"use client"

import { Badge } from "@/components/ui/badge"
import type { Schedule } from "@/lib/api/domain-types"
import { CATEGORY_META } from "@/lib/schedule-meta"


export function AgendaColumn({
  title,
  items,
  emptyLabel,
}: {
  title: string
  items: Schedule[]
  emptyLabel: string
}) {
  return (
    <div>
      <h3 className="font-semibold text-base">{title}</h3>
      {items.length === 0 ? (
        <p className="text-muted-foreground mt-2 text-sm">{emptyLabel}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <AgendaItem key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  )
}

function AgendaItem({ item }: { item: Schedule }) {
  const Icon = CATEGORY_META[item.category].icon
  const start = new Date(item.startsAt)

  return (
    <li className="border-border/60 bg-background flex items-center gap-3 rounded-xl border p-3">
      <span className="bg-primary/10 text-primary grid h-9 w-9 shrink-0 place-items-center rounded-lg">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.title}</p>
        <p className="text-muted-foreground text-xs">
          <time dateTime={item.startsAt}>
            {start.toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit",
            })}
          </time>
          {item.location ? ` · ${item.location}` : ""}
        </p>
      </div>
      <Badge variant="secondary" className="shrink-0 capitalize">
        {item.category}
      </Badge>
    </li>
  )
}
