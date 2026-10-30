import Link from "next/link";
import { and, desc, eq, inArray } from "drizzle-orm";
import { eventOccurrences } from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { getAllStateSlugs, getStateConfig } from "@/src/lib/states/registry";
import { setEventStatus } from "../actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin · Events", robots: { index: false } };

const STATUS_OPTIONS = [
  "draft",
  "published",
  "postponed",
  "cancelled",
  "needs_verification",
] as const;

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const stateFilter = typeof params.state === "string" ? params.state : null;
  const error = typeof params.error === "string" ? params.error : null;
  const ok = typeof params.ok === "string" ? params.ok : null;

  const states = getAllStateSlugs().map((s) => ({
    slug: s,
    code: getStateConfig(s)?.stateCode ?? s.toUpperCase(),
  }));
  const activeCode = stateFilter ? (states.find((s) => s.code === stateFilter)?.code ?? null) : null;

  const rows = await db()
    .select({
      id: eventOccurrences.id,
      slug: eventOccurrences.slug,
      title: eventOccurrences.title,
      state: eventOccurrences.state,
      city: eventOccurrences.city,
      status: eventOccurrences.status,
      startsAt: eventOccurrences.startsAt,
      updatedAt: eventOccurrences.updatedAt,
    })
    .from(eventOccurrences)
    .where(
      activeCode
        ? and(
            inArray(eventOccurrences.status, STATUS_OPTIONS),
            eq(eventOccurrences.state, activeCode),
          )
        : inArray(eventOccurrences.status, STATUS_OPTIONS),
    )
    .orderBy(desc(eventOccurrences.updatedAt))
    .limit(100);

  return (
    <div className="page-container py-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-charcoal-900">Events</h1>
        <p className="mt-1 text-sm text-charcoal-600">
          Newest 100. Status changes are audited to `audit_logs` and require
          `platform:manage_content`.
        </p>
      </div>

      {error ? (
        <p role="status" className="rounded-lg bg-danger-100 px-4 py-2 text-sm font-medium text-danger-600">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p role="status" className="rounded-lg bg-success-100 px-4 py-2 text-sm font-medium text-success-700">
          {ok}
        </p>
      ) : null}

      <nav aria-label="State filter" className="flex flex-wrap gap-2">
        <Link
          href="/admin/events"
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
            !activeCode ? "bg-charcoal-900 text-white" : "border border-charcoal-300 bg-white text-charcoal-700 hover:border-charcoal-400"
          }`}
        >
          All states
        </Link>
        {states.map((s) => (
          <Link
            key={s.slug}
            href={`/admin/events?state=${s.code}`}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
              activeCode === s.code
                ? "bg-charcoal-900 text-white"
                : "border border-charcoal-300 bg-white text-charcoal-700 hover:border-charcoal-400"
            }`}
          >
            {s.code}
          </Link>
        ))}
      </nav>

      <div className="overflow-x-auto rounded-card border border-charcoal-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-charcoal-200 text-left text-xs uppercase tracking-wide text-charcoal-500">
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Starts</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Set status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id} className="border-b border-charcoal-100 last:border-0 align-top">
                <td className="px-4 py-3">
                  <Link href={`/events/${e.slug}`} className="font-medium text-charcoal-900 hover:text-redrock-600">
                    {e.title}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{e.state}</td>
                <td className="px-4 py-3 text-charcoal-600">{e.city ?? "—"}</td>
                <td className="px-4 py-3 text-charcoal-600">
                  {e.startsAt.toISOString().slice(0, 16).replace("T", " ")}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-charcoal-100 px-2 py-0.5 text-xs font-semibold text-charcoal-700">
                    {e.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <form action={setEventStatus} className="flex items-center gap-2">
                    <input type="hidden" name="eventId" value={e.id} />
                    <select
                      name="status"
                      defaultValue={e.status}
                      className="rounded-lg border border-charcoal-300 bg-white px-2 py-1.5 text-xs"
                      aria-label={`New status for ${e.title}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-lg bg-charcoal-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-charcoal-700"
                    >
                      Save
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-charcoal-500">
                  No events match this filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
