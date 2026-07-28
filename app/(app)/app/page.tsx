import type { Metadata } from "next"

import { Dashboard } from "./dashboard"

export const metadata: Metadata = {
  title: "Home — Laterr",
}

export default function AppPage() {
  return <Dashboard />
}
