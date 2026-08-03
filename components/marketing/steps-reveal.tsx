"use client"

import { useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(useGSAP, ScrollTrigger)

interface StepsRevealProps {
  className?: string
  children: React.ReactNode
}

/**
 * Scroll-reveal for the "how it works" steps.
 *
 * This renders the `<ol>` itself rather than wrapping it in an extra element,
 * so the steps passed as `children` stay server-rendered — only the animation
 * code ships to the client.
 *
 * Every step is marked up by the page with `data-step`, and its two columns
 * with `data-step-media` / `data-step-copy`. Reading those instead of walking
 * `children` keeps this decoupled from the card's layout, which flips sides on
 * alternating steps.
 */
export function StepsReveal({ className, children }: StepsRevealProps) {
  const scope = useRef<HTMLOListElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      // Everything below is opt-in: with reduced motion the steps render at
      // their natural state and no `from()` ever hides them.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const steps = gsap.utils.toArray<HTMLLIElement>(
          "[data-step]",
          scope.current
        )

        steps.forEach((step) => {
          const media = step.querySelector("[data-step-media]")
          const copy = step.querySelector("[data-step-copy]")
          // The bullet list animates on its own beat, so it is excluded here.
          const copyLines = copy?.querySelectorAll(":scope > :not(ul)") ?? []
          const bullets = copy?.querySelectorAll("ul > li") ?? []

          // Steps that place the image on the right drift in from the right.
          const reversed = step.dataset.stepReverse !== undefined

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: step,
              start: "top 78%",
              once: true,
            },
            defaults: { ease: "power2.out", duration: 0.7 },
          })

          tl.from(step, { autoAlpha: 0, y: 32 })
            .from(
              media,
              {
                autoAlpha: 0,
                scale: 1.06,
                xPercent: reversed ? 3 : -3,
                duration: 0.9,
              },
              "<0.05"
            )
            .from(
              copyLines,
              { autoAlpha: 0, y: 16, duration: 0.55, stagger: 0.08 },
              "<0.15"
            )
            .from(
              bullets,
              { autoAlpha: 0, y: 10, duration: 0.45, stagger: 0.07 },
              "<0.2"
            )
        })
      })

      return () => mm.revert()
    },
    { scope }
  )

  return (
    <ol ref={scope} className={className}>
      {children}
    </ol>
  )
}
