import { NextResponse } from "next/server";
import { organizationClaimSchema } from "@utah-esports/core";
import { organizationClaims } from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { getSessionUser } from "@/src/lib/session";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = organizationClaimSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }
  await db().insert(organizationClaims).values({
    organizationId: parsed.data.organizationId,
    userId: user.id,
    proofUrl: parsed.data.proofUrl,
    message: parsed.data.message ?? null,
    contactEmail: parsed.data.contactEmail,
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
