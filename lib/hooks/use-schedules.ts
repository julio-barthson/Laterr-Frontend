"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api/client"
import type {
  Schedule,
  ScheduleCategory,
  ScheduleQuota,
  ScheduleStatus,
} from "@/lib/api/domain-types"

export const SCHEDULES_KEY = ["schedules"] as const
export const QUOTA_KEY = ["schedule-quota"] as const

export function useSchedules(filter?: {
  category?: ScheduleCategory
  status?: ScheduleStatus
}) {
  return useQuery({
    queryKey: [...SCHEDULES_KEY, filter ?? {}],
    queryFn: () =>
      api.get<Schedule[]>("/schedules", {
        query: { category: filter?.category, status: filter?.status },
      }),
  })
}

export function useScheduleQuota() {
  return useQuery({
    queryKey: QUOTA_KEY,
    queryFn: () => api.get<ScheduleQuota>("/subscriptions/quota"),
  })
}

export interface ScheduleInput {
  category: ScheduleCategory
  title: string
  description?: string
  startsAt: string
  endsAt?: string
  location?: string
  meetingUrl?: string
  provider?: string
  amount?: number
  currency?: string
  recipient?: string
  flightNo?: string
  teamName?: string
  notes?: string
  confidential?: boolean
}

/** Quota must be refetched alongside the list — creating one consumes it. */
function useScheduleInvalidation() {
  const queryClient = useQueryClient()

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: SCHEDULES_KEY }),
      queryClient.invalidateQueries({ queryKey: QUOTA_KEY }),
    ])
  }
}

export function useCreateSchedule() {
  const invalidate = useScheduleInvalidation()

  return useMutation({
    mutationFn: (input: ScheduleInput) =>
      api.post<Schedule>("/schedules", input),
    onSuccess: invalidate,
  })
}

export function useUpdateSchedule(id: string) {
  const invalidate = useScheduleInvalidation()

  return useMutation({
    mutationFn: (input: Partial<ScheduleInput>) =>
      api.patch<Schedule>(`/schedules/${id}`, input),
    onSuccess: invalidate,
  })
}

export function useSetScheduleStatus() {
  const invalidate = useScheduleInvalidation()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ScheduleStatus }) =>
      api.patch<Schedule>(`/schedules/${id}/status`, { status }),
    onSuccess: invalidate,
  })
}

export function useDeleteSchedule() {
  const invalidate = useScheduleInvalidation()

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/schedules/${id}`),
    onSuccess: invalidate,
  })
}
