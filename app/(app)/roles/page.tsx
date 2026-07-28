import type { Metadata } from "next"

import { RolesView } from "./roles-view"

export const metadata: Metadata = {
  title: "Roles — Laterr",
  description: "Request additional access on your Laterr account.",
}

export default function RolesPage() {
  return <RolesView />
}
