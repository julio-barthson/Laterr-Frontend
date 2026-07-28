"use client"

import * as React from "react"

/**
 * Last resort: a failure in the root layout itself, which `error.tsx` cannot
 * catch because it renders *inside* that layout.
 *
 * It has to supply its own `<html>` and `<body>` for that reason, and it cannot
 * rely on the layout's fonts, providers, or theme having loaded — so the styles
 * here are inline rather than Tailwind classes.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
          padding: "1rem",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          background: "#ffffff",
          color: "#111827",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            Laterr could not start
          </h1>
          <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
            Something failed before the page could render.
          </p>
          {error.digest && (
            <p
              style={{
                color: "#6b7280",
                fontSize: "0.75rem",
                fontFamily: "monospace",
              }}
            >
              Reference: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1.25rem",
              borderRadius: "9999px",
              border: "none",
              background: "#008fdb",
              color: "#ffffff",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
