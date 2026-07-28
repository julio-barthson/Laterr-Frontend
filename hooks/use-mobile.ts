import * as React from "react"

const MOBILE_BREAKPOINT = 768
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

/**
 * Whether the viewport is below the mobile breakpoint.
 *
 * `useSyncExternalStore` rather than `useState` + an effect. The shadcn original
 * seeded the state from an effect, which React 19 flags as a cascading render
 * (`react-hooks/set-state-in-effect`) — the first paint used `undefined`, then a
 * second render corrected it, so a sidebar could flash open before collapsing.
 *
 * This subscribes to the media query as the external store it is: the value is
 * read synchronously on the first render, and the server snapshot is `false`
 * because there is no viewport to measure during SSR.
 */
function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(QUERY)

  query.addEventListener("change", onChange)

  return () => query.removeEventListener("change", onChange)
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches
}

function getServerSnapshot(): boolean {
  return false
}

export function useIsMobile(): boolean {
  return React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )
}
