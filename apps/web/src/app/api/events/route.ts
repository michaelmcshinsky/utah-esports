import { handleEventCreate } from "@/src/lib/event-api";

export async function POST(request: Request) {
  return handleEventCreate(request);
}
