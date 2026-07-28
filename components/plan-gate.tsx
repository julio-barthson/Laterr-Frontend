"use client"

import Link from "next/link"
import { Lock, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import type { PlanAccess } from "@/lib/api/admin-types"

/**
 * The Business-plan wall shown in place of Teams and Roles.
 *
 * The server refuses the write regardless — this only saves the user a round
 * trip and explains why. It reports the plan the API actually returned rather
 * than guessing from the session, so an operator who upgraded a user by hand
 * sees the change without signing out.
 */
export function PlanGate({
  access,
  feature,
  description,
}: {
  access: PlanAccess
  feature: string
  description: string
}) {
  return (
    <Card>
      <CardContent className="py-10">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Lock />
            </EmptyMedia>
            <EmptyTitle>{feature} is on the Business plan</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
          </EmptyHeader>

          <div className="flex flex-col items-center gap-3">
            <p className="text-muted-foreground text-xs">
              You&apos;re on the{" "}
              <span className="text-foreground font-medium capitalize">
                {access.plan}
              </span>{" "}
              plan
              {access.status !== "active" && ` (${access.status})`}.
            </p>
            <Button asChild className="rounded-full">
              <Link href="/pricing">
                <Sparkles className="mr-1.5 h-4 w-4" />
                See plans
              </Link>
            </Button>
          </div>
        </Empty>
      </CardContent>
    </Card>
  )
}
