import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePagePermission } from "@/src/lib/authz-guard";

const ADMIN_NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/notifications", label: "Notifications" },
];

/**
 * Admin shell. One guard here covers every admin page-view: any built-in
 * platform role at `moderator` rank or above holds `platform:moderate`,
 * which the overview/queues/events views all fall back to. The users page
 * raises the bar itself (platform:grant_roles), and every mutating server
 * action re-checks its own permission.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const guarded = await requirePagePermission("platform:moderate", "/sign-in?next=/admin");
  if ("redirectTo" in guarded) redirect(guarded.redirectTo);

  return (
    <>
      <div className="top-strip">
        <div className="page-container flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-1.5 text-xs">
          <span>Utah Esports admin — platform roles are global; content is scoped per state</span>
          <div className="flex items-center gap-4">
            <Link href="/utah" className="ts-link">
              Open public site
            </Link>
            <Link href="/dashboard" className="ts-link">
              Organizer dashboard
            </Link>
          </div>
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b border-charcoal-700/50 bg-charcoal-950/95 text-white backdrop-blur">
        <div className="page-container flex h-14 items-center justify-between gap-4">
          <Link href="/admin" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
            <span className="rounded bg-redrock-500 px-2 py-0.5 text-sm">ADMIN</span>
          </Link>
          <nav aria-label="Admin" className="flex flex-wrap items-center gap-1">
            {ADMIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-charcoal-300 hover:bg-charcoal-800 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main id="main" className="flex-1 pb-16">
        {children}
      </main>
    </>
  );
}
