import type { Metadata } from "next"

import { BookingFlow } from "@/components/booking/booking-flow"

export async function generateMetadata(props: {
  params: Promise<{ username: string; slug: string }>
}): Promise<Metadata> {
  const { username } = await props.params

  return {
    title: `Book with @${username} — Laterr`,
    description: "Pick a time that works for you.",
  }
}

export default async function BookEventPage(props: {
  params: Promise<{ username: string; slug: string }>
}) {
  const { username, slug } = await props.params

  return <BookingFlow username={username} slug={slug} />
}
