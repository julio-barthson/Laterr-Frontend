import type { Metadata } from "next"

import { AuthForm } from "./auth-form"

export const metadata: Metadata = {
  title: "Sign in — Laterr",
  description: "Sign in to Laterr — the AI-powered scheduling ecosystem.",
}

export default async function AuthPage(props: {
  searchParams: Promise<{ next?: string }>
}) {
  // searchParams is a Promise as of Next 16 — synchronous access was removed.
  const { next } = await props.searchParams

  return <AuthForm next={next} />
}
