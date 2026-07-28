"use client"

import * as React from "react"
import {
  Ban,
  Crown,
  Flag,
  Loader2,
  Megaphone,
  Plus,
  ScrollText,
  Trash2,
  Wrench,
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
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { BannerVariant, OwnerOverview } from "@/lib/api/admin-types"
import type { PlatformSettings } from "@/lib/auth/types"
import { api } from "@/lib/api/client"
import { getErrorMessage } from "@/lib/api/errors"
import { useQuery } from "@tanstack/react-query"
import {
  useAnnouncements,
  useAuditLog,
  useCreateAnnouncement,
  useDeleteFeatureFlag,
  useDeleteUser,
  useFeatureFlags,
  useForceSignOut,
  useIsOwner,
  useOwnerOverview,
  useOwnerUsers,
  useOwnerWorkspaces,
  useSetAnnouncementActive,
  useUpdatePlatformSettings,
  useUpsertFeatureFlag,
  PLATFORM_SETTINGS_KEY,
} from "@/lib/hooks/use-owner"

const VARIANTS: BannerVariant[] = ["info", "success", "warn", "danger"]

export function OwnerView() {
  const { data: access, isLoading } = useIsOwner()
  const isOwner = access?.isOwner ?? false

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-2">
        <Crown className="h-6 w-6 text-amber-500" />
        <div>
          <h1 className="font-heading text-3xl">Owner</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Platform-wide settings, flags, and the audit trail.
          </p>
        </div>
      </header>

      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : !isOwner ? (
        <Card>
          <CardContent className="py-10">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Ban />
                </EmptyMedia>
                <EmptyTitle>Owner access required</EmptyTitle>
                <EmptyDescription>
                  This console is limited to the platform owner. The admin role
                  is not enough.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <>
          <OverviewCards />

          <Tabs defaultValue="platform">
            <TabsList>
              <TabsTrigger value="platform">Platform</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="flags">Flags</TabsTrigger>
              <TabsTrigger value="announcements">Announcements</TabsTrigger>
              <TabsTrigger value="audit">Audit log</TabsTrigger>
            </TabsList>

            <TabsContent value="platform" className="mt-4 space-y-4">
              <PlatformPanel />
              <WorkspacesPanel />
            </TabsContent>
            <TabsContent value="users" className="mt-4">
              <UsersPanel />
            </TabsContent>
            <TabsContent value="flags" className="mt-4">
              <FlagsPanel />
            </TabsContent>
            <TabsContent value="announcements" className="mt-4">
              <AnnouncementsPanel />
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

function OverviewCards() {
  const { data, isLoading } = useOwnerOverview(true)

  if (isLoading || !data) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-24 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Users" value={data.totals.users}>
          +{data.growth.new24h} today · +{data.growth.new7d} this week
        </Metric>
        <Metric label="Schedules" value={data.totals.schedules}>
          +{data.growth.schedules7d} this week
        </Metric>
        <Metric label="Bookings" value={data.totals.bookings} />
        <Metric label="Teams" value={data.totals.workspaces} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="MRR" value={data.revenue.mrrUsd} prefix="$">
          {data.revenue.paying} paying
        </Metric>
        <Metric label="ARR" value={data.revenue.arrUsd} prefix="$" />
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              Plans
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {Object.entries(data.revenue.planCounts).map(([plan, count]) => (
                <Badge key={plan} variant="outline" className="text-xs">
                  {plan} {count}
                </Badge>
              ))}
              {Object.keys(data.revenue.planCounts).length === 0 && (
                <span className="text-muted-foreground text-sm">None</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <SignupSparkline signups={data.signupsByDay} />
    </div>
  )
}

function Metric({
  label,
  value,
  prefix,
  children,
}: {
  label: string
  value: number
  prefix?: string
  children?: React.ReactNode
}) {
  return (
    <Card>
      <CardContent>
        <p className="text-muted-foreground text-xs uppercase tracking-wide">
          {label}
        </p>
        <p className="font-heading mt-1 text-3xl">
          {prefix}
          {value.toLocaleString()}
        </p>
        {children && (
          <p className="text-muted-foreground mt-1 text-xs">{children}</p>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Thirty-day signup histogram.
 *
 * The API returns a sparse map, so the last thirty days are generated here and
 * missing days read as zero. Dates are built with `Date.UTC` and formatted as
 * `YYYY-MM-DD` to match the keys, which the server derived from
 * `toISOString()` — using local dates would shift every bucket for anyone west
 * of UTC.
 */
function SignupSparkline({ signups }: { signups: OwnerOverview["signupsByDay"] }) {
  const days = React.useMemo(() => {
    const today = new Date()
    const start = Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate()
    )

    return Array.from({ length: 30 }, (_, index) => {
      const key = new Date(start - (29 - index) * 86_400_000)
        .toISOString()
        .slice(0, 10)

      return { key, count: signups[key] ?? 0 }
    })
  }, [signups])

  const peak = Math.max(1, ...days.map((day) => day.count))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Signups</CardTitle>
        <CardDescription>Last 30 days · peak {peak}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-24 items-end gap-1">
          {days.map((day) => (
            <div
              key={day.key}
              className="bg-primary/70 min-h-0.5 flex-1 rounded-sm"
              style={{ height: `${(day.count / peak) * 100}%` }}
              title={`${day.key}: ${day.count}`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function PlatformPanel() {
  const { data } = useQuery({
    queryKey: PLATFORM_SETTINGS_KEY,
    queryFn: () => api.get<PlatformSettings>("/platform/settings"),
  })

  if (!data) {
    return <Skeleton className="h-64 w-full rounded-xl" />
  }

  // Keyed on the current values so the drafts re-seed from a useState
  // initialiser when a background refetch brings new ones, rather than being
  // clobbered mid-edit by an effect.
  return (
    <PlatformForm
      key={`${data.maintenanceMode}:${data.broadcastActive}:${data.broadcastTitle}`}
      settings={data}
    />
  )
}

function PlatformForm({ settings }: { settings: PlatformSettings }) {
  const update = useUpdatePlatformSettings()

  const [maintenanceMessage, setMaintenanceMessage] = React.useState(
    settings.maintenanceMessage ?? ""
  )
  const [broadcastTitle, setBroadcastTitle] = React.useState(
    settings.broadcastTitle ?? ""
  )
  const [broadcastBody, setBroadcastBody] = React.useState(
    settings.broadcastBody ?? ""
  )
  const [variant, setVariant] = React.useState<BannerVariant>(
    (settings.broadcastVariant as BannerVariant) ?? "info"
  )

  function save(patch: Parameters<typeof update.mutate>[0]) {
    update.mutate(patch, {
      onSuccess: () => toast.success("Platform settings saved"),
      onError: (error) => toast.error(getErrorMessage(error)),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-4 w-4" />
          Maintenance and broadcast
        </CardTitle>
        <CardDescription>
          Both banners render for every signed-in user, and maintenance shows on
          public pages too.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <FieldLabel htmlFor="maintenance">Maintenance mode</FieldLabel>
            <FieldDescription>
              Shows a site-wide notice. It does not block access.
            </FieldDescription>
          </div>
          <Switch
            id="maintenance"
            checked={settings.maintenanceMode}
            disabled={update.isPending}
            onCheckedChange={(checked) => save({ maintenanceMode: checked })}
          />
        </div>

        <Field>
          <FieldLabel htmlFor="maintenance-message">Message</FieldLabel>
          <div className="flex gap-2">
            <Input
              id="maintenance-message"
              value={maintenanceMessage}
              onChange={(event) => setMaintenanceMessage(event.target.value)}
              maxLength={500}
              placeholder="Back at 14:00 UTC"
            />
            <Button
              variant="outline"
              disabled={update.isPending}
              onClick={() =>
                save({ maintenanceMessage: maintenanceMessage.trim() || null })
              }
            >
              Save
            </Button>
          </div>
        </Field>

        <Separator />

        <div className="flex items-start justify-between gap-4">
          <div>
            <FieldLabel htmlFor="broadcast">Broadcast banner</FieldLabel>
            <FieldDescription>
              A dismissible-free notice at the top of the app.
            </FieldDescription>
          </div>
          <Switch
            id="broadcast"
            checked={settings.broadcastActive}
            disabled={update.isPending}
            onCheckedChange={(checked) => save({ broadcastActive: checked })}
          />
        </div>

        <Field>
          <FieldLabel htmlFor="broadcast-title">Title</FieldLabel>
          <Input
            id="broadcast-title"
            value={broadcastTitle}
            onChange={(event) => setBroadcastTitle(event.target.value)}
            maxLength={200}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="broadcast-body">Body</FieldLabel>
          <Textarea
            id="broadcast-body"
            value={broadcastBody}
            onChange={(event) => setBroadcastBody(event.target.value)}
            rows={2}
            maxLength={1000}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="broadcast-variant">Tone</FieldLabel>
          <NativeSelect
            id="broadcast-variant"
            value={variant}
            onChange={(event) =>
              setVariant(event.target.value as BannerVariant)
            }
          >
            {VARIANTS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <Button
          disabled={update.isPending}
          onClick={() =>
            save({
              broadcastTitle: broadcastTitle.trim() || null,
              broadcastBody: broadcastBody.trim() || null,
              broadcastVariant: variant,
            })
          }
        >
          {update.isPending && (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          )}
          Save broadcast
        </Button>
      </CardContent>
    </Card>
  )
}

function FlagsPanel() {
  const { data, isLoading } = useFeatureFlags(true)
  const upsert = useUpsertFeatureFlag()
  const remove = useDeleteFeatureFlag()

  const [key, setKey] = React.useState("")
  const [description, setDescription] = React.useState("")

  function create(event: React.FormEvent) {
    event.preventDefault()

    upsert.mutate(
      {
        key: key.trim(),
        enabled: false,
        description: description.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success("Flag created")
          setKey("")
          setDescription("")
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      }
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="h-4 w-4" />
          Feature flags
        </CardTitle>
        <CardDescription>
          Read by the server; nothing is gated on them yet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={create} className="flex flex-wrap items-end gap-2">
          <Field className="min-w-40 flex-1">
            <FieldLabel htmlFor="flag-key">Key</FieldLabel>
            <Input
              id="flag-key"
              value={key}
              onChange={(event) => setKey(event.target.value)}
              placeholder="ai_chat"
              maxLength={64}
              spellCheck={false}
            />
          </Field>
          <Field className="min-w-40 flex-1">
            <FieldLabel htmlFor="flag-desc">Description</FieldLabel>
            <Input
              id="flag-desc"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
            />
          </Field>
          <Button
            type="submit"
            variant="outline"
            disabled={!key.trim() || upsert.isPending}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add
          </Button>
        </form>

        <Separator />

        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (data ?? []).length === 0 ? (
          <p className="text-muted-foreground py-2 text-sm">No flags yet.</p>
        ) : (
          (data ?? []).map((flag) => (
            <div
              key={flag.key}
              className="flex flex-wrap items-center gap-3 border-b py-2 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <code className="text-sm font-medium">{flag.key}</code>
                {flag.description && (
                  <p className="text-muted-foreground text-xs">
                    {flag.description}
                  </p>
                )}
              </div>

              <Switch
                checked={flag.enabled}
                aria-label={`Toggle ${flag.key}`}
                disabled={upsert.isPending}
                onCheckedChange={(checked) =>
                  upsert.mutate(
                    {
                      key: flag.key,
                      enabled: checked,
                      description: flag.description,
                    },
                    {
                      onSuccess: () =>
                        toast.success(
                          `${flag.key} ${checked ? "enabled" : "disabled"}`
                        ),
                      onError: (error) => toast.error(getErrorMessage(error)),
                    }
                  )
                }
              />

              <Button
                size="icon"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Delete ${flag.key}`}
                disabled={remove.isPending}
                onClick={() =>
                  remove.mutate(flag.key, {
                    onSuccess: () => toast.success("Flag deleted"),
                    onError: (error) => toast.error(getErrorMessage(error)),
                  })
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function AnnouncementsPanel() {
  const { data, isLoading } = useAnnouncements(true)
  const create = useCreateAnnouncement()
  const setActive = useSetAnnouncementActive()

  const [title, setTitle] = React.useState("")
  const [body, setBody] = React.useState("")
  const [variant, setVariant] = React.useState<BannerVariant>("info")

  // Pinned once rather than read in the render body: `Date.now()` during render
  // is impure, and an "expired" badge that flips on an unrelated re-render is
  // exactly the instability the rule exists to prevent.
  const [now] = React.useState(() => Date.now())

  function submit(event: React.FormEvent) {
    event.preventDefault()

    create.mutate(
      { title: title.trim(), body: body.trim(), variant, active: true },
      {
        onSuccess: () => {
          toast.success("Announcement published")
          setTitle("")
          setBody("")
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      }
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-4 w-4" />
          Announcements
        </CardTitle>
        <CardDescription>
          Visible to every signed-in user while active.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={submit} className="space-y-3">
          <Field>
            <FieldLabel htmlFor="ann-title">Title</FieldLabel>
            <Input
              id="ann-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="ann-body">Body</FieldLabel>
            <Textarea
              id="ann-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={3}
              maxLength={2000}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="ann-variant">Tone</FieldLabel>
            <NativeSelect
              id="ann-variant"
              value={variant}
              onChange={(event) =>
                setVariant(event.target.value as BannerVariant)
              }
            >
              {VARIANTS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Button
            type="submit"
            disabled={!title.trim() || !body.trim() || create.isPending}
          >
            {create.isPending && (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            )}
            Publish
          </Button>
        </form>

        <Separator />

        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (data ?? []).length === 0 ? (
          <p className="text-muted-foreground py-2 text-sm">
            Nothing published yet.
          </p>
        ) : (
          (data ?? []).map((announcement) => {
            const expired =
              announcement.endsAt !== null &&
              new Date(announcement.endsAt).getTime() < now

            return (
              <div
                key={announcement.id}
                className="flex flex-wrap items-center gap-3 border-b py-2 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {announcement.title}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {announcement.variant}
                    </Badge>
                    {expired && (
                      <Badge variant="outline" className="text-xs">
                        expired
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground line-clamp-2 text-xs">
                    {announcement.body}
                  </p>
                </div>

                <Switch
                  checked={announcement.active}
                  aria-label={`Toggle ${announcement.title}`}
                  disabled={setActive.isPending}
                  onCheckedChange={(checked) =>
                    setActive.mutate(
                      { id: announcement.id, active: checked },
                      {
                        onSuccess: () =>
                          toast.success(checked ? "Shown" : "Hidden"),
                        onError: (error) => toast.error(getErrorMessage(error)),
                      }
                    )
                  }
                />
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

function WorkspacesPanel() {
  const { data, isLoading } = useOwnerWorkspaces(true)

  return (
    <Card>
      <CardHeader>
        <CardTitle>All teams</CardTitle>
        <CardDescription>Most recent 200 across the platform.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (data ?? []).length === 0 ? (
          <p className="text-muted-foreground py-2 text-sm">No teams yet.</p>
        ) : (
          (data ?? []).map((workspace) => (
            <div
              key={workspace.id}
              className="flex flex-wrap items-center gap-2 border-b py-2 text-sm last:border-0"
            >
              <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
              <Badge variant="outline" className="text-xs capitalize">
                {workspace.kind}
              </Badge>
              <span className="text-muted-foreground text-xs">
                {workspace._count.members} members
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function AuditPanel() {
  const { data, isLoading } = useAuditLog(true)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="h-4 w-4" />
          Audit log
        </CardTitle>
        <CardDescription>
          Append-only. Written by the server on every privileged action; there is
          no route that edits or deletes an entry.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (data ?? []).length === 0 ? (
          <p className="text-muted-foreground py-2 text-sm">
            Nothing recorded yet.
          </p>
        ) : (
          (data ?? []).map((entry) => (
            <div
              key={entry.id}
              className="flex flex-wrap items-baseline gap-2 border-b py-2 text-sm last:border-0"
            >
              <code className="text-xs">{entry.action}</code>
              {entry.targetUserId && (
                <span className="text-muted-foreground truncate text-xs">
                  → {entry.targetUserId.slice(0, 8)}
                </span>
              )}
              <span className="text-muted-foreground ml-auto text-xs">
                {new Date(entry.createdAt).toLocaleString()}
              </span>
              {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                <p className="text-muted-foreground w-full font-mono text-xs">
                  {JSON.stringify(entry.metadata)}
                </p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Force sign-out and account deletion.
 *
 * Both are irreversible from the operator's side, so both sit behind a
 * confirmation naming the account. The list is owner-scoped rather than reusing
 * the admin directory — see `OwnerService.listUsers`.
 */
function UsersPanel() {
  const [search, setSearch] = React.useState("")
  const forceSignOut = useForceSignOut()
  const deleteUser = useDeleteUser()

  const { data, isLoading } = useOwnerUsers(search)

  return (
    <Card>
      <CardHeader>
        <CardTitle>User operations</CardTitle>
        <CardDescription>
          Sign someone out of every device, or delete an account and everything
          attached to it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by email, name, or username"
          aria-label="Search users"
        />

        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (data ?? []).length === 0 ? (
          <p className="text-muted-foreground py-2 text-sm">No matches.</p>
        ) : (
          (data ?? []).map((user) => {
            const label = user.profile?.displayName ?? user.email

            return (
              <div
                key={user.id}
                className="flex flex-wrap items-center gap-2 border-b py-2 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{label}</div>
                  <div className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {user.roles.map((row) => (
                    <Badge
                      key={row.role}
                      variant="outline"
                      className="text-xs"
                    >
                      {row.role}
                    </Badge>
                  ))}
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-xs">
                      Sign out
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Sign out {label}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Revokes every refresh token, so their session ends within
                        fifteen minutes. They can sign back in.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          forceSignOut.mutate(user.id, {
                            onSuccess: () => toast.success(`Signed out ${label}`),
                            onError: (error) =>
                              toast.error(getErrorMessage(error)),
                          })
                        }
                      >
                        Sign out
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Delete ${label}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {label}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Deletes the account and every schedule, booking, event
                        type, team membership and invite belonging to it. This
                        cannot be undone. It is recorded in the audit log.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          deleteUser.mutate(user.id, {
                            onSuccess: () => toast.success(`Deleted ${label}`),
                            onError: (error) =>
                              toast.error(getErrorMessage(error)),
                          })
                        }
                      >
                        Delete account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
