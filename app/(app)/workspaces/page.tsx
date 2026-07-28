import type { Metadata } from "next"

import { WorkspacesView } from "./workspaces-view"

export const metadata: Metadata = {
  title: "Teams — Laterr",
  description: "Shared workspaces for families and organisations.",
}

export default function WorkspacesPage() {
  return <WorkspacesView />
}
