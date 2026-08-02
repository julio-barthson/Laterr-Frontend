import type { Metadata } from "next"

import { VerifyEmailView } from "./verify-view"

export const metadata: Metadata = {
  title: "Confirm your email — Laterr",
  robots: { index: false, follow: false },
}

export default async function VerifyEmailPage(props: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await props.searchParams

  return <VerifyEmailView token={token} />
}
