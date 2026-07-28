import type { Metadata } from "next"

import { AvailabilityEditor } from "./availability-editor"

export const metadata: Metadata = {
  title: "Availability — Laterr",
}

export default function AvailabilityPage() {
  return <AvailabilityEditor />
}
