import type { Metadata } from "next"
import Link from "next/link"
import { Check } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PLANS } from "@/lib/marketing-content"
import { CheckoutButton } from "./checkout-button"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Pricing — Laterr",
  description:
    "Simple plans for individuals, families, teams and enterprises. Start with one free schedule.",
  openGraph: { title: "Pricing — Laterr" },
  alternates: { canonical: "/pricing" },
}

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="font-heading text-4xl md:text-5xl">
          Pricing that stays out of the way
        </h1>
        <p className="text-muted-foreground mt-4">
          Every account starts with one free schedule across any category. Move
          up when you need more — annual billing is cheaper on every tier.
        </p>
      </header>

      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={cn(
              "flex flex-col",
              plan.highlight && "border-primary/50 ring-primary/20 ring-2"
            )}
          >
            <CardContent className="flex flex-1 flex-col">
              <div className="flex items-center justify-between gap-2">
                <p className="font-heading text-xl">{plan.name}</p>
                {plan.highlight && <Badge>Most popular</Badge>}
              </div>

              <p className="mt-4">
                <span className="font-heading text-3xl">{plan.price}</span>
                <span className="text-muted-foreground text-sm">
                  {plan.period}
                </span>
              </p>
              <p className="text-muted-foreground text-xs">{plan.yearly}</p>

              <ul className="mt-6 flex-1 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <CheckoutButton tier={plan.tier} highlight={plan.highlight} />
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-muted-foreground mt-10 text-center text-sm">
        Prices in USD. Card and bank payments handled by Stripe globally and
        Paystack across Africa.{" "}
        <Link href="/faq" className="text-foreground underline">
          Questions?
        </Link>
      </p>
    </div>
  )
}
