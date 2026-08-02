"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api/client"

export type CalendarProvider = "google" | "microsoft" | "caldav"

export interface CalendarConnection {
  id: string
  provider: CalendarProvider
  /** The external account being read. Display only. */
  accountEmail: string
  lastSyncedAt: string | null
  /**
   * Last failure, or null when healthy. Busy lookups fail open, so this is the
   * only signal that a revoked connection has quietly stopped protecting them.
   */
  syncError: string | null
  /**
   * False for connections made before Meet links existed — those granted only
   * calendar.readonly, so the host has to reconnect to grant event creation.
   */
  canCreateMeetLinks: boolean
  createdAt: string
}

export interface CalendarCapabilities {
  google: boolean
}

const CONNECTIONS_KEY = ["calendar", "connections"] as const

/** Whether this deployment has calendar credentials configured at all. */
export function useCalendarCapabilities() {
  return useQuery({
    queryKey: ["calendar", "capabilities"],
    queryFn: () => api.get<CalendarCapabilities>("/calendar/capabilities"),
    // Deployment configuration, not user data — it will not change mid-session.
    staleTime: Infinity,
  })
}

export function useCalendarConnections(enabled = true) {
  return useQuery({
    queryKey: CONNECTIONS_KEY,
    queryFn: () => api.get<CalendarConnection[]>("/calendar/connections"),
    enabled,
  })
}

/**
 * Fetches the consent URL, then sends the browser to it.
 *
 * A full navigation rather than a popup: Google blocks its consent screen in
 * many popup contexts, and the callback redirects back to settings anyway.
 */
export function useConnectGoogleCalendar() {
  return useMutation({
    mutationFn: async () => {
      const { url } = await api.get<{ url: string }>(
        "/calendar/google/authorize"
      )

      window.location.href = url
    },
  })
}

export function useDisconnectCalendar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/calendar/connections/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: CONNECTIONS_KEY }),
  })
}
