"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api/client"

export type BillingProvider = "stripe" | "paystack"
export type PurchasableTier = "individual" | "family" | "business"
export type BillingInterval = "monthly" | "yearly"

export interface BillingCatalogue {
  plans: Array<{
    tier: PurchasableTier
    name: string
    monthlyMinor: number
    yearlyMinor: number
    seats: number
    blurb: string
  }>
  providers: { stripe: boolean; paystack: boolean }
}

export function useBillingCatalogue() {
  return useQuery({
    queryKey: ["billing", "catalogue"],
    queryFn: () => api.get<BillingCatalogue>("/billing/catalogue"),
    // Prices and which processors are live are deployment config, not per-user.
    staleTime: 5 * 60_000,
  })
}

/**
 * Start checkout and hand the browser to the processor.
 *
 * A full navigation, not a popup — both Stripe Checkout and Paystack render
 * their own hosted page, and popups get blocked when the click is one promise
 * removed from the user's gesture.
 */
export function useStartCheckout() {
  return useMutation({
    mutationFn: async (input: {
      provider: BillingProvider
      tier: PurchasableTier
      interval: BillingInterval
    }) => {
      const { url } = await api.post<{ url: string }>("/billing/checkout", input)

      window.location.href = url
    },
  })
}

export function useCancelSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.post<{ ok: true }>("/billing/cancel"),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["subscription"] }),
  })
}

/** Minor units to a display string. 899 -> "$8.99". */
export function formatMinor(minor: number, currency = "USD"): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    // Whole amounts read better without ".00" on a pricing card.
    minimumFractionDigits: minor % 100 === 0 ? 0 : 2,
  }).format(minor / 100)
}
