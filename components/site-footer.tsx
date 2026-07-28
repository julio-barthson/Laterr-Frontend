import Link from "next/link"

import { Logo } from "@/components/logo"

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { href: "/pricing", label: "Pricing" },
      { href: "/faq", label: "FAQ" },
      { href: "/schedule-now", label: "Schedule now" },
    ],
  },
  {
    heading: "Company",
    links: [{ href: "/contact", label: "Contact" }],
  },
  {
    heading: "Legal",
    links: [
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
      { href: "/cookies", label: "Cookies" },
    ],
  },
] as const

export function SiteFooter() {
  return (
    <footer className="border-border/40 border-t">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[2fr_repeat(3,1fr)]">
        <div>
          <Link
            href="/"
            className="flex items-center"
            aria-label="Laterr home"
          >
            <Logo className="h-8" />
          </Link>
          <p className="text-muted-foreground mt-3 max-w-xs text-sm">
            Your calendar, but it actually knows you.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.heading}>
            <p className="text-sm font-medium">{column.heading}</p>
            <ul className="mt-3 space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-border/40 border-t">
        <div className="text-muted-foreground mx-auto max-w-6xl px-4 py-6 text-xs sm:px-6">
          © {new Date().getFullYear()} Laterr. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
