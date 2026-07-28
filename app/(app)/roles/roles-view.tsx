"use client"

import * as React from "react"
import { Loader2, ShieldCheck, X } from "lucide-react"
import { toast } from "sonner"

import { PlanGate } from "@/components/plan-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { NativeSelect } from "@/components/ui/native-select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import type {
  RequestableRole,
  RoleRequestStatus,
} from "@/lib/api/admin-types"
import { getErrorMessage } from "@/lib/api/errors"
import {
  useCancelRoleRequest,
  useCreateRoleRequest,
  useMyRoleRequests,
  useMyRoles,
  useRolesAccess,
} from "@/lib/hooks/use-roles"

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  member: "Member",
  executive_staff: "Executive staff",
  owner: "Platform owner",
}

const ROLE_BLURB: Record<RequestableRole, string> = {
  admin: "Moderate the platform: users, schedules, and role requests.",
  member: "The standard role every account starts with.",
  executive_staff: "Elevated read access for operations staff.",
}

const STATUS_TONE: Record<RoleRequestStatus, string> = {
  pending: "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400",
  approved:
    "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
  denied: "bg-destructive/15 text-destructive border-destructive/30",
  cancelled: "",
}

export function RolesView() {
  const access = useRolesAccess()
  const allowed = access.data?.allowed ?? false

  const roles = useMyRoles()
  const requests = useMyRoleRequests()

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl">Roles</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          What you can do on Laterr, and how to ask for more.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Your roles</CardTitle>
          <CardDescription>Granted by a platform admin.</CardDescription>
        </CardHeader>
        <CardContent>
          {roles.isLoading ? (
            <Skeleton className="h-6 w-40" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {(roles.data ?? []).map((row) => (
                <Badge key={row.role} variant="outline">
                  {ROLE_LABEL[row.role] ?? row.role}
                </Badge>
              ))}
              {roles.data?.length === 0 && (
                <span className="text-muted-foreground text-sm">
                  No roles yet.
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {access.isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : !allowed && access.data ? (
        <PlanGate
          access={access.data}
          feature="Role requests"
          description="Ask for elevated access and track the decision."
        />
      ) : (
        <>
          <RequestForm held={(roles.data ?? []).map((row) => row.role)} />

          <Card>
            <CardHeader>
              <CardTitle>Your requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {requests.isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : requests.data && requests.data.length > 0 ? (
                requests.data.map((request) => (
                  <RequestRow key={request.id} request={request} />
                ))
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ShieldCheck />
                    </EmptyMedia>
                    <EmptyTitle>No requests</EmptyTitle>
                    <EmptyDescription>
                      Ask for a role above and an admin will review it.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function RequestForm({ held }: { held: string[] }) {
  const [role, setRole] = React.useState<RequestableRole>("admin")
  const [reason, setReason] = React.useState("")
  const create = useCreateRoleRequest()

  // Asking for a role you already hold is refused by the server; don't offer it.
  const options = (
    ["admin", "executive_staff", "member"] as RequestableRole[]
  ).filter((option) => !held.includes(option))

  if (options.length === 0) {
    return null
  }

  // Derived rather than synced by an effect: the list shrinks the moment a
  // request is approved, and an effect would leave one render pointing at a role
  // that is no longer offered.
  const selected = options.includes(role) ? role : options[0]

  function submit(event: React.FormEvent) {
    event.preventDefault()

    create.mutate(
      { requestedRole: selected, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Request submitted")
          setReason("")
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      }
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request a role</CardTitle>
        <CardDescription>
          An admin reviews every request. You&apos;ll see the decision here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="role">Role</FieldLabel>
            <NativeSelect
              id="role"
              value={selected}
              onChange={(event) =>
                setRole(event.target.value as RequestableRole)
              }
            >
              {options.map((option) => (
                <option key={option} value={option}>
                  {ROLE_LABEL[option]}
                </option>
              ))}
            </NativeSelect>
            <FieldDescription>{ROLE_BLURB[selected]}</FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="reason">Why do you need it?</FieldLabel>
            <Textarea
              id="reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Optional, but it helps."
            />
          </Field>

          <Button
            type="submit"
            className="rounded-full"
            disabled={create.isPending}
          >
            {create.isPending && (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            )}
            Submit request
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function RequestRow({
  request,
}: {
  request: NonNullable<ReturnType<typeof useMyRoleRequests>["data"]>[number]
}) {
  const cancel = useCancelRoleRequest()

  return (
    <div className="flex flex-wrap items-center gap-3 border-b py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {ROLE_LABEL[request.requestedRole] ?? request.requestedRole}
          </span>
          <Badge variant="outline" className={STATUS_TONE[request.status]}>
            {request.status}
          </Badge>
        </div>
        {request.reason && (
          <p className="text-muted-foreground mt-1 text-xs">{request.reason}</p>
        )}
        {request.decisionNote && (
          <p className="mt-1 text-xs">
            <span className="text-muted-foreground">Admin note: </span>
            {request.decisionNote}
          </p>
        )}
        <p className="text-muted-foreground mt-1 text-xs">
          Asked {new Date(request.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Cancelling is the only self-service write on a request, and only while
          it is pending — the server enforces both. */}
      {request.status === "pending" && (
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground"
          disabled={cancel.isPending}
          onClick={() =>
            cancel.mutate(request.id, {
              onSuccess: () => toast.success("Request cancelled"),
              onError: (error) => toast.error(getErrorMessage(error)),
            })
          }
        >
          <X className="mr-1.5 h-4 w-4" />
          Cancel
        </Button>
      )}
    </div>
  )
}
