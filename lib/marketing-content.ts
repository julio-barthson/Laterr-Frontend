/**
 * Marketing copy, ported verbatim from the Lovable build so the pages say the
 * same things. Kept in one module rather than inline in each page: the pricing
 * table and FAQ are referenced from more than one place, and content edits
 * shouldn't mean touching JSX.
 */

export interface Plan {
  name: string
  /**
   * The tier this card sells, matching the API's PurchasableTier. Absent for
   * Enterprise, which is a sales conversation rather than a checkout.
   */
  tier?: "individual" | "family" | "business"
  price: string
  period: string
  yearly: string
  features: string[]
  highlight: boolean
}

export const PLANS: Plan[] = [
  {
    name: "Individual",
    tier: "individual",
    price: "$8.99",
    period: "/month",
    yearly: "or $79.99 / year",
    features: [
      "Unlimited schedules",
      "AI voice & text capture",
      "Warm AI follow-ups",
      "Booking links",
      "Map integrations",
    ],
    highlight: false,
  },
  {
    name: "Family",
    tier: "family",
    price: "$14.99",
    period: "/month",
    yearly: "or $149 / year",
    features: [
      "Everything in Individual",
      "Up to 4 seats",
      "Shared calendar",
      "Location sharing",
      "Household tasks",
    ],
    highlight: true,
  },
  {
    name: "Business",
    tier: "business",
    price: "$29.99",
    period: "/month",
    yearly: "or $299 / year",
    features: [
      "Up to 10 seats",
      "Team availability",
      "RSVP workflows",
      "Priority support",
    ],
    highlight: false,
  },
  {
    name: "Enterprise",
    price: "$799",
    period: "/month",
    yearly: "or $8,999 / year",
    features: [
      "50+ seats",
      "Confidential itineraries",
      "Role-based access",
      "SLA support",
      "Custom onboarding",
    ],
    highlight: false,
  },
]

export interface FaqEntry {
  q: string
  a: string
}

export const FAQ: FaqEntry[] = [
  {
    q: "What is Laterr?",
    a: "An AI-powered scheduling ecosystem. It handles meetings, payments, flights, match days and tasks — then follows up afterwards like a friend who genuinely cares how it went.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. Laterr runs in the browser. Add it to your home screen and it behaves like an app.",
  },
  {
    q: "Is there a free version?",
    a: "Every account starts with one free schedule across any category, so you can try the whole flow before paying.",
  },
  {
    q: "What can Laterr AI actually do?",
    a: "It creates and edits schedules, sets up booking links and availability, drafts follow-ups, answers questions about your week, and can search the web when it needs current information.",
  },
  {
    q: "Can I talk to Laterr AI instead of typing?",
    a: "Yes. Voice capture turns a sentence like “remind me to pay Sarah $150 for rent next Tuesday at 4pm” into a structured schedule.",
  },
  {
    q: "Will the AI take actions without my permission?",
    a: "It only acts on what you ask it to. Anything it creates or changes shows up in your schedules where you can edit or undo it.",
  },
  {
    q: "How is Laterr different from Calendly?",
    a: "Booking links are one part of Laterr, not the whole product. Payments, travel, sports and tasks live alongside your meetings, and the AI follows up after each one.",
  },
  {
    q: "Can people book time with me?",
    a: "Yes. Set a username and publish an event type, and anyone with the link can pick a slot from your real availability.",
  },
  {
    q: "How do reschedules work?",
    a: "Every booking confirmation includes a private link. Invitees use it to move or cancel their own booking without emailing you.",
  },
  {
    q: "Does Laterr sync to my calendar?",
    a: "You can add any booking to Google, Outlook or Apple Calendar from the confirmation page. Two-way sync is on the roadmap.",
  },
  {
    q: "What are AI follow-ups?",
    a: "After a meeting, a match or a flight, Laterr checks in with a short warm message and three suggested replies — so the loop closes without you thinking about it.",
  },
  {
    q: "How much does Laterr cost?",
    a: "Individual is $8.99/month, Family $14.99, Business $29.99 and Enterprise $799. Annual billing is cheaper on every tier.",
  },
]

export const CATEGORIES = [
  {
    title: "Meetings",
    body: "Calendly-style booking links with Zoom, Meet, Teams and Webex baked in.",
  },
  {
    title: "Payments",
    body: "Track rent, invoices and subscriptions. Warm nudges to both sides.",
  },
  {
    title: "Flights & travel",
    body: "Landing-time buffers, itineraries and a check-in after you touch down.",
  },
  {
    title: "Sports & venues",
    body: "Book pitches, follow your team, get live scores after full-time.",
  },
] as const

export const FEATURES = [
  {
    title: "Voice or text — one line, one schedule",
    body: '"Remind me to pay Sarah $150 for rent next Tuesday at 4pm" becomes a structured event, priced and pinned to your day.',
  },
  {
    title: "AI follow-ups that feel like a friend",
    body: "After a meeting, a match, or a flight — a warm check-in and three smart replies waiting for you.",
  },
  {
    title: "Directions in one tap",
    body: "Venue names resolve into real addresses and route the way you like — Google Maps on web and Android, Apple Maps on iOS.",
  },
] as const
