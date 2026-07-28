import Image from "next/image"

import { cn } from "@/lib/utils"

/**
 * Ported from the waitlist so both sites render the same mark.
 *
 * Source art has no alpha, so `public/assets/images/logo-*.png` are transparent
 * derivatives: the light pair is the navy/blue lockup with its white matte
 * removed, the dark pair is the white lockup with its black matte removed.
 * Both variants ship and CSS picks one, so the swap costs no JS and no flash —
 * which matters here because the theme is applied on the client and a
 * JS-driven swap would show the wrong logo for a frame on every load.
 */
const LOCKUP = { width: 839, height: 250 }
const MARK = { width: 477, height: 807 }

/** Full wordmark. Sized by height so the aspect ratio is never fought. */
export function Logo({
  className,
  priority = false,
}: {
  className?: string
  priority?: boolean
}) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <Image
        src="/assets/images/logo-lockup-light.png"
        alt="Laterr"
        width={LOCKUP.width}
        height={LOCKUP.height}
        priority={priority}
        className="h-full w-auto dark:hidden"
      />
      {/* The dark twin is decorative: the light one above already carries the
          accessible name, so announcing it twice would be noise. */}
      <Image
        src="/assets/images/logo-lockup-dark.png"
        alt=""
        aria-hidden="true"
        width={LOCKUP.width}
        height={LOCKUP.height}
        priority={priority}
        className="hidden h-full w-auto dark:block"
      />
    </span>
  )
}

/** Icon-only mark, for tight spots where the full lockup would be unreadable. */
export function LogoMark({
  className,
  priority = false,
}: {
  className?: string
  priority?: boolean
}) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <Image
        src="/assets/images/logo-mark-light.png"
        alt="Laterr"
        width={MARK.width}
        height={MARK.height}
        priority={priority}
        className="h-full w-auto dark:hidden"
      />
      <Image
        src="/assets/images/logo-mark-dark.png"
        alt=""
        aria-hidden="true"
        width={MARK.width}
        height={MARK.height}
        priority={priority}
        className="hidden h-full w-auto dark:block"
      />
    </span>
  )
}
