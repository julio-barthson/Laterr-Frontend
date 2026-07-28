"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

/** Never subscribes, so this is just "false on the server, true on the client". */
const noopSubscribe = () => () => {}

/**
 * Hydration-safe mount flag.
 *
 * The usual `useState(false)` + `useEffect(() => setMounted(true))` pattern
 * trips React 19's set-state-in-effect rule, and it costs an extra render.
 * useSyncExternalStore gets the same answer from its server/client snapshot
 * pair, with no effect and no state update.
 */
function useHasMounted() {
  return React.useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  )
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const hasMounted = useHasMounted()

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {/* The server cannot know the resolved theme, so the first paint reserves
          the space instead of guessing and hydrating mismatched. */}
      {hasMounted ? (
        isDark ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )
      ) : (
        <span className="h-4 w-4" />
      )}
    </Button>
  )
}
