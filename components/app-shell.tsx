"use client"

import Link from "next/link"

import { Logo } from "@/components/logo"
import { usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  CalendarClock,
  CalendarHeart,
  Clock,
  Crown,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageCircle,
  Settings as SettingsIcon,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCircle,
  Users,
} from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { api } from "@/lib/api/client"
import type { PlatformSettings } from "@/lib/auth/types"
import { hasRole, useLogout, useSession } from "@/lib/auth/use-session"
import { useProfile } from "@/lib/hooks/use-profile"
import { useTeamsAccess } from "@/lib/hooks/use-workspaces"
import { cn } from "@/lib/utils"

const NAV_MAIN = [
  { title: "Home", url: "/app", icon: LayoutDashboard },
  { title: "Events", url: "/event-types", icon: CalendarHeart },
  { title: "Meetings", url: "/meetings", icon: CalendarClock },
  { title: "Availability", url: "/availability", icon: Clock },
  { title: "Laterr AI", url: "/chat", icon: Sparkles },
  { title: "Profile", url: "/settings", icon: UserCircle },
] as const

/**
 * `businessOnly` items get an upgrade badge when the plan gate is closed. The
 * link still works — the page itself explains the gate and offers the upgrade,
 * which is friendlier than a nav item that does nothing.
 */
const NAV_MANAGE = [
  { title: "Inbox", url: "/inbox", icon: Mail, businessOnly: false },
  { title: "Teams", url: "/workspaces", icon: Users, businessOnly: true },
  { title: "Roles", url: "/roles", icon: ShieldCheck, businessOnly: true },
  { title: "Settings", url: "/settings", icon: SettingsIcon, businessOnly: false },
] as const

const MOBILE_NAV = [
  { label: "Home", url: "/app", icon: null },
  { label: "AI", url: "/chat", icon: MessageCircle },
  { label: "Meet", url: "/meetings", icon: null },
  { label: "Inbox", url: "/inbox", icon: null },
  { label: "Me", url: "/settings", icon: null },
] as const

const BANNER_TONE: Record<string, string> = {
  info: "border-primary/30 bg-primary/10",
  success: "border-emerald-500/30 bg-emerald-500/10",
  warn: "border-amber-500/30 bg-amber-500/10",
  danger: "border-destructive/30 bg-destructive/10",
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useSession()
  const logout = useLogout()

  const isAdmin = hasRole(user, "admin")
  const isOwner = hasRole(user, "owner")

  const { data: platform } = useQuery<PlatformSettings>({
    queryKey: ["platform-settings"],
    queryFn: () => api.get<PlatformSettings>("/platform/settings"),
    staleTime: 30_000,
  })

  const broadcast = platform?.broadcastActive ? platform : null

  // The gate is answered by the API rather than inferred from the session, so an
  // upgrade applied elsewhere clears the badges without a re-login. While the
  // answer is in flight nothing is badged — a badge that appears then vanishes
  // reads as a bug.
  const teams = useTeamsAccess()
  const needsUpgrade = teams.data ? !teams.data.allowed : false

  const { data: profile } = useProfile()

  // /app must match exactly — a prefix test would light it up on every route.
  const isActive = (url: string) =>
    url === "/app" ? pathname === "/app" : pathname.startsWith(url)

  return (
    <SidebarProvider>
      <Sidebar collapsible="offcanvas">
        <SidebarHeader>
          <Link
            href="/app"
            className="flex items-center px-2 py-2"
            aria-label="Laterr home"
          >
            <Logo className="h-8" priority />
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_MAIN.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link href={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Manage</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_MANAGE.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link href={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {item.businessOnly && needsUpgrade && (
                          <span className="border-primary/30 bg-primary/10 text-primary ml-auto rounded-full border px-1.5 py-0.5 text-[10px] leading-none">
                            Business
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

                {isAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin")}>
                      <Link
                        href="/admin"
                        className="text-primary flex items-center gap-2"
                      >
                        <ShieldAlert className="h-4 w-4" />
                        <span>Admin</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {isOwner && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/owner")}>
                      <Link
                        href="/owner"
                        className="flex items-center gap-2 text-amber-500"
                      >
                        <Crown className="h-4 w-4" />
                        <span>Owner</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          {/* The signed-in identity, and the only place the uploaded avatar
              surfaces outside a team member list. */}
          <Link
            href="/settings"
            className="hover:bg-accent flex items-center gap-2 rounded-lg px-2 py-2"
          >
            <Avatar className="h-8 w-8">
              {profile?.avatarUrl && (
                <AvatarImage src={profile.avatarUrl} alt="" />
              )}
              <AvatarFallback className="text-xs">
                {(profile?.displayName ?? profile?.username ?? user?.email ?? "?")
                  .charAt(0)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {profile?.displayName ?? profile?.username ?? "Your profile"}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                {user?.email}
              </p>
            </div>
          </Link>

          <div className="flex items-center justify-between gap-2 px-2 py-2">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <LogOut className="mr-1.5 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {platform?.maintenanceMode && (
          <div className="border-destructive/30 bg-destructive/10 border-b">
            <div className="mx-auto max-w-6xl px-4 py-2 text-sm sm:px-6">
              <strong className="mr-2">Maintenance</strong>
              <span className="text-muted-foreground">
                {platform.maintenanceMessage ??
                  "Laterr is undergoing maintenance."}
              </span>
            </div>
          </div>
        )}

        {broadcast && (
          <div
            className={cn(
              "border-b",
              BANNER_TONE[broadcast.broadcastVariant] ?? BANNER_TONE.info
            )}
          >
            <div className="mx-auto max-w-6xl px-4 py-2 text-sm sm:px-6">
              {broadcast.broadcastTitle && (
                <strong className="mr-2">{broadcast.broadcastTitle}</strong>
              )}
              <span className="text-muted-foreground">
                {broadcast.broadcastBody}
              </span>
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="border-primary/30 bg-primary/10 border-b">
            <div className="flex items-center justify-between gap-4 px-4 py-2 text-sm sm:px-6">
              <div className="text-foreground flex min-w-0 items-center gap-2">
                <ShieldAlert className="text-primary h-4 w-4 shrink-0" />
                <span className="truncate">
                  You&apos;re signed in as an <strong>Admin</strong>.
                </span>
              </div>
              <Link
                href="/admin"
                className="bg-primary text-primary-foreground inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium hover:opacity-90"
              >
                Open Admin
              </Link>
            </div>
          </div>
        )}

        <header className="border-border/40 bg-background/70 sticky top-0 z-20 flex h-14 items-center gap-2 border-b px-3 backdrop-blur-md sm:px-4">
          <SidebarTrigger />
          <Link
            href="/app"
            className="flex items-center md:hidden"
            aria-label="Laterr home"
          >
            <Logo className="h-7" />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/chat"
              className="bg-primary text-primary-foreground inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm sm:px-4"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Ask Laterr AI</span>
              <span className="sm:hidden">AI</span>
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-20 sm:px-6 sm:py-10 md:pb-10">
          {children}
        </main>

        {/* Thumb-reachable nav on small screens. */}
        <nav
          aria-label="Quick navigation"
          className="border-border bg-card/95 fixed bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border p-1 shadow-lg backdrop-blur md:hidden"
        >
          {MOBILE_NAV.map((item) => (
            <Link
              key={item.url}
              href={item.url}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs",
                isActive(item.url) && "bg-primary text-primary-foreground"
              )}
            >
              {item.icon && <item.icon className="mr-1 inline h-3.5 w-3.5" />}
              {item.label}
            </Link>
          ))}
        </nav>
      </SidebarInset>
    </SidebarProvider>
  )
}
