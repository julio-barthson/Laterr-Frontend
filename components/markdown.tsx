"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"

import { cn } from "@/lib/utils"

/**
 * Renders the assistant's Markdown.
 *
 * No `rehype-raw`: the system prompt asks for Markdown, but the reply is still
 * model output that can quote a user's own text, and enabling raw HTML would
 * make any `<script>` in that text executable. react-markdown escapes HTML by
 * default and that default is the security property here, so it is left alone.
 *
 * Links open in a new tab with `noopener noreferrer` — they come from web_search
 * results, so they are arbitrary third-party URLs.
 */
export function Markdown({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "space-y-2 text-sm leading-relaxed [&_code]:bg-muted [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em] [&_li]:ml-4 [&_li]:list-disc [&_ol_li]:list-decimal [&_pre]:bg-muted [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:p-3 [&_strong]:font-semibold",
        className
      )}
    >
      <ReactMarkdown
        components={{
          a: ({ href, children: content }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              {content}
            </a>
          ),
          // Headings inside a chat bubble should not be page-sized.
          h1: ({ children: content }) => (
            <p className="text-base font-semibold">{content}</p>
          ),
          h2: ({ children: content }) => (
            <p className="text-sm font-semibold">{content}</p>
          ),
          h3: ({ children: content }) => (
            <p className="text-sm font-semibold">{content}</p>
          ),
          // Wide tables must scroll inside the bubble, not widen the page.
          table: ({ children: content }) => (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">{content}</table>
            </div>
          ),
          th: ({ children: content }) => (
            <th className="border-border border-b px-2 py-1 text-left font-medium">
              {content}
            </th>
          ),
          td: ({ children: content }) => (
            <td className="border-border/50 border-b px-2 py-1">{content}</td>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
