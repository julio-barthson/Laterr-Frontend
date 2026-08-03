"use client"

import * as React from "react"
import {
  Ban,
  Check,
  Loader2,
  ScrollText,
  ShieldAlert,
  Trash2,
  Users,
  X,
} from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type {
  AdminRoleRequest,
  AdminUser,
  AuditEntry,
  RequestableRole,
} from "@/lib/api/admin-types"
import type { PlanTier, SubStatus } from "@/lib/api/domain-types"
import { getErrorMessage } from "@/lib/api/errors"
import {
  useAdminAuditLog,
  useAdminDeleteSchedule,
  useAdminRoleRequests,
  useAdminSchedules,
  useAdminStats,
  useAdminUsers,
  useDecideRoleRequest,
  useIsAdmin,
  useSetUserRole,
  useUpdateUserSubscription,
} from "@/lib/hooks/use-admin"

const PLANS: PlanTier[] = [
  "trial",
  "individual",
  "family",
  "business",
  "enterprise",
]

const STATUSES: SubStatus[] = [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "incomplete",
]

export function AdminView() {
  const { data: access, isLoading } = useIsAdmin()
  const isAdmin = access?.isAdmin ?? false

  const stats = useAdminStats(isAdmin)

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-2">
        <ShieldAlert className="text-primary h-6 w-6" />
        <div>
          <h1 className="font-heading text-3xl">Admin</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Users, role requests, and content moderation.
          </p>
        </div>
      </header>

      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : !isAdmin ? (
        <NoAccess />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Users"
              value={stats.data?.users}
              hint={
                stats.data ? `+${stats.data.newUsers7d} in 7 days` : undefined
              }
            />
            <StatCard
              label="Schedules"
              value={stats.data?.schedules}
              hint={
                stats.data
                  ? `+${stats.data.newSchedules7d} in 7 days`
                  : undefined
              }
            />
            <StatCard
              label="Bookings"
              value={stats.data?.bookings}
              hint={
                stats.data
                  ? `${stats.data.bookingRequests} time requests`
                  : undefined
              }
            />
            <StatCard
              label="Pending requests"
              value={stats.data?.pendingRoleRequests}
              hint={stats.data ? `${stats.data.workspaces} teams` : undefined}
            />
          </div>

          <Tabs defaultValue="requests">
            <TabsList>
              <TabsTrigger value="requests">Role requests</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="schedules">Schedules</TabsTrigger>
              <TabsTrigger value="audit">Audit log</TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="mt-4">
              <RoleRequestsPanel />
            </TabsContent>
            <TabsContent value="users" className="mt-4">
              <UsersPanel />
            </TabsContent>
            <TabsContent value="schedules" className="mt-4">
              <SchedulesPanel />
            </TabsContent>
            <TabsContent value="audit" className="mt-4">
              <AuditPanel />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

function NoAccess() {
  return (
    <Card>
      <CardContent className="py-10">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Ban />
            </EmptyMedia>
            <EmptyTitle>Admin access required</EmptyTitle>
            <EmptyDescription>
              You don&apos;t have the admin role. You can request it from the
              Roles page.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </CardContent>
    </Card>
  )
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: number | undefined
  hint?: string
}) {
  return (
    <Card>
      <CardContent>
        <p className="text-muted-foreground text-xs uppercase tracking-wide">
          {label}
        </p>
        {value === undefined ? (
          <Skeleton className="mt-2 h-8 w-16" />
        ) : (
          <p className="font-heading mt-1 text-3xl">
            {value.toLocaleString()}
          </p>
        )}
        {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
      </CardContent>
    </Card>
  )
}

function RoleRequestsPanel() {
  const { data, isLoading } = useAdminRoleRequests(true)

  const pending = (data ?? []).filter((row) => row.status === "pending")
  const resolved = (data ?? []).filter((row) => row.status !== "pending")

  if (isLoading) {
    return <Skeleton className="h-40 w-full rounded-xl" />
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Awaiting a decision</CardTitle>
          <CardDescription>
            Approving grants the role immediately.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {pending.length === 0 ? (
            <p className="text-muted-foreground py-4 text-sm">
              Nothing to review.
            </p>
          ) : (
            pending.map((request) => (
              <PendingRequestRow key={request.id} request={request} />
            ))
          )}
        </CardContent>
      </Card>

      {resolved.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently decided</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {resolved.slice(0, 20).map((request) => (
              <div
                key={request.id}
                className="flex flex-wrap items-center gap-2 border-b py-2 text-sm last:border-0"
              >
                <span className="min-w-0 flex-1 truncate">
                  {request.displayName ?? request.email}
                </span>
                <Badge variant="outline">{request.requestedRole}</Badge>
                <Badge variant="outline" className="capitalize">
                  {request.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function PendingRequestRow({ request }: { request: AdminRoleRequest }) {
  const [note, setNote] = React.useState("")
  const decide = useDecideRoleRequest()

  function submit(decision: "approved" | "denied") {
    decide.mutate(
      { id: request.id, decision, note: note.trim() || undefined },
      {
        onSuccess: () =>
          toast.success(
            decision === "approved" ? "Role granted" : "Request denied"
          ),
        onError: (error) => toast.error(getErrorMessage(error)),
      }
    )
  }

  return (
    <div className="space-y-2 border-b py-3 last:border-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {request.displayName ?? request.username ?? request.email}
        </span>
        <Badge variant="outline">{request.requestedRole}</Badge>
      </div>

      <p className="text-muted-foreground text-xs">{request.email}</p>

      {request.reason && <p className="text-sm">{request.reason}</p>}

      <div className="flex flex-wrap items-end gap-2">
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={1}
          maxLength={1000}
          placeholder="Note to the requester (optional)"
          className="min-w-48 flex-1"
          aria-label={`Decision note for ${request.email}`}
        />
        <Button
          size="sm"
          disabled={decide.isPending}
          onClick={() => submit("approved")}
        >
          {decide.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-1.5 h-4 w-4" />
          )}
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={decide.isPending}
          onClick={() => submit("denied")}
        >
          <X className="mr-1.5 h-4 w-4" />
          Deny
        </Button>
      </div>
    </div>
  )
}

function UsersPanel() {
  const { data, isLoading } = useAdminUsers(true)
  const [query, setQuery] = React.useState("")

  const needle = query.trim().toLowerCase()
  const users = (data ?? []).filter((user) =>
    needle.length === 0
      ? true
      : `${user.email} ${user.displayName ?? ""} ${user.username ?? ""}`
          .toLowerCase()
          .includes(needle)
  )

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-xl" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>
          Most recent 500 accounts. {users.length} shown.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by email, name, or username"
          aria-label="Search users"
        />

        {users.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyTitle>No matches</EmptyTitle>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.slice(0, 100).map((user) => (
                  <UserRow key={user.id} user={user} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function UserRow({ user }: { user: AdminUser }) {
  const setRole = useSetUserRole()
  const setSubscription = useUpdateUserSubscription()

  const plan = user.subscription?.plan ?? "trial"
  const status = user.subscription?.status ?? "trialing"

  return (
    <TableRow>
      <TableCell className="max-w-56">
        <div className="truncate text-sm font-medium">
          {user.displayName ?? user.username ?? "—"}
        </div>
        <div className="text-muted-foreground truncate text-xs">
          {user.email}
        </div>
      </TableCell>

      <TableCell>
        <div className="flex flex-wrap gap-1">
          {user.roles.map((role) => (
            <Badge key={role} variant="outline" className="text-xs">
              {role}
            </Badge>
          ))}
        </div>
      </TableCell>

      <TableCell>
        <div className="flex gap-1">
          <NativeSelect
            aria-label={`Plan for ${user.email}`}
            className="w-28 text-xs"
            value={plan}
            disabled={setSubscription.isPending}
            onChange={(event) =>
              setSubscription.mutate(
                {
                  userId: user.id,
                  plan: event.target.value as PlanTier,
                  status,
                },
                {
                  onSuccess: () => toast.success("Plan updated"),
                  onError: (error) => toast.error(getErrorMessage(error)),
                }
              )
            }
          >
            {PLANS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </NativeSelect>

          <NativeSelect
            aria-label={`Subscription status for ${user.email}`}
            className="w-28 text-xs"
            value={status}
            disabled={setSubscription.isPending}
            onChange={(event) =>
              setSubscription.mutate(
                {
                  userId: user.id,
                  plan,
                  status: event.target.value as SubStatus,
                },
                {
                  onSuccess: () => toast.success("Status updated"),
                  onError: (error) => toast.error(getErrorMessage(error)),
                }
              )
            }
          >
            {STATUSES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </NativeSelect>
        </div>
      </TableCell>

      <TableCell className="text-right">
        {/* `owner` is absent by design — the server refuses to grant platform
            ownership through this route, so it isn't offered. */}
        {(["admin", "executive_staff"] as RequestableRole[]).map((role) => {
          const held = user.roles.includes(role)

          return (
            <Button
              key={role}
              size="sm"
              variant="ghost"
              className="text-xs"
              disabled={setRole.isPending}
              onClick={() =>
                setRole.mutate(
                  {
                    userId: user.id,
                    role,
                    action: held ? "revoke" : "grant",
                  },
                  {
                    onSuccess: () =>
                      toast.success(
                        held ? `Revoked ${role}` : `Granted ${role}`
                      ),
                    onError: (error) => toast.error(getErrorMessage(error)),
                  }
                )
              }
            >
              {held ? `− ${role}` : `+ ${role}`}
            </Button>
          )
        })}
      </TableCell>
    </TableRow>
  )
}

function SchedulesPanel() {
  const { data, isLoading } = useAdminSchedules(true)
  const remove = useAdminDeleteSchedule()

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-xl" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedules</CardTitle>
        <CardDescription>
          Most recent 200 across every account, for moderation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {(data ?? []).length === 0 ? (
          <p className="text-muted-foreground py-4 text-sm">
            No schedules yet.
          </p>
        ) : (
          (data ?? []).map((schedule) => (
            <div
              key={schedule.id}
              className="flex flex-wrap items-center gap-2 border-b py-2 text-sm last:border-0"
            >
              <span className="min-w-0 flex-1 truncate">{schedule.title}</span>
              <Badge variant="outline" className="text-xs capitalize">
                {schedule.category}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">
                {schedule.status}
              </Badge>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Delete ${schedule.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete “{schedule.title}”?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes another user&apos;s schedule. It is recorded
                      in the audit log and cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        remove.mutate(schedule.id, {
                          onSuccess: () => toast.success("Schedule deleted"),
                          onError: (error) =>
                            toast.error(getErrorMessage(error)),
                        })
                      }
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

/**
 * The audit trail.
 *
 * Renders the actor, which the owner console's equivalent does not — it shows
 * only the target, truncated to eight hex characters. "Who did this" is the
 * first question anyone brings to an audit log, so it leads with that.
 */
function AuditPanel() {
  const { data, isLoading } = useAdminAuditLog(true)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="h-4 w-4" />
          Audit log
        </CardTitle>
        <CardDescription>
          Append-only. Written by the server on every privileged action — there
          is no route that edits or deletes an entry.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-0">
        {isLoading && <Skeleton className="h-40 w-full rounded-lg" />}

        {!isLoading && (data ?? []).length === 0 && (
          <p className="text-muted-foreground py-2 text-sm">
            Nothing recorded yet. Granting a role, changing a plan or deleting a
            schedule will appear here.
          </p>
        )}

        {(data ?? []).map((entry) => (
          <AuditRow key={entry.id} entry={entry} />
        ))}
      </CardContent>
    </Card>
  )
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  const hasMetadata =
    entry.metadata !== null && Object.keys(entry.metadata).length > 0

  return (
    <div className="border-border/60 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-b py-2.5 text-sm last:border-0">
      <span className="font-medium">{describeParty(entry.actor)}</span>

      <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
        {entry.action}
      </code>

      {entry.target && (
        <>
          <span className="text-muted-foreground text-xs">→</span>
          <span className="truncate text-xs">
            {describeParty(entry.target)}
          </span>
        </>
      )}

      {/* A recorded target whose account has since been deleted. Saying so is
          more useful than dropping the arrow and implying there was none. */}
      {!entry.target && entry.targetUserId && (
        <span className="text-muted-foreground text-xs">
          → deleted account
        </span>
      )}

      <time
        dateTime={entry.createdAt}
        className="text-muted-foreground ml-auto text-xs"
        title={new Date(entry.createdAt).toISOString()}
      >
        {new Date(entry.createdAt).toLocaleString()}
      </time>

      {hasMetadata && (
        <p className="text-muted-foreground w-full font-mono text-xs">
          {JSON.stringify(entry.metadata)}
        </p>
      )}
    </div>
  )
}

/** Prefer a name, fall back to the address, then to "deleted account". */
function describeParty(party: AuditEntry["actor"]): string {
  if (!party) return "deleted account"

  return party.displayName ?? party.username ?? party.email
}
