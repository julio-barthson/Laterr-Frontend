"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api/client"
import type {
  Announcement,
  AuditEntry,
  BannerVariant,
  FeatureFlag,
  OwnerOverview,
  OwnerWorkspace,
} from "@/lib/api/admin-types"
import type { AppRole, PlatformSettings } from "@/lib/auth/types"

export const OWNER_KEY = ["owner"] as const
export const PLATFORM_SETTINGS_KEY = ["platform-settings"] as const

export function useIsOwner() {
  return useQuery({
    queryKey: [...OWNER_KEY, "access"],
    queryFn: () => api.get<{ isOwner: boolean }>("/owner-access"),
    staleTime: 60_000,
  })
}

export function useOwnerOverview(enabled: boolean) {
  return useQuery({
    queryKey: [...OWNER_KEY, "overview"],
    queryFn: () => api.get<OwnerOverview>("/owner/overview"),
    enabled,
  })
}

export function useFeatureFlags(enabled: boolean) {
  return useQuery({
    queryKey: [...OWNER_KEY, "feature-flags"],
    queryFn: () => api.get<FeatureFlag[]>("/owner/feature-flags"),
    enabled,
  })
}

export function useAnnouncements(enabled: boolean) {
  return useQuery({
    queryKey: [...OWNER_KEY, "announcements"],
    queryFn: () => api.get<Announcement[]>("/owner/announcements"),
    enabled,
  })
}

export function useAuditLog(enabled: boolean) {
  return useQuery({
    queryKey: [...OWNER_KEY, "audit-log"],
    queryFn: () => api.get<AuditEntry[]>("/owner/audit-log"),
    enabled,
  })
}

export interface OwnerUser {
  id: string
  email: string
  createdAt: string
  profile: { displayName: string | null; username: string | null } | null
  roles: Array<{ role: AppRole }>
}

/**
 * Owner-scoped user list. Search runs on the server (up to 100 rows) rather than
 * filtering a full download client-side, so the operator can find an account on
 * a platform with more users than one page.
 */
export function useOwnerUsers(search: string) {
  return useQuery({
    queryKey: [...OWNER_KEY, "users", search],
    queryFn: () =>
      api.get<OwnerUser[]>("/owner/users", { query: { search } }),
    // Keep the previous page visible while a new search resolves.
    placeholderData: (previous) => previous,
  })
}

export function useOwnerWorkspaces(enabled: boolean) {
  return useQuery({
    queryKey: [...OWNER_KEY, "workspaces"],
    queryFn: () => api.get<OwnerWorkspace[]>("/owner/workspaces"),
    enabled,
  })
}

export interface PlatformSettingsPatch {
  maintenanceMode?: boolean
  maintenanceMessage?: string | null
  broadcastActive?: boolean
  broadcastTitle?: string | null
  broadcastBody?: string | null
  broadcastVariant?: BannerVariant
}

/**
 * Writing platform settings changes the banner the app shell renders for
 * everyone, so the shared `platform-settings` cache is invalidated alongside the
 * owner tree — otherwise the operator toggling maintenance mode is the last
 * person to see it.
 */
export function useUpdatePlatformSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (patch: PlatformSettingsPatch) =>
      api.patch<PlatformSettings>("/owner/settings", patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PLATFORM_SETTINGS_KEY })
      void queryClient.invalidateQueries({ queryKey: OWNER_KEY })
    },
  })
}

export function useUpsertFeatureFlag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: {
      key: string
      enabled: boolean
      description?: string | null
    }) => api.post<FeatureFlag>("/owner/feature-flags", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: OWNER_KEY })
    },
  })
}

export function useDeleteFeatureFlag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (key: string) =>
      api.delete<void>(`/owner/feature-flags/${encodeURIComponent(key)}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: OWNER_KEY })
    },
  })
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: {
      title: string
      body: string
      variant: BannerVariant
      active: boolean
      endsAt?: string | null
    }) => api.post<Announcement>("/owner/announcements", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: OWNER_KEY })
    },
  })
}

export function useSetAnnouncementActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { id: string; active: boolean }) =>
      api.patch<void>(`/owner/announcements/${input.id}`, {
        active: input.active,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: OWNER_KEY })
    },
  })
}

export function useForceSignOut() {
  return useMutation({
    mutationFn: (userId: string) =>
      api.post(`/owner/users/${userId}/force-signout`),
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => api.delete(`/owner/users/${userId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: OWNER_KEY })
      void queryClient.invalidateQueries({ queryKey: ["admin"] })
    },
  })
}
