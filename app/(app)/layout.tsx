import { AppShell } from "@/components/app-shell"
import { AuthGuard } from "@/components/auth-guard"

/**
 * Wraps every authenticated route.
 *
 * `proxy.ts` bounces visitors with no session cookie, but only when the API
 * shares this site's origin — cookies are per-host, so a separately deployed API
 * is invisible to it. AuthGuard covers that case by asking the API directly.
 * Either way the API's guards remain what actually enforces access.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  )
}
