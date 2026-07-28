import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  BellRing,
  CalendarHeart,
  CheckCircle2,
  MapPin,
  MessageCircleHeart,
  Mic,
  Plane,
  Sparkles,
  Trophy,
  Wallet,
  Wand2,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { CATEGORIES, FEATURES } from "@/lib/marketing-content"

export const metadata: Metadata = {
  title: "Laterr — Your time deserves a better platform",
  description:
    "Voice or text — Laterr organizes your meetings, payments, flights and sports with warm AI follow-ups.",
  openGraph: {
    title: "Laterr — Your time deserves a better platform",
    description:
      "The world's first AI-powered scheduling ecosystem for meetings, payments, flights, sports and more.",
    type: "website",
    url: "/",
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
}

const CATEGORY_ICONS: LucideIcon[] = [CalendarHeart, Wallet, Plane, Trophy]
const FEATURE_ICONS: LucideIcon[] = [Mic, MessageCircleHeart, MapPin]

/**
 * The four-step story, ported from the original.
 *
 * `reverse` alternates which side the image sits on. The bullets belong to the
 * step rather than living in a chain of `n === "01" &&` branches, which is how
 * the original expressed the same thing.
 */
interface Step {
  n: string
  icon: LucideIcon
  pill: string
  title: string
  body: string
  image: string
  alt: string
  /** Puts the image on the right instead of the left. */
  reverse?: boolean
  /** Overrides the tick used beside each bullet. */
  bulletIcon?: LucideIcon
  bullets: string[]
}

const STEPS: Step[] = [
  {
    n: "01",
    icon: Mic,
    pill: "Voice or text",
    title: "Capture in your own words",
    body: 'Tap and speak, or type one line. "Pay Sarah $150 for rent next Tuesday at 4pm" becomes a fully structured schedule — amount, person, category and reminder set.',
    image: "/assets/images/workflow-capture.jpg",
    alt: "A hand holding a phone showing Laterr's voice capture screen",
    bullets: [
      "Understands amounts, dates and people",
      "Auto-tags by category — no manual sorting",
      "Draft appears in seconds, ready to confirm",
    ],
  },
  {
    n: "02",
    icon: Wand2,
    pill: "AI structuring",
    title: "Laterr AI organizes everything",
    body: "Meetings, payments, flights, and match days sort themselves into a clean timeline. Locations resolve to real addresses. Meeting URLs auto-generate.",
    image: "/assets/images/workflow-organize.jpg",
    alt: "Floating glass cards showing meeting, payment, flight and sports entries",
    reverse: true,
    bullets: [
      "Zoom, Meet, Teams and Webex links baked in",
      "Venues resolved to real map locations",
      "Buffers added around flights automatically",
    ],
  },
  {
    n: "03",
    icon: MessageCircleHeart,
    pill: "AI companion",
    title: "Warm follow-ups that feel human",
    body: "After a meeting, a match, or a flight — Laterr sends a gentle check-in with three smart replies ready. Never awkward. Never robotic.",
    image: "/assets/images/workflow-followup.jpg",
    alt: "An AI companion chat bubble asking a warm follow-up question",
    bullets: [
      "One-tap smart replies drafted for you",
      "Gentle payment nudges to both sides",
      "Never sent without your say-so",
    ],
  },
  {
    n: "04",
    icon: Plane,
    pill: "Everyday flow",
    title: "Ride through your day, effortlessly",
    body: "Directions in one tap, boarding time buffers, live match scores, payment nudges — the small stuff handled so you can be present.",
    image: "/assets/images/workflow-travel.jpg",
    alt: "A traveler in an airport checking a trip itinerary on their phone",
    reverse: true,
    bulletIcon: BellRing,
    bullets: [
      "Google Maps on web/Android, Apple Maps on iOS",
      "Live full-time scores after your match",
      "Landing-time check-ins after you touch down",
    ],
  },
]

const PERSONAS = [
  {
    title: "Creators",
    body: "Content calendar, brand-deal payments, release-day countdowns.",
  },
  { title: "Artists", body: "Tour routes, royalty check-ins, distribution timelines." },
  { title: "Families", body: "Shared calendar, location sharing, household tasks." },
  { title: "Enterprise", body: "Executive itineraries, RSVPs, confidential mode." },
] as const

/** Small caps label above each section heading. */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-primary text-xs tracking-widest uppercase">{children}</p>
  )
}

export default function LandingPage() {
  return (
    <>
      {/* ---------------------------------------------------------- hero -- */}
      <section className="relative overflow-hidden">
        {/* A soft brand wash rather than the original coral/plum gradients,
            which have no equivalent in the blue palette. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-70"
          style={{
            background:
              "radial-gradient(1000px 500px at 20% 0%, oklch(0.72 0.132 243.2 / 0.18), transparent), radial-gradient(800px 500px at 90% 30%, oklch(0.625 0.152 243.2 / 0.12), transparent)",
          }}
        />

        <div className="mx-auto grid max-w-6xl gap-12 px-4 pt-20 pb-20 sm:px-6 md:grid-cols-[1.1fr_1fr] md:items-center md:pt-28 md:pb-24">
          <div>
            <p className="border-border/60 bg-card/60 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs backdrop-blur">
              <Sparkles className="text-primary h-3.5 w-3.5" />
              The world&apos;s first AI-powered scheduling ecosystem
            </p>

            <h1 className="font-heading mt-6 text-5xl leading-[1.05] md:text-7xl">
              Your calendar,{" "}
              <span className="text-primary italic">
                but it actually knows you.
              </span>
            </h1>

            <p className="text-muted-foreground mt-6 max-w-xl text-lg md:text-xl">
              Laterr organizes meetings, payments, flights and match days — then
              follows up like a friend who genuinely cares how it went.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-12 rounded-full px-7">
                <Link href="/auth">Start free — one schedule on us</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full px-7"
              >
                <Link href="/pricing">See pricing</Link>
              </Button>
            </div>

            <p className="text-muted-foreground mt-4 text-xs">
              No credit card. 1 free schedule to try the whole thing.
            </p>
          </div>

          <div className="relative">
            <div
              aria-hidden
              className="from-primary/30 via-primary/20 to-primary/10 absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br blur-2xl"
            />
            <div className="ring-border/60 relative aspect-4/5 w-full overflow-hidden rounded-[2rem] shadow-2xl ring-1">
              <Image
                src="/assets/images/hero-portrait.webp"
                alt="A person smiling while checking their Laterr schedule"
                fill
                priority
                sizes="(min-width: 768px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="border-border/60 bg-card/90 absolute -bottom-6 -left-6 hidden rounded-2xl border px-4 py-3 shadow-lg backdrop-blur md:block">
              <p className="text-primary text-[10px] tracking-widest uppercase">
                Just now
              </p>
              <p className="font-heading mt-1 text-sm">
                &ldquo;How did coffee with Amara go?&rdquo; ✨
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- categories -- */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <Eyebrow>One app, every moment</Eyebrow>
          <h2 className="font-heading mt-3 text-3xl md:text-5xl">
            Built for the shape of a real life.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((category, index) => {
            const Icon = CATEGORY_ICONS[index]

            return (
              <div
                key={category.title}
                className="border-border/60 bg-card rounded-3xl border p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <Icon className="text-primary h-6 w-6" />
                <h3 className="font-heading mt-4 text-xl">{category.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm">
                  {category.body}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ------------------------------------------------ product visual -- */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="border-border/60 bg-card grid gap-10 rounded-[2rem] border p-6 md:grid-cols-[1.1fr_1fr] md:p-10">
          <div className="relative min-h-64 overflow-hidden rounded-2xl">
            <Image
              src="/assets/images/calendar-ui.webp"
              alt="Laterr calendar interface floating in space"
              fill
              loading="lazy"
              sizes="(min-width: 768px) 55vw, 100vw"
              className="object-cover"
            />
          </div>

          <div className="flex flex-col justify-center">
            <Eyebrow>Beautifully organized</Eyebrow>
            <h2 className="font-heading mt-3 text-3xl leading-tight md:text-5xl">
              Every plan, gently pinned to your day.
            </h2>
            <p className="text-muted-foreground mt-5">
              A calendar that reads like a story — meetings, payments, flights
              and matches held together by warm, intelligent context.
            </p>
            <div className="text-muted-foreground mt-6 flex flex-wrap gap-2 text-xs">
              {[
                "Voice capture",
                "Warm follow-ups",
                "One-tap directions",
                "Booking links",
              ].map((chip) => (
                <span
                  key={chip}
                  className="border-border/60 rounded-full border px-3 py-1"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- four steps -- */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="max-w-2xl">
          <Eyebrow>How Laterr works</Eyebrow>
          <h2 className="font-heading mt-3 text-2xl sm:text-3xl md:text-5xl">
            Four gentle steps from a thought to a plan.
          </h2>
          <p className="text-muted-foreground mt-3 text-sm sm:mt-4 sm:text-base">
            Speak it, see it organized, get a warm follow-up, and travel through
            your day without a second thought.
          </p>
        </div>

        <ol className="mt-8 space-y-6 sm:mt-12 sm:space-y-10">
          {STEPS.map((step, index) => {
            const BulletIcon = step.bulletIcon ?? CheckCircle2

            return (
              <li
                key={step.n}
                className={`border-border/60 bg-card grid gap-5 rounded-3xl border p-4 sm:gap-8 sm:p-6 md:grid-cols-[1.1fr_1fr] md:items-center md:gap-10 md:rounded-[2rem] md:p-10 ${
                  step.reverse ? "md:[&>div:first-child]:order-2" : ""
                }`}
              >
                <div className="relative aspect-6/5 max-h-[420px] overflow-hidden rounded-2xl">
                  <Image
                    src={step.image}
                    alt={step.alt}
                    fill
                    // Only the first step is above the fold on most viewports.
                    loading={index === 0 ? "eager" : "lazy"}
                    sizes="(min-width: 768px) 640px, 100vw"
                    className="object-cover"
                  />
                  <span className="bg-card/90 text-primary absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-medium shadow-sm backdrop-blur">
                    Step {step.n}
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="border-border/60 bg-secondary/60 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
                    <step.icon className="text-primary h-3.5 w-3.5" />
                    {step.pill}
                  </div>
                  <h3 className="font-heading mt-3 text-2xl leading-tight sm:mt-4 sm:text-3xl md:text-4xl">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground mt-3 text-sm sm:mt-4 sm:text-base">
                    {step.body}
                  </p>
                  <ul className="text-foreground/80 mt-5 space-y-2 text-sm">
                    {step.bullets.map((line) => (
                      <li key={line} className="flex items-start gap-2">
                        <BulletIcon className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      {/* ------------------------------------------ feature highlights -- */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const Icon = FEATURE_ICONS[index]

            return (
              <div
                key={feature.title}
                className="border-border/60 bg-secondary/40 rounded-3xl border p-8"
              >
                <Icon className="text-primary h-6 w-6" />
                <h3 className="font-heading mt-4 text-2xl leading-tight">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                  {feature.body}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ------------------------------------------------ persona strip -- */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="border-border/60 from-primary/10 via-background to-primary/5 rounded-[2rem] border bg-gradient-to-br p-6 sm:p-10 md:p-14">
          <Eyebrow>Tailored dashboards</Eyebrow>
          <h2 className="font-heading mt-3 max-w-2xl text-3xl md:text-5xl">
            Whoever you are, Laterr fits.
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {[
              {
                image: "/assets/images/persona-creator.jpg",
                alt: "A creator working from a sunlit café",
                title: "Creators & Artists",
                body: "Content calendars, brand-deal payments, tour routes and release-day countdowns — one calm home.",
              },
              {
                image: "/assets/images/persona-family.jpg",
                alt: "A family sharing a moment around a tablet",
                title: "Families & Enterprise",
                body: "Shared calendars, executive itineraries, RSVPs and confidential mode — beautiful for the whole household or the whole company.",
              },
            ].map((persona) => (
              <div
                key={persona.title}
                className="border-border/60 bg-card overflow-hidden rounded-2xl border"
              >
                <div className="relative h-56 w-full">
                  <Image
                    src={persona.image}
                    alt={persona.alt}
                    fill
                    loading="lazy"
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-heading text-2xl">{persona.title}</h3>
                  <p className="text-muted-foreground mt-2 text-sm">
                    {persona.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PERSONAS.map((persona) => (
              <div
                key={persona.title}
                className="bg-card/70 rounded-2xl p-6 backdrop-blur"
              >
                <h3 className="font-heading text-xl">{persona.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm">
                  {persona.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- cta -- */}
      <section className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6">
        <h2 className="font-heading text-4xl md:text-6xl">
          The gentlest calendar you&apos;ll ever keep.
        </h2>
        <p className="text-muted-foreground mx-auto mt-5 max-w-xl text-lg">
          Try it free. Add one schedule. See what happens when your calendar
          actually listens.
        </p>
        <Button asChild size="lg" className="mt-8 h-12 rounded-full px-8">
          <Link href="/auth">Create your account</Link>
        </Button>
      </section>
    </>
  )
}
