import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStateConfig, getAllStateSlugs } from "@/src/lib/states/registry";
import { StateNav, StateFooter } from "@utah-esports/shared";

/** Pre-render all known states at build time. */
export function generateStaticParams() {
  return getAllStateSlugs().map((slug) => ({ state: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state } = await params;
  const config = getStateConfig(state);
  if (!config) return { title: "Not found" };
  return {
    title: { default: config.siteName, template: `%s · ${config.siteName}` },
    description: config.description,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3131"),
    openGraph: {
      siteName: config.siteName,
      type: "website",
      locale: "en_US",
      images: [{ url: config.ogImage, width: 1200, height: 630, alt: config.siteName }],
    },
    twitter: {
      card: "summary_large_image",
      images: [config.ogImage],
    },
  };
}

const NAV_ITEMS = [
  { href: "/events", label: "Events" },
  { href: "/explore", label: "Explore" },
  { href: "/deadlines", label: "Deadlines" },
  { href: "/communities", label: "Communities" },
  { href: "/places", label: "Places to Play" },
  { href: "/schools", label: "Schools & Teams" },
  { href: "/organizers", label: "For Organizers" },
];

const UTILITY_LINKS = [
  { href: "/calendar/global.ics", label: "ICS feed" },
  { href: "/submit", label: "Submit an event" },
  { href: "/organizers", label: "How it works" },
];

export default async function StateLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ state: string }>;
}) {
  const { state } = await params;
  const config = getStateConfig(state);
  if (!config) notFound();

  const stateNav = NAV_ITEMS.map((item) => ({
    ...item,
    href: `/${config.slug}${item.href}`,
  }));
  const stateUtility = UTILITY_LINKS.map((item) => ({
    ...item,
    href: `/${config.slug}${item.href}`,
  }));

  return (
    <>
      <StateNav
        stateSlug={config.slug}
        stateName={config.name}
        logoSrc="/images/site/utah-esports-white-2.png"
        navItems={stateNav}
        utilityLinks={stateUtility}
      />
      <main id="main" className="flex-1">
        {children}
      </main>
      <StateFooter
        stateSlug={config.slug}
        stateName={config.siteName}
        logoSrc="/images/site/utah-esports-white-2.png"
        icsFeedHref={`/${config.slug}/calendar/global.ics`}
      />
    </>
  );
}
