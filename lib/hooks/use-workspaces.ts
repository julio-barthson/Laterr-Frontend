"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api/client"
import type {
  MyInvite,
  PlanAccess,
  WorkspaceDetail,
  WorkspaceKind,
  WorkspaceRole,
  WorkspaceSummary,
} from "@/lib/api/admin-types"

export const WORKSPACES_KEY = ["workspaces"] as const
export const TEAMS_ACCESS_KEY = ["teams-access"] as const
export const MY_INVITES_KEY = ["my-invites"] as const

export function useTeamsAccess() {
  return useQuery({
    queryKey: TEAMS_ACCESS_KEY,
    queryFn: () => api.get<PlanAccess>("/workspaces/access"),
    staleTime: 60_000,
  })
}

export function useWorkspaces() {
  return useQuery({
    queryKey: WORKSPACES_KEY,
    queryFn: () => api.get<WorkspaceSummary[]>("/workspaces"),
  })
}

export function useMyInvites() {
  return useQuery({
    queryKey: MY_INVITES_KEY,
    queryFn: () => api.get<MyInvite[]>("/workspaces/invites"),
  })
}

export function useWorkspace(id: string) {
  return useQuery({
    queryKey: [...WORKSPACES_KEY, id],
    queryFn: () => api.get<WorkspaceDetail>(`/workspaces/${id}`),
    enabled: id.length > 0,
  })
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { name: string; kind: WorkspaceKind }) =>
      api.post<WorkspaceSummary>("/workspaces", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY })
    },
  })
}

export function useRenameWorkspace(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (name: string) =>
      api.patch<WorkspaceSummary>(`/workspaces/${id}`, { name }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY })
    },
  })
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/workspaces/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY })
    },
  })
}

export function useInviteToWorkspace(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { email: string; role: WorkspaceRole }) =>
      api.post(`/workspaces/${id}/invites`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...WORKSPACES_KEY, id] })
    },
  })
}

export function useRevokeInvite(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (inviteId: string) =>
      api.delete<void>(`/workspaces/${id}/invites/${inviteId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...WORKSPACES_KEY, id] })
    },
  })
}

/**
 * Accepting an invite changes which workspaces exist for this user *and* clears
 * the pending-invite list, so both caches are dropped.
 */
export function useAcceptInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (code: string) =>
      api.post<{ workspaceId: string }>("/workspaces/invites/accept", { code }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY })
      void queryClient.invalidateQueries({ queryKey: MY_INVITES_KEY })
    },
  })
}

export function useUpdateMemberRole(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { memberId: string; role: "admin" | "member" }) =>
      api.patch(`/workspaces/${id}/members/${input.memberId}`, {
        role: input.role,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...WORKSPACES_KEY, id] })
    },
  })
}

export function useRemoveMember(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (memberId: string) =>
      api.delete<void>(`/workspaces/${id}/members/${memberId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...WORKSPACES_KEY, id] })
    },
  })
}

export function useLeaveWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.delete<void>(`/workspaces/${id}/membership`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY })
    },
  })
}
