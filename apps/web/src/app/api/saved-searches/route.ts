import { NextResponse } from "next/server";
import { savedSearchSchema } from "@utah-esports/core";
import { savedSearches } from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { getSessionUser } from "@/src/lib/session";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = savedSearchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }
  const [row] = await db()
    .insert(savedSearches)
    .values({
      userId: user.id,
      name: parsed.data.name,
      query: parsed.data.query,
      notify: parsed.data.notify,
    })
    .returning({ id: savedSearches.id });
  return NextResponse.json({ id: row?.id }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { eq } = await import("drizzle-orm");
  await db()
    .delete(savedSearches)
    .where(eq(savedSearches.id, id));
  return NextResponse.json({ ok: true });
}
