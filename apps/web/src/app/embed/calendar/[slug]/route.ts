import { asc } from "drizzle-orm";
import { getOrganizationBySlug, listOrgEvents, venues } from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { SITE_URL } from "@/src/lib/site";

export const dynamic = "force-dynamic";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Embeddable organization calendar — a standalone HTML document (route
 * handlers bypass React layouts) meant for <iframe> embeds on org sites.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const database = db();
  const org = await getOrganizationBySlug(database, slug);
  if (!org) return new Response("Not found", { status: 404, headers: { "content-type": "text/plain" } });

  const [events, venueRows] = await Promise.all([
    listOrgEvents(database, org.id, 25),
    database.select({ venue: venues }).from(venues).orderBy(asc(venues.name)).limit(100),
  ]);
  const venueById = new Map(venueRows.map((r) => [r.venue.id, r.venue.name]));

  const items = events
    .map((event) => {
      const when = event.startsAt.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      const time = event.startsAt.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      const where =
        event.format === "online"
          ? "Online"
          : (event.venueId ? venueById.get(event.venueId) : null) ?? event.city ?? "Utah";
      return `<li class="row"><a href="${SITE_URL}/events/${escapeHtml(event.slug)}" target="_blank" rel="noopener">${escapeHtml(event.title)}</a><span class="when">${escapeHtml(when)} · ${escapeHtml(time)}</span><span class="where">${escapeHtml(where)}</span></li>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(org.name)} — Utah Esports calendar</title>
<style>
  :root { color-scheme: light; }
  body { margin:0; font:14px/1.5 system-ui,sans-serif; color:#242833; background:#faf8f4; }
  header { padding:12px 16px 4px; }
  h1 { margin:0; font-size:16px; }
  ul { list-style:none; margin:0; padding:8px 12px 12px; }
  .row { display:flex; flex-wrap:wrap; gap:4px 12px; padding:8px; border-bottom:1px solid #ebe3d3; background:#fff; border-radius:8px; margin-bottom:6px; }
  .row a { font-weight:600; color:#a44730; text-decoration:none; }
  .row a:hover { text-decoration:underline; }
  .when { color:#454b5c; }
  .where { color:#8b91a3; margin-left:auto; }
  footer { padding:0 16px 12px; font-size:12px; color:#8b91a3; }
  footer a { color:#a44730; }
  .empty { padding:16px; color:#8b91a3; }
</style></head>
<body>
<header><h1>${escapeHtml(org.name)}</h1></header>
${items ? `<ul>${items}</ul>` : `<p class="empty">No upcoming events right now.</p>`}
<footer>Powered by <a href="${SITE_URL}/organizations/${escapeHtml(org.slug)}" target="_blank" rel="noopener">utahesports.net</a></footer>
</body></html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
      // Intentionally frameable: read-only public calendar for org embeds.
      "content-security-policy": "frame-ancestors *",
    },
  });
}
