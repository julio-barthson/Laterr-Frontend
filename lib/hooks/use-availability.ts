"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api/client"
import type {
  AvailabilityResponse,
  AvailabilityRule,
} from "@/lib/api/schedule-types"

export const AVAILABILITY_KEY = ["availability"] as const

export function useAvailability() {
  return useQuery({
    queryKey: AVAILABILITY_KEY,
    queryFn: () => api.get<AvailabilityResponse>("/availability"),
  })
}

export function useSaveAvailability() {
  const queryClient = useQueryClient()

  return useMutation({
    // PUT, not PATCH: the rule set is replaced wholesale.
    mutationFn: (input: {
      timezone: string
      rules: Array<Pick<AvailabilityRule, "weekday" | "startMin" | "endMin">>
    }) => api.put<AvailabilityResponse["schedule"]>("/availability", input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: AVAILABILITY_KEY }),
  })
}

export function useUpsertDateOverride() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: {
      theDate: string
      isClosed: boolean
      startMin?: number
      endMin?: number
    }) => api.put("/availability/overrides", input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: AVAILABILITY_KEY }),
  })
}

export function useDeleteDateOverride() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (date: string) =>
      api.delete<void>(`/availability/overrides/${date}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: AVAILABILITY_KEY }),
  })
}
