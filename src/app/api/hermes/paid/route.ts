import { NextResponse } from "next/server";
import { z } from "zod";
import { routeThroughHermesAgent } from "@/lib/hermes/runtime";

export const runtime = "nodejs";

const paidSchema = z.object({
  sender: z.string().default("web-demo")
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = paidSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const response = await routeThroughHermesAgent(parsed.data.sender, "payment complete");
  return NextResponse.json(response);
}
