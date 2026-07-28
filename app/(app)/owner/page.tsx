import type { Metadata } from "next"

import { OwnerView } from "./owner-view"

export const metadata: Metadata = {
  title: "Owner — Laterr",
  robots: { index: false, follow: false },
}

export default function OwnerPage() {
  return <OwnerView />
}
