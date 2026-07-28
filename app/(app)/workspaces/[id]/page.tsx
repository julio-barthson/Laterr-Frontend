import type { Metadata } from "next"

import { WorkspaceDetailView } from "./workspace-detail-view"

export const metadata: Metadata = {
  title: "Team — Laterr",
}

/** Params are async in Next 16. */
export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <WorkspaceDetailView id={id} />
}
