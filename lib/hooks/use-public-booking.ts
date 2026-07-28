"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api/client"
import type {
  CreatedBooking,
  EventTypePageResponse,
  HostPageResponse,
  SlotsResponse,
  TokenBooking,
} from "@/lib/api/public-types"

export function usePublicHost(username: string) {
  return useQuery({
    queryKey: ["public-host", username],
    queryFn: () => api.get<HostPageResponse>(`/public/hosts/${username}`),
  })
}

export function usePublicEventType(username: string, slug: string) {
  return useQuery({
    queryKey: ["public-event-type", username, slug],
    queryFn: () =>
      api.get<EventTypePageResponse>(`/public/hosts/${username}/${slug}`),
  })
}

/**
 * Slots for a window. `from`/`to` are UTC ISO instants covering the visible
 * month; the API clamps `to` to the event type's rolling limit regardless of
 * what is asked for.
 */
export function usePublicSlots(
  username: string,
  slug: string,
  window: { from: string; to: string } | null
) {
  return useQuery({
    queryKey: ["public-slots", username, slug, window],
    queryFn: () =>
      api.get<SlotsResponse>(`/public/hosts/${username}/${slug}/slots`, {
        query: { from: window?.from, to: window?.to },
      }),
    enabled: window !== null,
    // Slots go stale the moment someone else books, so keep the window short.
    staleTime: 15_000,
  })
}

export interface CreateBookingInput {
  startsAt: string
  inviteeName: string
  inviteeEmail: string
  inviteeTimezone: string
  notes?: string
  answers?: Array<{ questionId: string; answer?: string }>
}

export function useCreateBooking(username: string, slug: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateBookingInput) =>
      api.post<CreatedBooking>(
        `/public/hosts/${username}/${slug}/bookings`,
        input
      ),
    onSuccess: () =>
      // The slot just taken must disappear if the visitor goes back.
      queryClient.invalidateQueries({ queryKey: ["public-slots"] }),
  })
}

export function useTokenBooking(token: string) {
  return useQuery({
    queryKey: ["token-booking", token],
    queryFn: () => api.get<TokenBooking>(`/public/bookings/${token}`),
    retry: false,
  })
}

export function useCancelBooking(token: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (reason?: string) =>
      api.post<{ ok: boolean }>(`/public/bookings/${token}/cancel`, { reason }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["token-booking", token] }),
  })
}

export function useRescheduleBooking(token: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { startsAt: string; reason?: string }) =>
      api.post<CreatedBooking>(
        `/public/bookings/${token}/reschedule`,
        input
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["token-booking", token],
      })
      await queryClient.invalidateQueries({ queryKey: ["public-slots"] })
    },
  })
}
