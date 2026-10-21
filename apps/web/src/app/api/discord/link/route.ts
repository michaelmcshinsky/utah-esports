import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { discordLinkCodes } from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { getSessionUser } from "@/src/lib/session";

/** Generate a one-time code the user enters in Discord with /link. */
export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const code = randomBytes(4).toString("hex").toUpperCase();
  await db().insert(discordLinkCodes).values({
    code,
    userId: user.id,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });
  return NextResponse.json({ code, expiresInMinutes: 15 });
}
