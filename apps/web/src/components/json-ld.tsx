/**
 * Structured data (JSON-LD) per Google's schema.org guidelines.
 * `<` is escaped so user-supplied text can never break out of the script.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
