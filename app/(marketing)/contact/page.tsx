import type { Metadata } from "next"
import { Mail, MapPin, MessageCircleHeart, type LucideIcon } from "lucide-react"

import { ContactForm } from "./contact-form"

export const metadata: Metadata = {
  title: "Contact — Laterr",
  description: "Talk to the Laterr team. We reply warmly, and quickly.",
  openGraph: {
    title: "Contact — Laterr",
    description: "Talk to the Laterr team. We reply warmly, and quickly.",
  },
  alternates: { canonical: "/contact" },
}

/** The address the original hardcoded, overridable per deployment. */
const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL_ADDRESS || "hello@laterr.app"

const CARDS: Array<{
  icon: LucideIcon
  title: string
  body: string
  href?: string
}> = [
  {
    icon: Mail,
    title: "Email",
    body: SUPPORT_EMAIL,
    href: `mailto:${SUPPORT_EMAIL}`,
  },
  {
    icon: MessageCircleHeart,
    title: "Support",
    body: "Mon–Fri, replies within a day.",
  },
  {
    icon: MapPin,
    title: "Studio",
    body: "Remote-first. Everywhere our users are.",
  },
]

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
      <p className="text-primary text-xs tracking-widest uppercase">
        Contact us
      </p>
      <h1 className="font-heading mt-3 text-4xl md:text-6xl">Say hello.</h1>
      <p className="text-muted-foreground mt-4 max-w-xl text-lg">
        Questions, partnerships, or just a warm hi — we read every message.
      </p>

      <div className="mt-12 grid gap-8 md:grid-cols-[1.2fr_1fr]">
        <ContactForm to={SUPPORT_EMAIL} />

        <div className="space-y-4">
          {CARDS.map((card) => (
            <div
              key={card.title}
              className="border-border/60 bg-secondary/40 rounded-2xl border p-5"
            >
              <card.icon className="text-primary h-5 w-5" />
              <p className="font-heading mt-3 text-lg">{card.title}</p>
              {card.href ? (
                <a
                  href={card.href}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  {card.body}
                </a>
              ) : (
                <p className="text-muted-foreground text-sm">{card.body}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
