import type { Metadata } from "next"

import { LegalPage } from "@/components/legal-page"

export const metadata: Metadata = {
  title: "Terms — Laterr",
  description: "The terms that apply to using Laterr.",
  alternates: { canonical: "/terms" },
}

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      updated="26 July 2026"
      intro="By creating a Laterr account you agree to these terms. They are written to be read, not to be impressive."
      sections={[
        {
          heading: "Your account",
          paragraphs: [
            "You are responsible for what happens under your account, including keeping your password to yourself. Tell us promptly if you think someone else has access.",
            "You must be old enough to enter a contract where you live.",
          ],
        },
        {
          heading: "The free trial",
          paragraphs: [
            "Every account includes one free schedule across any category. Cancelled and completed schedules still count toward that allowance, so the trial covers one schedule in total rather than one at a time. Upgrade for unlimited schedules.",
          ],
        },
        {
          heading: "Billing",
          paragraphs: [
            "Paid plans bill monthly or annually in advance. You can cancel at any time and keep access until the end of the period you have paid for. We do not refund partial periods unless the law where you live requires it.",
          ],
        },
        {
          heading: "Acceptable use",
          paragraphs: [
            "Do not use Laterr to send unsolicited messages, to impersonate someone, or to break the law. Do not try to access another account's data or interfere with the service.",
          ],
        },
        {
          heading: "Bookings between you and your invitees",
          paragraphs: [
            "Laterr provides the scheduling tool. Any agreement about what happens in a booked meeting is between you and your invitee — we are not a party to it.",
          ],
        },
        {
          heading: "Availability of the service",
          paragraphs: [
            "We aim to keep Laterr running continuously but do not promise uninterrupted service. Maintenance windows are announced in the app when we can plan them in advance.",
          ],
        },
        {
          heading: "Ending your account",
          paragraphs: [
            "You can delete your account at any time. We may suspend an account that breaks these terms, and will explain why unless doing so would be unlawful.",
          ],
        },
        {
          heading: "Changes",
          paragraphs: [
            "If we change these terms materially we will say so in the app before the change takes effect.",
          ],
        },
      ]}
    />
  )
}
