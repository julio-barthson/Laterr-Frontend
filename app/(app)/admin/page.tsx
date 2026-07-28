import type { Metadata } from "next"

import { AdminView } from "./admin-view"

export const metadata: Metadata = {
  title: "Admin — Laterr",
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return <AdminView />
}
