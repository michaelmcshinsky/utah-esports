import { JsonLd } from "@/src/components/json-ld";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/src/lib/site";

/** WebSite structured data for the homepage (search + site links). */
export function WebsiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        description: `${SITE_TAGLINE} Find Utah tournaments, gaming communities, teams, and places to play.`,
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/events?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
}
