import { JsonLd } from "@/src/components/json-ld";
import { SITE_URL } from "@/src/lib/site";

/** schema.org Organization for public org pages. */
export function OrganizationJsonLd({
  name,
  slug,
  description,
  websiteUrl,
  contactEmail,
  city,
  sameAs,
}: {
  name: string;
  slug: string;
  description?: string | null;
  websiteUrl?: string | null;
  contactEmail?: string | null;
  city?: string | null;
  sameAs?: Array<string | null>;
}) {
  const links = [websiteUrl, ...(sameAs ?? [])].filter((u): u is string => Boolean(u));
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name,
        url: `${SITE_URL}/organizations/${slug}`,
        description: description?.slice(0, 500) ?? undefined,
        email: contactEmail ?? undefined,
        address: city
          ? { "@type": "PostalAddress", addressLocality: city, addressRegion: "UT", addressCountry: "US" }
          : undefined,
        sameAs: links.length ? links : undefined,
      }}
    />
  );
}
