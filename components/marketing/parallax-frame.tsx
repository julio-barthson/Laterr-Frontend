"use client"

import { useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(useGSAP, ScrollTrigger)

/** Zoom applied to the image so it can drift without exposing an edge. */
const OVERSCAN = 1.2
/** Drift each way, as a percentage of the image's own height. */
const DRIFT = 8

interface ParallaxFrameProps {
  className?: string
  children: React.ReactNode
}

/**
 * Drifts the image inside a fixed, clipped frame as the frame crosses the
 * viewport.
 *
 * Renders the frame element itself so `children` — a server-rendered
 * `next/image` — stays on the server; only the scroll handler is client code.
 *
 * The frame must clip (`overflow-hidden`) and the image must fill it, which is
 * what `next/image`'s `fill` already does. `OVERSCAN` has to exceed `DRIFT` or
 * the drift will pull a bare corner into view at the extremes.
 */
export function ParallaxFrame({ className, children }: ParallaxFrameProps) {
  const scope = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const image = scope.current?.querySelector("img")
        if (!image) return

        gsap.fromTo(
          image,
          { yPercent: -DRIFT, scale: OVERSCAN },
          {
            yPercent: DRIFT,
            scale: OVERSCAN,
            // Linear, because scroll position is the clock here.
            ease: "none",
            scrollTrigger: {
              trigger: scope.current,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        )
      })

      return () => mm.revert()
    },
    { scope }
  )

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  )
}
