import { NextResponse } from "next/server";
import { z } from "zod";
import { routeThroughHermesAgent } from "@/lib/hermes/runtime";

export const runtime = "nodejs";

const relaySchema = z.object({
  sender: z.string(),
  text: z.string().min(1)
});

export async function POST(request: Request) {
  const parsed = relaySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const allowedSender = process.env.IMESSAGE_ALLOWED_SENDER;
  if (allowedSender && parsed.data.sender !== allowedSender) {
    return NextResponse.json({ error: "Sender is not allowlisted for the demo relay." }, { status: 403 });
  }

  const response = await routeThroughHermesAgent(parsed.data.sender, parsed.data.text);
  return NextResponse.json({
    recipient: parsed.data.sender,
    text: response.reply,
    state: response.state,
    toolCalls: response.toolCalls
  });
}
