"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Check,
  Copy,
  Crown,
  Loader2,
  Mail,
  Trash2,
  UserMinus,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import type {
  WorkspaceDetail,
  WorkspaceInvite,
  WorkspaceMember,
  WorkspaceRole,
} from "@/lib/api/admin-types"
import { getErrorMessage } from "@/lib/api/errors"
import {
  useDeleteWorkspace,
  useInviteToWorkspace,
  useRemoveMember,
  useRenameWorkspace,
  useRevokeInvite,
  useUpdateMemberRole,
  useWorkspace,
} from "@/lib/hooks/use-workspaces"

export function WorkspaceDetailView({ id }: { id: string }) {
  const { data, isLoading, error } = useWorkspace(id)

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/workspaces">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            All teams
          </Link>
        </Button>
        <h1 className="font-heading text-3xl">
          {data?.name ?? (isLoading ? "Loading…" : "Team")}
        </h1>
        {data && (
          <p className="text-muted-foreground mt-1 text-sm capitalize">
            {data.kind} team · you are {data.myRole}
          </p>
        )}
      </div>

      {isLoading ? (
        <>
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </>
      ) : error ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="font-medium">This team isn&apos;t available</p>
            <p className="text-muted-foreground mt-1 text-sm">
              It may have been deleted, or you may no longer be a member.
            </p>
          </CardContent>
        </Card>
      ) : data ? (
        // Keyed on the workspace id so switching teams re-seeds the rename
        // draft from a fresh useState initialiser rather than an effect.
        <WorkspaceBody key={data.id} workspace={data} />
      ) : null}
    </div>
  )
}

function WorkspaceBody({ workspace }: { workspace: WorkspaceDetail }) {
  const canManage = workspace.myRole === "owner" || workspace.myRole === "admin"

  return (
    <>
      <MembersCard workspace={workspace} canManage={canManage} />
      {canManage && <InvitesCard workspace={workspace} />}
      {workspace.isOwner && <OwnerSettingsCard workspace={workspace} />}
    </>
  )
}

function MembersCard({
  workspace,
  canManage,
}: {
  workspace: WorkspaceDetail
  canManage: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
        <CardDescription>
          {workspace.members.length === 1
            ? "1 person"
            : `${workspace.members.length} people`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {workspace.members.map((member) => (
          <MemberRow
            key={member.id}
            workspaceId={workspace.id}
            member={member}
            canManage={canManage}
            viewerIsWorkspaceOwner={workspace.isOwner}
          />
        ))}
      </CardContent>
    </Card>
  )
}

function MemberRow({
  workspaceId,
  member,
  canManage,
  viewerIsWorkspaceOwner,
}: {
  workspaceId: string
  member: WorkspaceMember
  canManage: boolean
  viewerIsWorkspaceOwner: boolean
}) {
  const updateRole = useUpdateMemberRole(workspaceId)
  const remove = useRemoveMember(workspaceId)

  const label = member.displayName ?? member.username ?? member.email
  const initials = label.slice(0, 2).toUpperCase()

  /**
   * The server is the authority here — see the escalation rules on
   * `WorkspacesService.updateMemberRole`. The UI mirrors them so a workspace
   * admin isn't offered a control that will 403, and so the workspace owner's
   * row reads as structural rather than editable.
   */
  const editable = canManage && !member.isWorkspaceOwner
  const removable = editable

  return (
    <div className="flex flex-wrap items-center gap-3 py-2">
      <Avatar className="h-9 w-9">
        {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt="" />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">{label}</span>
          {member.isWorkspaceOwner && (
            <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          )}
        </div>
        <p className="text-muted-foreground truncate text-xs">{member.email}</p>
      </div>

      {editable ? (
        <NativeSelect
          aria-label={`Role for ${label}`}
          className="w-32"
          value={member.role === "owner" ? "admin" : member.role}
          disabled={updateRole.isPending}
          onChange={(event) =>
            updateRole.mutate(
              {
                memberId: member.id,
                role: event.target.value as "admin" | "member",
              },
              {
                onSuccess: () => toast.success(`Updated ${label}`),
                onError: (error) => toast.error(getErrorMessage(error)),
              }
            )
          }
        >
          <option value="admin">Admin</option>
          <option value="member">Member</option>
        </NativeSelect>
      ) : (
        <Badge variant="outline" className="capitalize">
          {member.role}
        </Badge>
      )}

      {removable && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              aria-label={`Remove ${label}`}
            >
              <UserMinus className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove {label}?</AlertDialogTitle>
              <AlertDialogDescription>
                They lose access to this team immediately. Their own schedules
                are untouched.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  remove.mutate(member.id, {
                    onSuccess: () => toast.success(`Removed ${label}`),
                    onError: (error) => toast.error(getErrorMessage(error)),
                  })
                }
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {member.isWorkspaceOwner && !viewerIsWorkspaceOwner && (
        <span className="text-muted-foreground text-xs">Team owner</span>
      )}
    </div>
  )
}

function InvitesCard({ workspace }: { workspace: WorkspaceDetail }) {
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState<WorkspaceRole>("member")
  const invite = useInviteToWorkspace(workspace.id)

  const pending = workspace.invites.filter((row) => row.status === "pending")

  function submit(event: React.FormEvent) {
    event.preventDefault()

    invite.mutate(
      { email: email.trim().toLowerCase(), role },
      {
        onSuccess: () => {
          toast.success("Invite created")
          setEmail("")
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      }
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invites</CardTitle>
        <CardDescription>
          Laterr doesn&apos;t email invites yet — copy the code and send it
          yourself.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
          <Field className="min-w-48 flex-1">
            <FieldLabel htmlFor="invite-email">Email</FieldLabel>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="them@example.com"
              maxLength={200}
            />
          </Field>

          <Field className="w-32">
            <FieldLabel htmlFor="invite-role">Role</FieldLabel>
            <NativeSelect
              id="invite-role"
              value={role}
              onChange={(event) =>
                setRole(event.target.value as WorkspaceRole)
              }
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              {/* Only a team owner may hand out ownership; the server refuses
                  it from an admin, so the option isn't offered to one. */}
              {workspace.isOwner && <option value="owner">Owner</option>}
            </NativeSelect>
          </Field>

          <Button
            type="submit"
            variant="outline"
            disabled={!email.includes("@") || invite.isPending}
          >
            {invite.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Mail className="mr-1.5 h-4 w-4" />
                Invite
              </>
            )}
          </Button>
        </form>

        {pending.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              {pending.map((row) => (
                <InviteRow
                  key={row.id}
                  workspaceId={workspace.id}
                  invite={row}
                />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function InviteRow({
  workspaceId,
  invite,
}: {
  workspaceId: string
  invite: WorkspaceInvite
}) {
  const revoke = useRevokeInvite(workspaceId)
  const [copied, setCopied] = React.useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(invite.code)
      setCopied(true)
      toast.success("Code copied")
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Couldn't copy — select the code and copy it manually.")
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <div className="min-w-0 flex-1">
        <span className="truncate">{invite.invitedEmail}</span>
        <span className="text-muted-foreground"> · {invite.role}</span>
        <p className="text-muted-foreground text-xs">
          Expires {new Date(invite.expiresAt).toLocaleDateString()}
        </p>
      </div>

      <code className="bg-muted rounded px-2 py-1 font-mono text-xs">
        {invite.code}
      </code>

      <Button
        size="icon"
        variant="ghost"
        onClick={() => void copy()}
        aria-label="Copy invite code"
      >
        {copied ? (
          <Check className="h-4 w-4 text-emerald-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>

      <Button
        size="icon"
        variant="ghost"
        className="text-muted-foreground hover:text-destructive"
        aria-label={`Revoke invite for ${invite.invitedEmail}`}
        disabled={revoke.isPending}
        onClick={() =>
          revoke.mutate(invite.id, {
            onSuccess: () => toast.success("Invite revoked"),
            onError: (error) => toast.error(getErrorMessage(error)),
          })
        }
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

function OwnerSettingsCard({ workspace }: { workspace: WorkspaceDetail }) {
  const router = useRouter()
  const [name, setName] = React.useState(workspace.name)
  const rename = useRenameWorkspace(workspace.id)
  const remove = useDeleteWorkspace()

  const dirty = name.trim() !== workspace.name && name.trim().length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team settings</CardTitle>
        <CardDescription>Only the team owner sees this.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Field>
          <FieldLabel htmlFor="rename">Name</FieldLabel>
          <div className="flex gap-2">
            <Input
              id="rename"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
            />
            <Button
              variant="outline"
              disabled={!dirty || rename.isPending}
              onClick={() =>
                rename.mutate(name.trim(), {
                  onSuccess: () => toast.success("Renamed"),
                  onError: (error) => toast.error(getErrorMessage(error)),
                })
              }
            >
              {rename.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </Field>

        <Separator />

        <Field>
          <FieldLabel>Delete this team</FieldLabel>
          <FieldDescription>
            Removes the team and every membership and invite in it. Members keep
            their own schedules. This cannot be undone.
          </FieldDescription>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-fit">
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete team
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {workspace.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  All {workspace.members.length} membership
                  {workspace.members.length === 1 ? "" : "s"} and any pending
                  invites go with it.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    remove.mutate(workspace.id, {
                      onSuccess: () => {
                        toast.success(`Deleted ${workspace.name}`)
                        router.push("/workspaces")
                      },
                      onError: (error) => toast.error(getErrorMessage(error)),
                    })
                  }
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Field>
      </CardContent>
    </Card>
  )
}
