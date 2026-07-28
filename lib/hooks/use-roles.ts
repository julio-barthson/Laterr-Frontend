"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api/client"
import type {
  MyRole,
  PlanAccess,
  RequestableRole,
  RoleRequest,
} from "@/lib/api/admin-types"

export const MY_ROLES_KEY = ["my-roles"] as const
export const MY_ROLE_REQUESTS_KEY = ["my-role-requests"] as const
export const ROLES_ACCESS_KEY = ["roles-access"] as const

export function useRolesAccess() {
  return useQuery({
    queryKey: ROLES_ACCESS_KEY,
    queryFn: () => api.get<PlanAccess>("/roles/access"),
    staleTime: 60_000,
  })
}

export function useMyRoles() {
  return useQuery({
    queryKey: MY_ROLES_KEY,
    queryFn: () => api.get<MyRole[]>("/roles/mine"),
  })
}

export function useMyRoleRequests() {
  return useQuery({
    queryKey: MY_ROLE_REQUESTS_KEY,
    queryFn: () => api.get<RoleRequest[]>("/roles/requests"),
  })
}

export function useCreateRoleRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { requestedRole: RequestableRole; reason?: string }) =>
      api.post<RoleRequest>("/roles/requests", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MY_ROLE_REQUESTS_KEY })
    },
  })
}

export function useCancelRoleRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/roles/requests/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MY_ROLE_REQUESTS_KEY })
    },
  })
}
