import type { Metadata } from "next"

import { CaptureView } from "./capture-view"

export const metadata: Metadata = {
  title: "New schedule — Laterr",
  description: "Describe it in your own words and Laterr fills in the details.",
  robots: { index: false, follow: false },
}

export default function NewSchedulePage() {
  return <CaptureView />
}
