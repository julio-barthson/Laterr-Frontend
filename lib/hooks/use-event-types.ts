"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api/client"
import type {
  EventKind,
  EventLocationType,
  EventType,
  QuestionType,
} from "@/lib/api/schedule-types"

export const EVENT_TYPES_KEY = ["event-types"] as const

export function useEventTypes() {
  return useQuery({
    queryKey: EVENT_TYPES_KEY,
    queryFn: () => api.get<EventType[]>("/event-types"),
  })
}

export function useEventType(id: string | undefined) {
  return useQuery({
    queryKey: [...EVENT_TYPES_KEY, id],
    queryFn: () => api.get<EventType>(`/event-types/${id}`),
    enabled: Boolean(id),
  })
}

export interface EventQuestionInput {
  label: string
  qtype: QuestionType
  options?: string[]
  isRequired: boolean
  position: number
}

/**
 * Mirrors the API's CreateEventTypeDto.
 *
 * `questions` present replaces the whole set; absent leaves it untouched. That
 * asymmetry is the API's contract, so the type keeps it optional rather than
 * defaulting to an empty array — sending `[]` would silently delete a host's
 * questions on any partial update.
 */
export interface EventTypeInput {
  name: string
  slug: string
  description?: string
  color: string
  durationMinutes: number
  kind: EventKind
  locationType: EventLocationType
  locationDetails?: string
  bufferBeforeMin: number
  bufferAfterMin: number
  minNoticeMin: number
  rollingDays: number
  slotIncrementMin: number
  capacity: number
  isActive: boolean
  isHidden: boolean
  questions?: EventQuestionInput[]
}

export function useCreateEventType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: EventTypeInput) =>
      api.post<EventType>("/event-types", input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: EVENT_TYPES_KEY }),
  })
}

export function useUpdateEventType(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: Partial<EventTypeInput>) =>
      api.patch<EventType>(`/event-types/${id}`, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: EVENT_TYPES_KEY }),
  })
}

export function useSetEventTypeActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch<EventType>(`/event-types/${id}/active`, { isActive }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: EVENT_TYPES_KEY }),
  })
}

export function useDeleteEventType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/event-types/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: EVENT_TYPES_KEY }),
  })
}
