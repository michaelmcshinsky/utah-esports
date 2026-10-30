import Link from "next/link";
import { desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import {
  authzEvents,
  communities,
  eventOccurrences,
  eventSubmissions,
  games,
  linkChecks,
  organizations,
  reports,
  teams,
  venues,
} from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { getAllStateSlugs, getStateConfig } from "@/src/lib/states/registry";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin overview", robots: { index: false } };

type StateCounts = {
  state: string;
  events: number;
  communities: number;
  venues: number;
  orgs: number;
  teams: number;
  games: number;
};

async function countsByState(): Promise<StateCounts[]> {
  const database = db();
  const [ev, co, ve, or_, te, gm] = await Promise.all([
    database
      .select({ state: eventOccurrences.state, n: sql<number>`count(*)::int` })
      .from(eventOccurrences)
      .groupBy(eventOccurrences.state),
    database
      .select({ state: communities.state, n: sql<number>`count(*)::int` })
      .from(communities)
      .groupBy(communities.state),
    database
      .select({ state: venues.state, n: sql<number>`count(*)::int` })
      .from(venues)
      .groupBy(venues.state),
    database
      .select({ state: organizations.state, n: sql<number>`count(*)::int` })
      .from(organizations)
      .groupBy(organizations.state),
    database
      .select({ state: teams.state, n: sql<number>`count(*)::int` })
      .from(teams)
      .groupBy(teams.state),
    database.select({ n: sql<number>`count(*)::int` }).from(games),
  ]);

  const watched = [...new Set(getAllStateSlugs().map((s) => getStateConfig(s)?.stateCode ?? s))];
  return watched.map((state) => ({
    state,
    events: ev.find((r) => r.state === state)?.n ?? 0,
    communities: co.find((r) => r.state === state)?.n ?? 0,
    venues: ve.find((r) => r.state === state)?.n ?? 0,
    orgs: or_.find((r) => r.state === state)?.n ?? 0,
    teams: te.find((r) => r.state === state)?.n ?? 0,
    games: gm[0]?.n ?? 0,
  }));
}

export default async function AdminOverviewPage() {
  const database = db();
  const [perState, pendingSubs, needsVerification, openReports, staleLinks, recentDenials] =
    await Promise.all([
      countsByState(),
      database
        .select({ n: sql<number>`count(*)::int` })
        .from(eventSubmissions)
        .where(eq(eventSubmissions.status, "pending")),
      database
        .select({ n: sql<number>`count(*)::int` })
        .from(eventOccurrences)
        .where(eq(eventOccurrences.status, "needs_verification")),
      database
        .select({ n: sql<number>`count(*)::int` })
        .from(reports)
        .where(eq(reports.status, "open")),
      database
        .select({ n: sql<number>`count(*)::int` })
        .from(linkChecks)
        .where(isNotNull(linkChecks.consecutiveFailures)),
      database
        .select({
          id: authzEvents.id,
          action: authzEvents.action,
          permission: authzEvents.permission,
          decision: authzEvents.decision,
          createdAt: authzEvents.createdAt,
        })
        .from(authzEvents)
        .where(inArray(authzEvents.decision, ["deny"]))
        .orderBy(desc(authzEvents.createdAt))
        .limit(8),
    ]);

  const totalGames = perState[0]?.games ?? 0;
  const cards = [
    { label: "Pending submissions", value: pendingSubs[0]?.n ?? 0, href: "/admin/submissions" },
    { label: "Needs verification", value: needsVerification[0]?.n ?? 0, href: "/admin/events" },
    { label: "Open reports", value: openReports[0]?.n ?? 0 },
    { label: "Checked links failing", value: staleLinks[0]?.n ?? 0 },
    { label: "Games in catalog", value: totalGames },
  ];

  return (
    <div className="page-container py-8 space-y-10">
      <div>
        <h1 className="font-display text-2xl font-bold text-charcoal-900">Overview</h1>
        <p className="mt-1 text-sm text-charcoal-600">
          Same platform, same accounts — every state app reads the same auth tables; content rows
          carry a two-letter state code.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <Link key={c.label} href={c.href ?? "#"} className="rounded-card border border-charcoal-200 bg-white p-5 lift">
            <p className="text-xs uppercase tracking-wide text-charcoal-500">{c.label}</p>
            <p className="mt-1 font-display text-3xl font-bold text-charcoal-900">{c.value}</p>
          </Link>
        ))}
      </div>

      <section aria-labelledby="states-heading">
        <h2 id="states-heading" className="section-title">Content by state</h2>
        <div className="mt-8 overflow-x-auto rounded-card border border-charcoal-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-charcoal-200 text-left text-xs uppercase tracking-wide text-charcoal-500">
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3">Events</th>
                <th className="px-4 py-3">Communities</th>
                <th className="px-4 py-3">Venues</th>
                <th className="px-4 py-3">Organizations</th>
                <th className="px-4 py-3">Teams</th>
                <th className="px-4 py-3">Manage</th>
              </tr>
            </thead>
            <tbody>
              {perState.map((r) => {
                return (
                  <tr key={r.state} className="border-b border-charcoal-100 last:border-0">
                    <td className="px-4 py-3 font-semibold text-charcoal-900">{r.state}</td>
                    <td className="px-4 py-3">{r.events}</td>
                    <td className="px-4 py-3">{r.communities}</td>
                    <td className="px-4 py-3">{r.venues}</td>
                    <td className="px-4 py-3">{r.orgs}</td>
                    <td className="px-4 py-3">{r.teams}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/events?state=${r.state}`} className="text-redrock-600 hover:underline">
                        Events →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="authz-heading">
        <h2 id="authz-heading" className="section-title">Recent authz denials</h2>
        {recentDenials.length === 0 ? (
          <p className="mt-6 text-sm text-charcoal-600">No denials recorded.</p>
        ) : (
          <ul className="mt-6 space-y-2 text-sm text-charcoal-700">
            {recentDenials.map((e) => (
              <li key={e.id} className="rounded-lg border border-charcoal-200 bg-white px-4 py-2.5">
                <span className="font-mono text-xs">{e.decision}</span>{" "}
                <span className="font-medium">{e.action}</span>
                {e.permission ? <span> · <span className="font-mono text-xs">{e.permission}</span></span> : null}
                <span className="text-charcoal-500"> · {e.createdAt.toISOString().slice(0, 16).replace("T", " ")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
