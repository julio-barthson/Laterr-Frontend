import type { Metadata } from "next"

import { SettingsView } from "./settings-view"

export const metadata: Metadata = {
  title: "Profile — Laterr",
  description: "Your name, username, photo, and booking link.",
  robots: { index: false, follow: false },
}

export default function SettingsPage() {
  return <SettingsView />
}
