import { SiteNav } from "@/src/components/site-nav";
import { SiteFooter } from "@/src/components/site-footer";

/**
 * Chrome for the legacy (non-state-scoped) routes: /events, /communities,
 * /dashboard, … The root layout only provides html/body, so these pages
 * get one nav/footer each — state pages keep their own chrome in
 * [state]/layout.tsx without double-wrapping.
 */
export default function SiteChromeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
