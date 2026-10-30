import { desc } from "drizzle-orm";
import { digestSends, notificationDeliveries } from "@utah-esports/db";
import { db } from "@/src/lib/db";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin · Notifications", robots: { index: false } };

function when(d: Date | null): string {
  return d ? d.toISOString().slice(0, 16).replace("T", " ") : "—";
}

export default async function AdminNotificationsPage() {
  const [deliveries, digests] = await Promise.all([
    db()
      .select({
        id: notificationDeliveries.id,
        kind: notificationDeliveries.kind,
        channel: notificationDeliveries.channel,
        subject: notificationDeliveries.subject,
        status: notificationDeliveries.status,
        error: notificationDeliveries.error,
        sentAt: notificationDeliveries.sentAt,
        createdAt: notificationDeliveries.createdAt,
      })
      .from(notificationDeliveries)
      .orderBy(desc(notificationDeliveries.createdAt))
      .limit(40),
    db()
      .select({
        id: digestSends.id,
        userId: digestSends.userId,
        weekOf: digestSends.weekOf,
        eventCount: digestSends.eventCount,
        status: digestSends.status,
        createdAt: digestSends.createdAt,
      })
      .from(digestSends)
      .orderBy(desc(digestSends.createdAt))
      .limit(20),
  ]);

  return (
    <div className="page-container py-8 space-y-10">
      <div>
        <h1 className="font-display text-2xl font-bold text-charcoal-900">Notifications</h1>
        <p className="mt-1 text-sm text-charcoal-600">
          Delivery log for emails (and other channels) plus weekly digest sends.
        </p>
      </div>

      <section aria-labelledby="deliveries-heading">
        <h2 id="deliveries-heading" className="section-title">Deliveries</h2>
        <div className="mt-8 overflow-x-auto rounded-card border border-charcoal-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-charcoal-200 text-left text-xs uppercase tracking-wide text-charcoal-500">
                <th className="px-4 py-3">Kind</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Sent</th>
                <th className="px-4 py-3">Error</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d) => (
                <tr key={d.id} className="border-b border-charcoal-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-charcoal-900">{d.kind}</td>
                  <td className="px-4 py-3 text-charcoal-600">{d.channel}</td>
                  <td className="px-4 py-3 text-charcoal-700">{d.subject ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        d.status === "sent"
                          ? "bg-success-100 text-success-700"
                          : d.status === "failed"
                            ? "bg-danger-100 text-danger-600"
                            : "bg-charcoal-100 text-charcoal-700"
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-charcoal-500">{when(d.sentAt ?? d.createdAt)}</td>
                  <td className="px-4 py-3 text-xs text-danger-600">{d.error ?? ""}</td>
                </tr>
              ))}
              {deliveries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-charcoal-500">
                    No deliveries recorded yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="digests-heading">
        <h2 id="digests-heading" className="section-title">Weekly digests</h2>
        <div className="mt-8 overflow-x-auto rounded-card border border-charcoal-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-charcoal-200 text-left text-xs uppercase tracking-wide text-charcoal-500">
                <th className="px-4 py-3">Week of</th>
                <th className="px-4 py-3">Events</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {digests.map((g) => (
                <tr key={g.id} className="border-b border-charcoal-100 last:border-0">
                  <td className="px-4 py-3 text-charcoal-700">{when(g.weekOf)}</td>
                  <td className="px-4 py-3">{g.eventCount}</td>
                  <td className="px-4 py-3 text-charcoal-600">{g.status}</td>
                  <td className="px-4 py-3 text-charcoal-500">{when(g.createdAt)}</td>
                </tr>
              ))}
              {digests.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-charcoal-500">
                    No digests recorded yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
