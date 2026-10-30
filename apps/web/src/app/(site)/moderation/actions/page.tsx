import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { moderationActions } from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { getSessionUser } from "@/src/lib/session";

export const metadata: Metadata = { title: "Moderation actions" };
export const revalidate = 0;

export default async function ModerationActionsPage() {
  const user = await getSessionUser();
  if (!user?.isModerator) redirect("/moderation");
  const actions = await db()
    .select()
    .from(moderationActions)
    .orderBy(desc(moderationActions.createdAt))
    .limit(100);
  return (
    <div className="page-container py-8">
      <h1 className="font-display text-2xl font-bold">Recent moderation actions</h1>
      <ul className="mt-6 divide-y divide-charcoal-100 rounded-card border border-charcoal-200 bg-white">
        {actions.map((a) => (
          <li key={a.id} className="p-4 text-sm">
            <p className="font-medium">{a.action}</p>
            <p className="text-charcoal-500">
              {a.targetType ?? "—"} · {a.createdAt.toLocaleString()}
            </p>
            {a.notes ? <p className="mt-1 text-charcoal-700">{a.notes}</p> : null}
          </li>
        ))}
        {actions.length === 0 ? (
          <li className="p-6 text-sm text-charcoal-600">No actions recorded yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
