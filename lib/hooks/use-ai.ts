"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api/client"
import type { ScheduleCategory } from "@/lib/api/domain-types"
import { SCHEDULES_KEY } from "@/lib/hooks/use-schedules"

/**
 * What `/ai/parse-schedule` returns. Snake_case because the model fills it and
 * the schema is shared with the tool definitions — it is not a domain type.
 */
export interface ParsedSchedule {
  category: ScheduleCategory
  title: string
  description: string | null
  starts_at: string
  ends_at: string | null
  location: string | null
  meeting_url: string | null
  provider: string | null
  amount: number | null
  currency: string | null
  recipient: string | null
  flight_no: string | null
  team_name: string | null
}

export interface DraftedFollowup {
  message: string
  quick_replies: string[]
}

export interface Followup {
  id: string
  scheduleId: string
  message: string
  quickReplies: string[] | null
  userReply: string | null
  aiReply: string | null
  createdAt: string
}

export const FOLLOWUPS_KEY = ["followups"] as const

/** Natural language to structured fields. Nothing is saved until the user confirms. */
export function useParseSchedule() {
  return useMutation({
    mutationFn: (text: string) =>
      api.post<ParsedSchedule>("/ai/parse-schedule", {
        text,
        // Sent so relative dates ("next Tuesday") resolve against the user's
        // clock rather than the server's.
        now: new Date().toISOString(),
      }),
  })
}

export function useDraftFollowup() {
  return useMutation({
    mutationFn: (input: {
      category: string
      title: string
      location?: string | null
      recipient?: string | null
    }) => api.post<DraftedFollowup>("/ai/followups/draft", input),
  })
}

export function useReplyToFollowupAi() {
  return useMutation({
    mutationFn: (input: { context: string; userReply: string }) =>
      api.post<{ reply: string }>("/ai/followups/reply", input),
  })
}

export function useFollowups(scheduleId?: string) {
  return useQuery({
    queryKey: [...FOLLOWUPS_KEY, scheduleId ?? "all"],
    queryFn: () => api.get<Followup[]>("/followups"),
    select: (rows) =>
      scheduleId ? rows.filter((row) => row.scheduleId === scheduleId) : rows,
  })
}

/**
 * Persists a check-in.
 *
 * The original generated the message and the reply and then threw both away —
 * nothing on that page ever wrote to `followups`, even though the table has
 * columns for exactly this. Saving means the AI tools (`list_followups`,
 * `reply_to_followup`) and the UI are looking at the same rows.
 */
export function useCreateFollowup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: {
      scheduleId: string
      message: string
      quickReplies?: string[]
    }) => api.post<Followup>("/followups", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FOLLOWUPS_KEY })
      void queryClient.invalidateQueries({ queryKey: SCHEDULES_KEY })
    },
  })
}

export function useSaveFollowupReply() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { id: string; userReply: string; aiReply?: string }) =>
      api.patch<Followup>(`/followups/${input.id}/reply`, {
        userReply: input.userReply,
        aiReply: input.aiReply,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FOLLOWUPS_KEY })
    },
  })
}
