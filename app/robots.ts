import type { MetadataRoute } from "next"

import { absoluteUrl } from "@/lib/site"

/**
 * Crawl the marketing pages, nothing else.
 *
 * `/bookings/` matters most: those URLs carry a cancellation token, so an
 * indexed one is a leaked credential. The pages also set `noindex` themselves —
 * this is the belt to that braces, because a crawler that never fetches the page
 * never sees the meta tag.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/app",
          "/admin",
          "/owner",
          "/availability",
          "/chat",
          "/event-types",
          "/inbox",
          "/meetings",
          "/roles",
          "/schedules",
          "/settings",
          "/workspaces",
          "/auth",
          // Token-addressed, so never crawlable.
          "/bookings/",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  }
}
