/**
 * The site's own origin.
 *
 * Read through a function rather than exported as a constant so a missing value
 * fails at the call site with a useful message instead of at module load, which
 * in a Server Component surfaces as an opaque build error.
 *
 * Falls back to localhost rather than throwing: `metadataBase` is needed at build
 * time, and a build that dies because a canonical URL is unset is worse than one
 * that emits localhost canonicals in development.
 */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_FRONTEND_URL

  if (!configured) {
    return "http://localhost:3000"
  }

  return configured.replace(/\/$/, "")
}

/** Absolute URL for a path, for canonicals and sitemap entries. */
export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`
}
