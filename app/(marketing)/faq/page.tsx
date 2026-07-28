import type { Metadata } from "next"
import Link from "next/link"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { FAQ } from "@/lib/marketing-content"

export const metadata: Metadata = {
  title: "FAQ — Laterr",
  description: "Answers about Laterr, its AI, booking links and pricing.",
  alternates: { canonical: "/faq" },
}

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <header>
        <h1 className="font-heading text-4xl md:text-5xl">
          Frequently asked questions
        </h1>
        <p className="text-muted-foreground mt-4">
          Still stuck?{" "}
          <Link href="/contact" className="text-foreground underline">
            Get in touch
          </Link>
          .
        </p>
      </header>

      <Accordion type="single" collapsible className="mt-10">
        {FAQ.map((entry, index) => (
          <AccordionItem key={entry.q} value={`item-${index}`}>
            <AccordionTrigger className="text-left">{entry.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {entry.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="border-border/40 mt-12 border-t pt-8">
        <p className="font-heading text-2xl">Ready to try it?</p>
        <Button asChild className="mt-4 rounded-full">
          <Link href="/auth">Start with one free schedule</Link>
        </Button>
      </div>

      {/*
        FAQPage structured data. Emitted from the same array the page renders, so
        the markup and the schema can never drift apart.
      */}
      <script
        type="application/ld+json"
        // The content is our own static copy, not user input.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((entry) => ({
              "@type": "Question",
              name: entry.q,
              acceptedAnswer: { "@type": "Answer", text: entry.a },
            })),
          }),
        }}
      />
    </div>
  )
}
