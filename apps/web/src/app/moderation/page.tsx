import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@utah-esports/ui";
import { eventSubmissions, organizationClaims, reports, userProfiles } from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { getSessionUser } from "@/src/lib/session";

export const metadata: Metadata = { title: "Moderation" };
export const revalidate = 0;

export default async function ModerationPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  if (!user.isModerator) {
    return (
      <div className="page-container py-12">
        <h1 className="text-xl font-semibold">Moderation</h1>
        <p className="mt-2 text-sm text-charcoal-600">
          This console is for platform moderators. If you should have access, ask a site admin.
        </p>
      </div>
    );
  }
  const database = db();
  const [submissions, claimRows, reportRows] = await Promise.all([
    database
      .select()
      .from(eventSubmissions)
      .where(eq(eventSubmissions.status, "pending"))
      .orderBy(desc(eventSubmissions.createdAt))
      .limit(50),
    database
      .select({ claim: organizationClaims, profile: userProfiles })
      .from(organizationClaims)
      .leftJoin(userProfiles, eq(organizationClaims.userId, userProfiles.id))
      .where(eq(organizationClaims.status, "pending"))
      .orderBy(desc(organizationClaims.createdAt))
      .limit(50),
    database
      .select()
      .from(reports)
      .where(eq(reports.status, "open"))
      .orderBy(desc(reports.createdAt))
      .limit(50),
  ]);

  return (
    <div className="page-container py-8">
      <h1 className="font-display text-3xl font-bold">Moderation</h1>
      <p className="mt-1 text-sm text-charcoal-600">
        Human review for sensitive decisions — nothing here auto-merges or auto-publishes.
      </p>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Event submissions ({submissions.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {submissions.length === 0 ? (
              <p className="text-sm text-charcoal-600">Queue is empty.</p>
            ) : (
              submissions.map((s) => {
                const payload = s.payload as { title?: string; url?: string; startsAt?: string };
                return (
                  <div key={s.id} className="rounded-lg border border-charcoal-100 p-3 text-sm">
                    <p className="font-medium">{payload.title ?? "(untitled)"}</p>
                    <p className="text-charcoal-500">
                      {payload.startsAt?.slice(0, 10)} · {s.contactEmail}
                    </p>
                    {payload.url ? (
                      <a href={payload.url} className="text-redrock-600 hover:underline" rel="noopener noreferrer">
                        Source ↗
                      </a>
                    ) : null}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Org claims ({claimRows.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {claimRows.length === 0 ? (
              <p className="text-sm text-charcoal-600">Queue is empty.</p>
            ) : (
              claimRows.map(({ claim }) => (
                <div key={claim.id} className="rounded-lg border border-charcoal-100 p-3 text-sm">
                  <p className="font-medium">{claim.contactEmail}</p>
                  <a href={claim.proofUrl} className="text-redrock-600 hover:underline" rel="noopener noreferrer">
                    Proof ↗
                  </a>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Reports ({reportRows.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reportRows.length === 0 ? (
              <p className="text-sm text-charcoal-600">No open reports.</p>
            ) : (
              reportRows.map((r) => (
                <div key={r.id} className="rounded-lg border border-charcoal-100 p-3 text-sm">
                  <Badge variant={r.reason === "unsafe" ? "danger" : "warning"}>{r.reason}</Badge>
                  <p className="mt-1 text-charcoal-600">
                    {r.targetType}: {r.targetId.slice(0, 8)}…
                  </p>
                  {r.details ? <p className="mt-1">{r.details}</p> : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
      <p className="mt-8 text-sm text-charcoal-600">
        <Link href="/moderation/actions" className="text-redrock-600 hover:underline">
          Recent moderation actions →
        </Link>
      </p>
    </div>
  );
}
