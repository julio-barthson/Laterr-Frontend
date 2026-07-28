import type { Metadata } from "next"

import { BookingDetail } from "./booking-detail"

export const metadata: Metadata = {
  title: "Your booking — Laterr",
  // The token is the credential for this page, so it must never be indexed.
  robots: { index: false, follow: false },
}

export default async function BookingPage(props: {
  params: Promise<{ token: string }>
}) {
  const { token } = await props.params

  return <BookingDetail token={token} />
}
