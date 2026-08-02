"use client"

import * as React from "react"
import Link from "next/link"
import { Check, Copy, ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { AvatarPicker } from "./avatar-picker"
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
import { Skeleton } from "@/components/ui/skeleton"
import type { PersonaType, Profile } from "@/lib/api/domain-types"
import { getErrorMessage } from "@/lib/api/errors"
import {
  useProfile,
  useUpdateProfile,
  useUsernameAvailable,
} from "@/lib/hooks/use-profile"
import { browserTimezone, timezoneOptions } from "@/lib/time"
import { PageHeader } from "@/components/PageHeader"
import { CalendarCard } from "./calendar-card"
import { SecurityCard } from "./security-card"
import { VerifyEmailCard } from "./verify-email-card"

const PERSONAS: Array<{ value: PersonaType; label: string; hint: string }> = [
  { value: "individual", label: "Individual", hint: "Just me." },
  { value: "creator", label: "Creator", hint: "Audience and collaborations." },
  { value: "artist", label: "Artist", hint: "Sessions, gigs, and rehearsals." },
  { value: "family", label: "Family", hint: "Shared household plans." },
  { value: "enterprise", label: "Enterprise", hint: "A team or organisation." },
]

const USERNAME_PATTERN = /^[a-z0-9-]{3,40}$/

export function SettingsView() {
  const { data: profile, isLoading } = useProfile()

  return (
    <div className="space-y-6">
      {/* Outside the loading gate so the first paint is labelled. */}
      <PageHeader
        title="Profile"
        description="How you appear to people booking time with you."
        back
      />

      {/* Outside the profile gate: it reads the session, not the profile, and
          an unconfirmed address is worth surfacing before the rest loads. */}
      <VerifyEmailCard />

      {/* Independent of the profile: it reads connections, not the profile. */}
      <CalendarCard />

      {isLoading || !profile ? (
        <>
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </>
      ) : (
        // Keyed on updatedAt so a background refetch re-seeds the drafts from a
        // useState initialiser instead of an effect clobbering unsaved edits.
        <ProfileForms key={profile.updatedAt} profile={profile} />
      )}
    </div>
  )
}

function ProfileForms({ profile }: { profile: Profile }) {
  return (
    <>
      <AvatarPicker profile={profile} />
      <DetailsCard profile={profile} />
      <BookingLinkCard profile={profile} />
      <SecurityCard />
    </>
  )
}

function DetailsCard({ profile }: { profile: Profile }) {
  const update = useUpdateProfile()

  const [displayName, setDisplayName] = React.useState(
    profile.displayName ?? ""
  )
  const [username, setUsername] = React.useState(profile.username ?? "")
  const [persona, setPersona] = React.useState<PersonaType>(profile.persona)
  const [timezone, setTimezone] = React.useState(
    profile.timezone ?? browserTimezone()
  )
  const [phone, setPhone] = React.useState(profile.phone ?? "")

  const cleanedUsername = username.trim().toLowerCase()
  const usernameChanged = cleanedUsername !== (profile.username ?? "")
  const usernameValid =
    cleanedUsername.length === 0 || USERNAME_PATTERN.test(cleanedUsername)

  // Only checked when it has actually changed — asking whether your own current
  // username is free is both wasteful and confusing (the API excludes you, so it
  // would always say yes).
  const availability = useUsernameAvailable(
    usernameChanged && usernameValid ? cleanedUsername : ""
  )

  const taken = usernameChanged && availability.data?.available === false

  const zones = React.useMemo(() => {
    const options = timezoneOptions()

    // A stored zone the browser does not enumerate must still be selectable,
    // otherwise saving anything else would silently change it.
    return options.includes(timezone) ? options : [timezone, ...options]
  }, [timezone])

  const dirty =
    displayName.trim() !== (profile.displayName ?? "") ||
    usernameChanged ||
    persona !== profile.persona ||
    timezone !== (profile.timezone ?? browserTimezone()) ||
    phone.trim() !== (profile.phone ?? "")

  function submit(event: React.FormEvent) {
    event.preventDefault()

    update.mutate(
      {
        displayName: displayName.trim() || null,
        username: cleanedUsername || null,
        persona,
        timezone,
        phone: phone.trim() || null,
      },
      {
        onSuccess: () => toast.success("Profile saved"),
        onError: (error) => toast.error(getErrorMessage(error)),
      }
    )
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Details</CardTitle>
        <CardDescription>
          Your name and username appear on your public booking page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-5">
          <Field>
            <FieldLabel htmlFor="display-name">Display name</FieldLabel>
            <Input
              id="display-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={120}
              placeholder="Ada Lovelace"
            />
          </Field>

          <Field data-invalid={!usernameValid || taken ? true : undefined}>
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <Input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              maxLength={40}
              autoCapitalize="none"
              spellCheck={false}
              placeholder="ada"
              aria-invalid={!usernameValid || taken}
            />
            <FieldDescription>
              {!usernameValid ? (
                <span className="text-destructive">
                  Lowercase letters, numbers and dashes only, 3–40 characters.
                </span>
              ) : taken ? (
                <span className="text-destructive">
                  That username is already taken.
                </span>
              ) : usernameChanged && availability.data?.available ? (
                <span className="text-emerald-600 dark:text-emerald-400">
                  {cleanedUsername} is available.
                </span>
              ) : cleanedUsername ? (
                `Your page will be /book/${cleanedUsername}`
              ) : (
                "Pick one to get a public booking page."
              )}
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="persona">I use Laterr as</FieldLabel>
            <NativeSelect
              id="persona"
              value={persona}
              onChange={(event) =>
                setPersona(event.target.value as PersonaType)
              }
            >
              {PERSONAS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
            <FieldDescription>
              {PERSONAS.find((option) => option.value === persona)?.hint}
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
            <NativeSelect
              id="timezone"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
            >
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </NativeSelect>
            <FieldDescription>
              Used when Laterr AI reads times like &ldquo;tomorrow at
              lunch&rdquo;.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="phone">Phone</FieldLabel>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              maxLength={40}
              placeholder="Optional"
            />
            <FieldDescription>
              Private. Never shown on your public page or shared with invitees.
            </FieldDescription>
          </Field>

          <Button
            type="submit"
            className="rounded-full"
            disabled={!dirty || !usernameValid || taken || update.isPending}
          >
            {update.isPending && (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            )}
            Save changes
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function BookingLinkCard({ profile }: { profile: Profile }) {
  const [copied, setCopied] = React.useState(false)

  if (!profile.username) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Your booking link</CardTitle>
          <CardDescription>
            Pick a username above and your public page appears here.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const path = `/book/${profile.username}`

  async function copy() {
    try {
      // Absolute, because this is meant to be pasted somewhere else.
      await navigator.clipboard.writeText(`${window.location.origin}${path}`)
      setCopied(true)
      toast.success("Link copied")
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Couldn't copy — select the link and copy it manually.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your booking link</CardTitle>
        <CardDescription>
          Share this and people can book you without an account.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg bg-muted px-3 py-3 text-sm">
          {path}
        </code>
        <Button variant="outline" onClick={() => void copy()}>
          {copied ? (
            <Check className="mr-1.5 h-4 w-4 text-emerald-500" />
          ) : (
            <Copy className="mr-1.5 h-4 w-4" />
          )}
          Copy
        </Button>
        <Button asChild variant="ghost">
          <Link href={path} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-1.5 h-4 w-4" />
            Preview
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
