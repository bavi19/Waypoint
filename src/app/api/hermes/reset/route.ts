import { NextResponse } from "next/server";
import { resetConversation } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(resetConversation("web-demo"));
}
