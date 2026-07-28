import type { Metadata } from "next"

import { ChatView } from "./chat-view"

export const metadata: Metadata = {
  title: "Laterr AI — Laterr",
  description: "Ask Laterr AI to handle anything on your account.",
  robots: { index: false, follow: false },
}

export default function ChatPage() {
  return <ChatView />
}
