/**
 * Shared shell for the legal pages, which are all the same shape: a title, a
 * last-updated line, and a stack of headed sections.
 */
export interface LegalSection {
  heading: string
  paragraphs: string[]
  bullets?: string[]
}

export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string
  updated: string
  intro: string
  sections: LegalSection[]
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="font-heading text-4xl md:text-5xl">{title}</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Last updated {updated}
      </p>
      <p className="text-muted-foreground mt-6">{intro}</p>

      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-heading text-xl">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-muted-foreground mt-2 text-sm">
                {paragraph}
              </p>
            ))}
            {section.bullets && (
              <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5 text-sm">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
