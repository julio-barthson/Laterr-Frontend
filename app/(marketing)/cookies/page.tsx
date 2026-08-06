import type { Metadata } from "next"

import { LegalPage } from "@/components/legal-page"

export const metadata: Metadata = {
  title: "Cookies — Laterr",
  description: "The cookies Laterr sets and why.",
  alternates: { canonical: "/cookies" },
}

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie policy"
      updated="26 July 2026"
      intro="Laterr sets only the cookies it needs to work. There are no advertising or third-party tracking cookies."
      sections={[
        {
          heading: "What we set",
          paragraphs: ["Two cookies, both strictly necessary:"],
          bullets: [
            "laterr_access — your short-lived session token, used to authenticate each request. httpOnly, so page scripts cannot read it.",
            "laterr_refresh — used to obtain a new access token when the old one expires, so you are not signed out every fifteen minutes. Also httpOnly.",
          ],
        },
        {
          heading: "Why they are exempt from consent",
          paragraphs: [
            "Both are strictly necessary to deliver a service you have asked for, signing in. Under the UK PECR and the EU ePrivacy Directive, that category does not require consent. The notice you saw is informational.",
          ],
        },
        {
          heading: "Local storage",
          paragraphs: [
            "We store two small preferences in your browser rather than in a cookie: your light or dark theme choice, and whether you have dismissed the cookie notice. Neither leaves your device.",
          ],
        },
        {
          heading: "Turning them off",
          paragraphs: [
            "You can block or clear these cookies in your browser settings, but you will not be able to stay signed in. Public booking pages work without them.",
          ],
        },
      ]}
    />
  )
}
