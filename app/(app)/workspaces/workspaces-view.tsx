"use client"

import * as React from "react"
import Link from "next/link"
import { Building2, Loader2, LogOut, Plus, Ticket, Users } from "lucide-react"
import { toast } from "sonner"

import { PlanGate } from "@/components/plan-gate"
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
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Skeleton } from "@/components/ui/skeleton"
import { getErrorMessage } from "@/lib/api/errors"
import type { WorkspaceKind } from "@/lib/api/admin-types"
import {
  useAcceptInvite,
  useCreateWorkspace,
  useLeaveWorkspace,
  useMyInvites,
  useTeamsAccess,
  useWorkspaces,
} from "@/lib/hooks/use-workspaces"
import { PageHeader } from "@/components/PageHeader"

const ROLE_TONE: Record<string, string> = {
  owner: "bg-primary/15 text-primary border-primary/30",
  admin:
    "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400",
  member: "",
}

export function WorkspacesView() {
  const access = useTeamsAccess()
  const allowed = access.data?.allowed ?? false

  const workspaces = useWorkspaces()
  const invites = useMyInvites()

  return (
    <div className="space-y-6">
      <div className="flex w-full flex-col items-start justify-between gap-2 lg:flex-row lg:items-center">
        <PageHeader
          title="Teams"
          back
          description="Shared workspaces for a family or an organisation."
        />
        {allowed && <CreateWorkspaceDialog />}
      </div>

      {access.isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : !allowed && access.data ? (
        <PlanGate
          access={access.data}
          feature="Teams"
          description="Create a shared workspace, invite members, and manage who can do what."
        />
      ) : (
        <>
          {invites.data && invites.data.length > 0 && (
            <PendingInvites invites={invites.data} />
          )}

          {workspaces.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
          ) : workspaces.data && workspaces.data.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {workspaces.data.map((workspace) => (
                <Card key={workspace.id} className="overflow-hidden">
                  <CardContent className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={`/workspaces/${workspace.id}`}
                        className="min-w-0 flex-1"
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="truncate font-medium">
                            {workspace.name}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground capitalize">
                          {workspace.kind} ·{" "}
                          {workspace.memberCount === 1
                            ? "1 member"
                            : `${workspace.memberCount} members`}
                        </p>
                      </Link>
                      <Badge
                        variant="outline"
                        className={ROLE_TONE[workspace.myRole]}
                      >
                        {workspace.myRole}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/workspaces/${workspace.id}`}>Manage</Link>
                      </Button>
                      {!workspace.isOwner && (
                        <LeaveButton id={workspace.id} name={workspace.name} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Users />
                    </EmptyMedia>
                    <EmptyTitle>No teams yet</EmptyTitle>
                    <EmptyDescription>
                      Create a workspace to share schedules with your family or
                      your organisation.
                    </EmptyDescription>
                  </EmptyHeader>
                  <CreateWorkspaceDialog />
                </Empty>
              </CardContent>
            </Card>
          )}

          <JoinByCode />
        </>
      )}
    </div>
  )
}

function CreateWorkspaceDialog() {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [kind, setKind] = React.useState<WorkspaceKind>("family")
  const create = useCreateWorkspace()

  function submit(event: React.FormEvent) {
    event.preventDefault()

    create.mutate(
      { name: name.trim(), kind },
      {
        onSuccess: (workspace) => {
          toast.success(`${workspace.name} created`)
          setOpen(false)
          setName("")
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <Plus className="mr-1.5 h-4 w-4" />
          New team
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Create a team</DialogTitle>
            <DialogDescription>
              You&apos;ll be its owner. You can invite people straight after.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Field>
              <FieldLabel htmlFor="ws-name">Name</FieldLabel>
              <Input
                id="ws-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="The Okonkwos"
                maxLength={120}
                autoFocus
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="ws-kind">Kind</FieldLabel>
              <NativeSelect
                id="ws-kind"
                value={kind}
                onChange={(event) =>
                  setKind(event.target.value as WorkspaceKind)
                }
              >
                <option value="family">Family</option>
                <option value="enterprise">Enterprise</option>
              </NativeSelect>
              <FieldDescription>
                Only affects how the team is labelled.
              </FieldDescription>
            </Field>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={!name.trim() || create.isPending}
              className="rounded-full"
            >
              {create.isPending && (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              )}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PendingInvites({
  invites,
}: {
  invites: NonNullable<ReturnType<typeof useMyInvites>["data"]>
}) {
  const accept = useAcceptInvite()

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Ticket className="h-4 w-4 text-primary" />
          {invites.length === 1
            ? "You have an invitation"
            : `You have ${invites.length} invitations`}
        </div>

        {invites.map((invite) => (
          <div
            key={invite.id}
            className="flex flex-wrap items-center justify-between gap-3 text-sm"
          >
            <div className="min-w-0">
              <span className="font-medium">{invite.workspace.name}</span>
              <span className="text-muted-foreground"> · as {invite.role}</span>
            </div>
            <Button
              size="sm"
              className="rounded-full"
              disabled={accept.isPending}
              onClick={() =>
                accept.mutate(invite.code, {
                  onSuccess: () =>
                    toast.success(`Joined ${invite.workspace.name}`),
                  onError: (error) => toast.error(getErrorMessage(error)),
                })
              }
            >
              Accept
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/**
 * Manual code entry, kept because invites are not emailed in this build — the
 * code has to travel by whatever channel the inviter chooses.
 */
function JoinByCode() {
  const [code, setCode] = React.useState("")
  const accept = useAcceptInvite()

  function submit(event: React.FormEvent) {
    event.preventDefault()

    accept.mutate(code.trim(), {
      onSuccess: () => {
        toast.success("Joined the team")
        setCode("")
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    })
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={submit} className="space-y-3">
          <Field>
            <FieldLabel htmlFor="join-code">Have an invite code?</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="join-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Paste it here"
                autoComplete="off"
                spellCheck={false}
                maxLength={64}
              />
              <Button
                type="submit"
                variant="outline"
                disabled={code.trim().length < 4 || accept.isPending}
              >
                {accept.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Join"
                )}
              </Button>
            </div>
            <FieldDescription>
              Codes expire fourteen days after they are created.
            </FieldDescription>
          </Field>
        </form>
      </CardContent>
    </Card>
  )
}

function LeaveButton({ id, name }: { id: string; name: string }) {
  const leave = useLeaveWorkspace()

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-muted-foreground">
          <LogOut className="mr-1.5 h-4 w-4" />
          Leave
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;ll lose access to the team. Someone will have to invite you
            again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              leave.mutate(id, {
                onSuccess: () => toast.success(`Left ${name}`),
                onError: (error) => toast.error(getErrorMessage(error)),
              })
            }
          >
            Leave
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
