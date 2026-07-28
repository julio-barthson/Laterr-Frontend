"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api/client"
import type { PersonaType, Profile } from "@/lib/api/domain-types"

export const PROFILE_KEY = ["profile"] as const
export const UPLOAD_CAPABILITIES_KEY = ["upload-capabilities"] as const

export interface UploadCapabilities {
  avatars: boolean
  maxBytes: number
}

export interface PresignedUpload {
  uploadUrl: string
  publicUrl: string
  key: string
  expiresIn: number
}

export interface ProfileInput {
  displayName?: string | null
  username?: string | null
  persona?: PersonaType
  timezone?: string | null
  phone?: string | null
  avatarUrl?: string | null
}

export function useProfile() {
  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: () => api.get<Profile>("/profiles/me"),
  })
}

export function useUploadCapabilities() {
  return useQuery({
    queryKey: UPLOAD_CAPABILITIES_KEY,
    queryFn: () => api.get<UploadCapabilities>("/uploads/capabilities"),
    staleTime: 5 * 60_000,
  })
}

/**
 * Whether a username is free.
 *
 * `enabled` gates on length so the first keystroke does not fire a request, and
 * the value is part of the key so each candidate is cached separately rather
 * than refetched as the user backspaces.
 */
export function useUsernameAvailable(username: string) {
  const candidate = username.trim().toLowerCase()

  return useQuery({
    queryKey: ["username-available", candidate],
    queryFn: () =>
      api.get<{ available: boolean }>("/profiles/username-available", {
        query: { username: candidate },
      }),
    enabled: candidate.length >= 3,
    staleTime: 30_000,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ProfileInput) =>
      api.patch<Profile>("/profiles/me", input),
    onSuccess: (profile) => {
      // Seeded rather than invalidated: the response is the new profile, so a
      // refetch would only re-fetch what we already hold.
      queryClient.setQueryData(PROFILE_KEY, profile)
      // The shell renders the avatar and display name from the session.
      void queryClient.invalidateQueries({ queryKey: ["session"] })
    },
  })
}

/**
 * Uploads an avatar and returns its public URL.
 *
 * Two steps, and the order matters: the API signs a PUT bound to this user's key
 * prefix, content type and exact byte length, then the browser sends the bytes
 * straight to R2. The bytes never pass through the API, so a large upload does
 * not occupy a Node process.
 *
 * The PUT deliberately does not carry credentials — the signature is the
 * authorization, and sending cookies to a third-party origin would be both
 * useless and a leak.
 */
export async function uploadAvatar(file: File): Promise<string> {
  const { uploadUrl, publicUrl } = await api.post<PresignedUpload>(
    "/uploads/avatar",
    { contentType: file.type, contentLength: file.size }
  )

  const response = await fetch(uploadUrl, {
    method: "PUT",
    // Must match what was signed exactly, or R2 rejects the signature.
    headers: { "Content-Type": file.type },
    body: file,
    credentials: "omit",
  })

  if (!response.ok) {
    throw new Error(
      `The image could not be uploaded (${response.status}). Please try again.`
    )
  }

  return publicUrl
}
