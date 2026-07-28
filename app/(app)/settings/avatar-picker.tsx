"use client"

import * as React from "react"
import { ImageOff, Loader2, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Profile } from "@/lib/api/domain-types"
import { getErrorMessage } from "@/lib/api/errors"
import {
  uploadAvatar,
  useUpdateProfile,
  useUploadCapabilities,
} from "@/lib/hooks/use-profile"

/** Kept in step with ALLOWED_TYPES in the API's uploads.service. */
const ACCEPTED = "image/jpeg,image/png,image/webp,image/gif,image/avif"

function initialsFor(profile: Profile): string {
  const source = profile.displayName ?? profile.username ?? "?"

  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
}

export function AvatarPicker({ profile }: { profile: Profile }) {
  const capabilities = useUploadCapabilities()
  const update = useUpdateProfile()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [busy, setBusy] = React.useState(false)

  const enabled = capabilities.data?.avatars ?? false
  const maxBytes = capabilities.data?.maxBytes ?? 5 * 1024 * 1024
  const maxMb = Math.round(maxBytes / (1024 * 1024))

  async function pick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    // Reset immediately so choosing the same file twice fires a change event.
    event.target.value = ""

    if (!file) return

    // Checked here as well as server-side, purely so the user hears about it
    // before a pointless round trip.
    if (file.size > maxBytes) {
      toast.error(`That image is larger than ${maxMb} MB.`)
      return
    }

    if (!ACCEPTED.split(",").includes(file.type)) {
      toast.error("Use a JPEG, PNG, WebP, GIF or AVIF image.")
      return
    }

    setBusy(true)

    try {
      const avatarUrl = await uploadAvatar(file)

      // Saved to the profile only after R2 confirms the PUT — writing the URL
      // first would leave a broken image if the upload failed.
      await update.mutateAsync({ avatarUrl })

      toast.success("Photo updated")
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  function removePhoto() {
    update.mutate(
      { avatarUrl: null },
      {
        onSuccess: () => toast.success("Photo removed"),
        onError: (error) => toast.error(getErrorMessage(error)),
      }
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Photo</CardTitle>
        <CardDescription>
          {enabled
            ? `Square images look best. Up to ${maxMb} MB.`
            : "Image uploads are not configured on this deployment."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-4">
        <Avatar className="h-16 w-16">
          {profile.avatarUrl && (
            <AvatarImage src={profile.avatarUrl} alt="" />
          )}
          <AvatarFallback className="text-lg">
            {initialsFor(profile)}
          </AvatarFallback>
        </Avatar>

        {enabled ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED}
              onChange={(event) => void pick(event)}
              className="hidden"
              aria-hidden
              tabIndex={-1}
            />

            <Button
              variant="outline"
              disabled={busy || update.isPending}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-1.5 h-4 w-4" />
              )}
              {profile.avatarUrl ? "Replace" : "Upload"}
            </Button>

            {profile.avatarUrl && (
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-destructive"
                disabled={busy || update.isPending}
                onClick={removePhoto}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Remove
              </Button>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <ImageOff className="h-4 w-4" />
            Uploads unavailable
          </p>
        )}
      </CardContent>
    </Card>
  )
}
