import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { eventSubmissions } from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { getAllStateSlugs, getStateConfig } from "@/src/lib/states/registry";
import { reviewSubmission } from "../actions";
import { getCsrfToken } from "@/src/lib/csrf";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin · Submissions", robots: { index: false } };

/** Defensive field lookup — payload shape is validated upstream (zod),
 *  but the admin list must tolerate hand-edited rows. */
function field(payload: unknown, key: string): string {
  if (payload && typeof payload === "object" && key in payload) {
    const value = (payload as Record<string, unknown>)[key];
    return typeof value === "string" ? value : Array.isArray(value) ? value.join(", ") : "";
  }
  return "";
}

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminSubmissionsPage({
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
  const csrfToken = await getCsrfToken();

  const rows = await db()
    .select()
    .from(eventSubmissions)
    .where(activeCode ? eq(eventSubmissions.state, activeCode) : undefined)
    .orderBy(desc(eventSubmissions.createdAt))
    .limit(60);

  return (
    <div className="page-container py-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-charcoal-900">Submissions</h1>
        <p className="mt-1 text-sm text-charcoal-600">
          Incoming event submissions per state. Approve/reject requires `platform:moderate` and is
          audited. Creating the published event from an approved submission stays with the
          moderation workflow (`/moderation`).
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
          href="/admin/submissions"
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
            !activeCode ? "bg-charcoal-900 text-white" : "border border-charcoal-300 bg-white text-charcoal-700 hover:border-charcoal-400"
          }`}
        >
          All states
        </Link>
        {states.map((s) => (
          <Link
            key={s.slug}
            href={`/admin/submissions?state=${s.code}`}
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

      <ul className="space-y-4">
        {rows.map((s) => {
          const title = field(s.payload, "title") || "Untitled submission";
          const when = field(s.payload, "date") || field(s.payload, "startsAt");
          return (
            <li key={s.id} className="rounded-card border border-charcoal-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-charcoal-900">{title}</p>
                  <p className="mt-0.5 text-sm text-charcoal-600">
                    {s.state} · {s.contactEmail}
                    {when ? ` · ${when}` : ""}
                  </p>
                  {s.sourceUrl ? (
                    <a
                      href={s.sourceUrl}
                      className="mt-1 inline-block text-xs text-redrock-600 hover:underline"
                    >
                      source ↗
                    </a>
                  ) : null}
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    s.status === "pending"
                      ? "bg-gold-100 text-gold-600"
                      : s.status === "approved"
                        ? "bg-success-100 text-success-700"
                        : "bg-redrock-100 text-redrock-700"
                  }`}
                >
                  {s.status}
                </span>
              </div>
              {s.reviewNotes ? (
                <p className="mt-2 text-sm text-charcoal-600">Notes: {s.reviewNotes}</p>
              ) : null}
              <form action={reviewSubmission} className="mt-3 flex flex-wrap items-center gap-2">
                <input type="hidden" name="submissionId" value={s.id} />
                <input type="hidden" name="csrf_token" value={csrfToken} />
                <input
                  type="text"
                  name="notes"
                  placeholder="Review notes (optional)"
                  className="min-w-48 flex-1 rounded-lg border border-charcoal-300 px-3 py-1.5 text-sm"
                  aria-label={`Review notes for ${title}`}
                />
                <button
                  type="submit"
                  name="decision"
                  value="approved"
                  className="rounded-lg bg-pine-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-pine-600"
                >
                  Approve
                </button>
                <button
                  type="submit"
                  name="decision"
                  value="rejected"
                  className="rounded-lg bg-charcoal-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-charcoal-700"
                >
                  Reject
                </button>
              </form>
            </li>
          );
        })}
        {rows.length === 0 ? (
          <li className="rounded-card border-2 border-dashed border-charcoal-200 bg-white px-6 py-12 text-center text-sm text-charcoal-600">
            No submissions in this queue.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
