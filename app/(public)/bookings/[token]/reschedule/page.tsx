import type { Metadata } from "next"

import { RescheduleFlow } from "./reschedule-flow"

export const metadata: Metadata = {
  title: "Reschedule — Laterr",
  robots: { index: false, follow: false },
}

export default async function ReschedulePage(props: {
  params: Promise<{ token: string }>
}) {
  const { token } = await props.params

  return <RescheduleFlow token={token} />
}
