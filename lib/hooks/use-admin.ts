"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api/client"
import type {
  AdminRoleRequest,
  AdminSchedule,
  AdminStats,
  AdminUser,
  AuditEntry,
  RequestableRole,
} from "@/lib/api/admin-types"
import type { PlanTier, SubStatus } from "@/lib/api/domain-types"

export const ADMIN_KEY = ["admin"] as const

/**
 * Whether the caller is an admin. Hits `/admin-access`, which is deliberately
 * outside the role gate so a non-admin gets `false` rather than a 403 — this
 * runs on pages that everyone can open.
 */
export function useIsAdmin() {
  return useQuery({
    queryKey: [...ADMIN_KEY, "access"],
    queryFn: () => api.get<{ isAdmin: boolean }>("/admin-access"),
    staleTime: 60_000,
  })
}

export function useAdminStats(enabled: boolean) {
  return useQuery({
    queryKey: [...ADMIN_KEY, "stats"],
    queryFn: () => api.get<AdminStats>("/admin/stats"),
    enabled,
  })
}

export function useAdminUsers(enabled: boolean) {
  return useQuery({
    queryKey: [...ADMIN_KEY, "users"],
    queryFn: () => api.get<AdminUser[]>("/admin/users"),
    enabled,
  })
}

export function useAdminRoleRequests(enabled: boolean) {
  return useQuery({
    queryKey: [...ADMIN_KEY, "role-requests"],
    queryFn: () => api.get<AdminRoleRequest[]>("/admin/role-requests"),
    enabled,
  })
}

/**
 * The audit trail for admins.
 *
 * Deliberately not cached long: it is read to answer "what just happened", and
 * a stale list is worse than a refetch.
 */
export function useAdminAuditLog(enabled: boolean) {
  return useQuery({
    queryKey: [...ADMIN_KEY, "audit-log"],
    queryFn: () => api.get<AuditEntry[]>("/admin/audit-log"),
    staleTime: 0,
    enabled,
  })
}

export function useAdminSchedules(enabled: boolean) {
  return useQuery({
    queryKey: [...ADMIN_KEY, "schedules"],
    queryFn: () => api.get<AdminSchedule[]>("/admin/schedules"),
    enabled,
  })
}

/**
 * Deciding a request can grant a role, so the user directory and the stats
 * counters both go stale — invalidate the whole admin tree rather than guessing
 * which keys moved.
 */
export function useDecideRoleRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: {
      id: string
      decision: "approved" | "denied"
      note?: string
    }) =>
      api.post(`/admin/role-requests/${input.id}/decision`, {
        decision: input.decision,
        note: input.note,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_KEY })
    },
  })
}

export function useSetUserRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: {
      userId: string
      role: RequestableRole
      action: "grant" | "revoke"
    }) =>
      api.post(`/admin/users/${input.userId}/roles`, {
        role: input.role,
        action: input.action,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_KEY })
    },
  })
}

export function useUpdateUserSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: {
      userId: string
      plan: PlanTier
      status: SubStatus
    }) =>
      api.patch(`/admin/users/${input.userId}/subscription`, {
        plan: input.plan,
        status: input.status,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_KEY })
    },
  })
}

export function useAdminDeleteSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/admin/schedules/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_KEY })
    },
  })
}
