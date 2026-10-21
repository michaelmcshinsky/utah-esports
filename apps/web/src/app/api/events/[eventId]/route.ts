import { handleEventPatch } from "@/src/lib/event-api";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params;
  return handleEventPatch(request, eventId);
}
