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

/**
 * Request a reset link.
 *
 * Always resolves for a well-formed address, because the API always answers
 * 204 — it will not say whether an account exists. The UI must therefore show
 * the same confirmation either way; anything that distinguished them here would
 * hand back the enumeration the endpoint is built to withhold.
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) =>
      api.post<void>("/auth/forgot-password", { email }),
  })
}

interface ResetPasswordInput {
  token: string
  password: string
}

/** Completes a reset and lands the user signed in, so it seeds the session. */
export function useResetPassword() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ResetPasswordInput) =>
      api.post<SessionResponse>("/auth/reset-password", input),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, user)
    },
  })
}

interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

/**
 * Change the password of the signed-in user.
 *
 * The API re-issues this device's cookies as part of the response, so the
 * caller stays signed in while every other device is signed out immediately.
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      api.post<{ ok: boolean }>("/auth/change-password", input),
  })
}

export function useVerifyEmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (token: string) =>
      api.post<{ email: string }>("/auth/verify-email", { token }),
    onSuccess: () => {
      // The banner keys off `emailVerified` from /auth/me, so the session has
      // to be refetched for it to disappear.
      void queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY })
    },
  })
}

export function useResendVerification() {
  return useMutation({
    mutationFn: () => api.post<void>("/auth/resend-verification"),
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
