"use client"

import * as React from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { getErrorMessage } from "@/lib/api/errors"
import { useSession } from "@/lib/auth/use-session"
import {
  useBillingCatalogue,
  useStartCheckout,
  type BillingInterval,
  type BillingProvider,
  type PurchasableTier,
} from "@/lib/hooks/use-billing"

/**
 * The buy button on a pricing card.
 *
 * A client island inside an otherwise static, SEO-indexed page: the prices are
 * server-rendered for crawlers, and only the action needs a session.
 *
 * Signed out, it is a link to sign-up — there is nobody to attach a
 * subscription to yet, and bouncing through checkout first would lose the
 * choice of plan.
 */
export function CheckoutButton({
  tier,
  interval = "monthly",
  highlight,
  children,
}: {
  /** Absent for Enterprise, which is a conversation rather than a checkout. */
  tier?: PurchasableTier
  interval?: BillingInterval
  highlight?: boolean
  children?: React.ReactNode
}) {
  const { user, isLoading } = useSession()
  const catalogue = useBillingCatalogue()
  const checkout = useStartCheckout()

  const variant = highlight ? "default" : "outline"
  const className = "mt-6 w-full rounded-full"

  if (!tier) {
    return (
      <Button asChild className={className} variant={variant}>
        <Link href="/contact">Talk to us</Link>
      </Button>
    )
  }

  // While the session resolves, render the signed-out affordance rather than a
  // spinner — it is correct for most visitors and never flashes a wrong label.
  if (isLoading || !user) {
    return (
      <Button asChild className={className} variant={variant}>
        <Link href={`/auth?next=${encodeURIComponent("/pricing")}`}>
          {children ?? "Get started"}
        </Link>
      </Button>
    )
  }

  const providers = catalogue.data?.providers
  const available = pickProvider(providers)

  async function buy() {
    if (!available || !tier) return

    try {
      await checkout.mutateAsync({ provider: available, tier, interval })
      // On success the browser leaves for the processor, so nothing follows.
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  // No processor configured on this deployment: say so rather than offering a
  // button that 503s.
  if (catalogue.isFetched && !available) {
    return (
      <Button className={className} variant={variant} disabled>
        Unavailable
      </Button>
    )
  }

  return (
    <Button
      className={className}
      variant={variant}
      onClick={buy}
      disabled={checkout.isPending || !catalogue.isFetched}
    >
      {checkout.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children ?? "Upgrade"}
    </Button>
  )
}

/**
 * Which processor to send this customer to.
 *
 * Stripe first where both are live, because its hosted checkout handles more
 * card networks. Paystack is the fallback and the only option across much of
 * Africa, where Stripe has poor acceptance rates. A per-country choice would be
 * better still and is the obvious next refinement.
 */
function pickProvider(
  providers: { stripe: boolean; paystack: boolean } | undefined
): BillingProvider | null {
  if (!providers) return null
  if (providers.stripe) return "stripe"
  if (providers.paystack) return "paystack"

  return null
}
