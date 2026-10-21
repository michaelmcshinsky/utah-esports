import { NextResponse } from "next/server";
import { eventSubmissionSchema } from "@utah-esports/core";
import { eventSubmissions } from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { getSessionUser } from "@/src/lib/session";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = eventSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const user = await getSessionUser();
  await db().insert(eventSubmissions).values({
    payload: parsed.data,
    contactEmail: parsed.data.contactEmail,
    sourceUrl: parsed.data.url,
    submittedBy: user?.id ?? null,
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
