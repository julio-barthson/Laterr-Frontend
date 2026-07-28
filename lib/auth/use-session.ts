"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { api } from "@/lib/api/client"
import { ApiError } from "@/lib/api/errors"
import type { AuthenticatedUser, SessionResponse } from "@/lib/auth/types"

export const SESSION_QUERY_KEY = ["session"] as const

/**
 * The current session, read from `/auth/me`.
 *
 * Roles come from the database on every call rather than from the access token,
 * so a role granted or revoked mid-session is reflected without the user having
 * to sign out and back in.
 *
 * A 401 is a valid answer, not an error — it means "signed out". Returning null
 * keeps callers from having to distinguish that from a network failure.
 */
export function useSession() {
  const query = useQuery<AuthenticatedUser | null>({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async () => {
      try {
        const { user } = await api.get<SessionResponse>("/auth/me")
        return user
      } catch (error) {
        if (error instanceof ApiError && error.isUnauthorized) {
          return null
        }
        throw error
      }
    },
    staleTime: 60_000,
    retry: false,
  })

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}

export function hasRole(
  user: AuthenticatedUser | null,
  ...roles: AuthenticatedUser["roles"]
) {
  if (!user) return false
  return roles.some((role) => user.roles.includes(role))
}

interface LoginInput {
  email: string
  password: string
}

interface RegisterInput extends LoginInput {
  displayName?: string
  username?: string
  phone?: string
  timezone?: string
}

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: LoginInput) =>
      api.post<SessionResponse>("/auth/login", input),
    onSuccess: ({ user }) => {
      // Seed the cache so the destination page renders without a second
      // round-trip to /auth/me.
      queryClient.setQueryData(SESSION_QUERY_KEY, user)
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: RegisterInput) =>
      api.post<SessionResponse>("/auth/register", input),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, user)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: () => api.post<void>("/auth/logout"),
    onSettled: async () => {
      // Clear regardless of outcome. The cookies are gone either way, so
      // keeping cached data around would show one user's data to the next.
      await queryClient.cancelQueries()
      queryClient.clear()
      router.replace("/auth")
    },
  })
}
