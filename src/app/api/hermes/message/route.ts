import { NextResponse } from "next/server";
import { z } from "zod";
import { routeThroughHermesAgent } from "@/lib/hermes/runtime";
import { getConversation } from "@/lib/storage";

export const runtime = "nodejs";

const messageSchema = z.object({
  sender: z.string().default("web-demo"),
  message: z.string().min(1)
});

export async function GET() {
  const snapshot = getConversation("web-demo");
  return NextResponse.json(snapshot);
}

export async function POST(request: Request) {
  const parsed = messageSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const response = await routeThroughHermesAgent(parsed.data.sender, parsed.data.message);
  return NextResponse.json(response);
}
