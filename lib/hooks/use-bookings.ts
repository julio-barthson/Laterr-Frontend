"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { API_BASE_URL } from "@/lib/api/config"
import { api } from "@/lib/api/client"
import type { BookingRequest, BookingStatus } from "@/lib/api/domain-types"
import type { Booking, MeetingsTab } from "@/lib/api/schedule-types"

export const BOOKINGS_KEY = ["bookings"] as const
export const BOOKING_REQUESTS_KEY = ["booking-requests"] as const

export function useBookingRequests() {
  return useQuery({
    queryKey: BOOKING_REQUESTS_KEY,
    queryFn: () => api.get<BookingRequest[]>("/booking-requests"),
  })
}

/**
 * Accepting a request creates a schedule, so the schedules cache goes stale too
 * — the original invalidated both for the same reason.
 */
export function useRespondToRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { id: string; action: "accept" | "decline" }) =>
      api.patch<BookingRequest>(`/booking-requests/${input.id}/respond`, {
        action: input.action,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BOOKING_REQUESTS_KEY })
      void queryClient.invalidateQueries({ queryKey: ["schedules"] })
    },
  })
}

export function useDeleteBookingRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/booking-requests/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BOOKING_REQUESTS_KEY })
    },
  })
}

export function useBookings(filter: {
  tab: MeetingsTab
  eventTypeId?: string
}) {
  return useQuery({
    queryKey: [...BOOKINGS_KEY, filter],
    queryFn: () =>
      api.get<Booking[]>("/bookings", {
        query: { tab: filter.tab, eventTypeId: filter.eventTypeId },
      }),
  })
}

function useBookingInvalidation() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: BOOKINGS_KEY })
}

export function useSetBookingStatus() {
  const invalidate = useBookingInvalidation()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) =>
      api.patch<Booking>(`/bookings/${id}/status`, { status }),
    onSuccess: invalidate,
  })
}

export function useSetMeetingUrl() {
  const invalidate = useBookingInvalidation()

  return useMutation({
    mutationFn: ({
      id,
      meetingUrl,
    }: {
      id: string
      meetingUrl: string | null
    }) => api.patch<Booking>(`/bookings/${id}/meeting-url`, { meetingUrl }),
    onSuccess: invalidate,
  })
}

export function useSetBookingNotes() {
  const invalidate = useBookingInvalidation()

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string | null }) =>
      api.patch<Booking>(`/bookings/${id}/notes`, { notes }),
    onSuccess: invalidate,
  })
}

export function useDeleteBooking() {
  const invalidate = useBookingInvalidation()

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/bookings/${id}`),
    onSuccess: invalidate,
  })
}

/**
 * Downloads the CSV export.
 *
 * Deliberately a manual fetch rather than the shared client: the response is
 * text/csv, and `apiFetch` parses JSON. A plain anchor to the URL would not
 * work either — the export needs the session cookie, and a cross-origin link
 * navigation would not carry it with the right credentials mode.
 */
export async function downloadBookingsCsv(filter: {
  tab: MeetingsTab
  eventTypeId?: string
}) {
  const url = new URL(`${API_BASE_URL}/bookings/export`)
  url.searchParams.set("tab", filter.tab)
  if (filter.eventTypeId) {
    url.searchParams.set("eventTypeId", filter.eventTypeId)
  }

  const response = await fetch(url, { credentials: "include" })

  if (!response.ok) {
    throw new Error("Export failed")
  }

  const blob = await response.blob()
  const href = URL.createObjectURL(blob)

  try {
    const anchor = document.createElement("a")
    anchor.href = href
    anchor.download = `laterr-bookings-${filter.tab}.csv`
    anchor.click()
  } finally {
    // Without this the blob is held for the lifetime of the document.
    URL.revokeObjectURL(href)
  }
}
