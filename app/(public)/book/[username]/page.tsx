import type { Metadata } from "next"

import { HostPage } from "./host-page"

export async function generateMetadata(props: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await props.params

  return {
    title: `@${username} on Laterr`,
    description: `Book time with @${username}.`,
  }
}

export default async function BookHostPage(props: {
  params: Promise<{ username: string }>
}) {
  const { username } = await props.params

  return <HostPage username={username} />
}
