import { AppShell } from "@/components/app-shell"

/**
 * Wraps every authenticated route. `proxy.ts` has already bounced visitors with
 * no session cookie, so the shell can assume one exists — while the API remains
 * the thing that actually enforces it.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}
