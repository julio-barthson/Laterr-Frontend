"use client"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { Button } from "./ui/button"
import { IconArrowLeft } from "@tabler/icons-react"
import { MdVerified } from "react-icons/md"
import { Badge } from "./ui/badge"
import { useTheme } from "next-themes"

interface PageHeaderProps {
  title?: string | any
  description?: string | any
  action?: ReactNode
  back?: boolean
  query?: string
  badges?: string[]
  fallbackHref?: string
}

export function PageHeader({
  title,
  description,
  action,
  back,
  badges,
  query,
  fallbackHref = "/",
}: PageHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()

      if (query) {
        // allow back navigation, then update query
        setTimeout(() => {
          const url = new URL(window.location.href)
          url.searchParams.set(query, "true")
          router.replace(url.pathname + url.search)
        }, 0)
      }
    } else {
      // no history → safe fallback
      router.push(query ? `${fallbackHref}?${query}=true` : fallbackHref)
    }
  }

    const { resolvedTheme } = useTheme()

  return (
    <div className="mb-4">
      <div className="flex items-center justify-start w-full gap-2">
        {back && (
          <Button onClick={handleBack} size="icon" variant="secondary">
            <IconArrowLeft />
          </Button>
        )}
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center md:gap-0">
          <div>
            <h1 className={`text-[36px] font-bold ${resolvedTheme === "dark" ? "text-foreground" : "text-[#204B41]"}>`}>{title}</h1>
            {description && (
              <p className="mb-3 text-xs text-muted-foreground md:text-base">
                <span className="inline-flex text-xs items-center gap-1 text-amber-500">
                  <MdVerified className="h-4 w-4" aria-hidden="true" />
                  {description}
                </span>
              </p>
            )}

            {badges && (
              <div className="mt-2.5 flex gap-2">
                {badges.map((badge) => (
                  <Badge variant={"secondary"}>{badge}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        {action && <div className="md:w-auto">{action}</div>}
      </div>
    </div>
  )
}
