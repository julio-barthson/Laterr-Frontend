import type { Metadata } from "next"

import { ForgotPasswordForm } from "./forgot-form"

export const metadata: Metadata = {
  title: "Reset your password — Laterr",
  description: "Get a link to choose a new Laterr password.",
  // A reset flow has no business in a search index.
  robots: { index: false, follow: false },
}

export default async function ForgotPasswordPage(props: {
  searchParams: Promise<{ email?: string }>
}) {
  // searchParams is a Promise as of Next 16 — synchronous access was removed.
  const { email } = await props.searchParams

  return <ForgotPasswordForm initialEmail={email} />
}
