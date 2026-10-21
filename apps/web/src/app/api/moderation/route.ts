import { handleModerationAction } from "@/src/lib/moderation";

export async function POST(request: Request) {
  return handleModerationAction(request);
}
