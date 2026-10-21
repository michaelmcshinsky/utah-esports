import { NextResponse } from "next/server";
import { reportSchema } from "@utah-esports/core";
import { reports } from "@utah-esports/db";
import { db } from "@/src/lib/db";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }
  await db().insert(reports).values({
    targetType: parsed.data.targetType,
    targetId: parsed.data.targetId,
    reason: parsed.data.reason,
    details: parsed.data.details ?? null,
    contactEmail: parsed.data.contactEmail ?? null,
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
