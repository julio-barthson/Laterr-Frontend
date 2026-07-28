import type { Metadata } from "next"

import { LegalPage } from "@/components/legal-page"

export const metadata: Metadata = {
  title: "Privacy — Laterr",
  description: "How Laterr handles your data.",
  alternates: { canonical: "/privacy" },
}

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      updated="26 July 2026"
      intro="This policy explains what Laterr collects, why, and what we do with it. It describes the product as it actually behaves today, not what is planned."
      sections={[
        {
          heading: "What we collect",
          paragraphs: [
            "Only what the product needs to work:",
          ],
          bullets: [
            "Account details — email address, and a password hash if you signed up with one. We never store the password itself.",
            "Profile details — display name, username, avatar, timezone and, if you choose to add it, a phone number.",
            "Your schedules and bookings — including anything invitees type into your booking forms.",
            "Session records — the device and IP address a sign-in came from, so you can tell your own sessions apart.",
          ],
        },
        {
          heading: "What invitees see about you",
          paragraphs: [
            "A public booking page exposes six fields only: your username, display name, avatar, persona, timezone and the event types you have published. Your phone number and email address are never shown on a public page.",
          ],
        },
        {
          heading: "What we do not do",
          paragraphs: [
            "We do not sell your data, and we do not use it to train models. There is no advertising on Laterr, so there is nothing to profile you for.",
          ],
        },
        {
          heading: "Email",
          paragraphs: [
            "Laterr does not currently send booking confirmations, reminders or follow-up emails. When that changes, this section will say so, and the emails will be transactional rather than marketing.",
          ],
        },
        {
          heading: "AI features",
          paragraphs: [
            "When you use Laterr AI, the text of your request and the relevant parts of your schedule data are sent to our AI provider to generate a response. Voice capture sends the audio you record to a speech-to-text provider. Neither is used to train their models.",
          ],
        },
        {
          heading: "Retention and deletion",
          paragraphs: [
            "Deleting your account deletes your profile, schedules, event types, availability and bookings. Deletions cascade — there is no orphaned copy left behind.",
          ],
        },
        {
          heading: "Your rights",
          paragraphs: [
            "You can access, correct, export or delete your data at any time. If you are in the UK or EU, the GDPR rights of access, rectification, erasure, restriction, portability and objection apply, and you can exercise them by contacting us.",
          ],
        },
      ]}
    />
  )
}
