"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getErrorMessage } from "@/lib/api/errors"
import {
  formatMinor,
  useBillingCatalogue,
  useStartCheckout,
  type BillingProvider,
} from "@/lib/hooks/use-billing"

/**
 * The paywall the PRD asks for: warm, not a wall.
 *
 * Shown when the API answers FREEMIUM_LIMIT. Before this existed the rejection
 * was a red toast reading "Upgrade to create more" with nowhere to upgrade,
 * which is the worst of both — it named the limit and hid the way past it.
 */
export function UpgradeDialog({
  open,
  onOpenChange,
  reason,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** What the user was trying to do when they hit the limit. */
  reason?: string
}) {
  const catalogue = useBillingCatalogue()
  const checkout = useStartCheckout()
  const router = useRouter()

  const individual = catalogue.data?.plans.find(
    (plan) => plan.tier === "individual"
  )
  const provider = pickProvider(catalogue.data?.providers)

  async function upgrade() {
    if (!provider) {
      // No processor configured — send them to pricing rather than dead-ending.
      router.push("/pricing")
      return
    }

    try {
      await checkout.mutateAsync({
        provider,
        tier: "individual",
        interval: "monthly",
      })
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span
            aria-hidden
            className="bg-primary/10 text-primary mb-1 grid h-11 w-11 place-items-center rounded-full"
          >
            <Sparkles className="h-5 w-5" />
          </span>
          <DialogTitle>You&apos;ve used your free schedule</DialogTitle>
          <DialogDescription>
            {reason ??
              "Your trial includes one schedule. Upgrade to keep adding them — everything you've already created stays exactly as it is."}
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 text-sm">
          {[
            "Unlimited schedules",
            "Warm AI follow-ups after every event",
            "Calendar sync and Google Meet links",
          ].map((line) => (
            <li key={line} className="flex items-start gap-2">
              <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
              <span>{line}</span>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Not now
          </Button>
          <Button
            type="button"
            onClick={upgrade}
            disabled={checkout.isPending || catalogue.isLoading}
          >
            {checkout.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {individual
              ? `Upgrade — ${formatMinor(individual.monthlyMinor)}/mo`
              : "See plans"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function pickProvider(
  providers: { stripe: boolean; paystack: boolean } | undefined
): BillingProvider | null {
  if (!providers) return null
  if (providers.stripe) return "stripe"
  if (providers.paystack) return "paystack"

  return null
}
