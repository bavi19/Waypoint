import Stripe from "stripe";
import { NextResponse } from "next/server";
import { routeThroughHermesAgent } from "@/lib/hermes/runtime";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (secret && stripeKey && signature) {
    const stripe = new Stripe(stripeKey);
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (error) {
      return NextResponse.json({ error: `Invalid Stripe signature: ${(error as Error).message}` }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      await routeThroughHermesAgent("web-demo", "payment complete");
    }
    return NextResponse.json({ received: true, type: event.type });
  }

  const body = JSON.parse(payload || "{}") as { type?: string; sender?: string };
  if (body.type === "checkout.session.completed" || body.type === "demo.checkout.completed") {
    await routeThroughHermesAgent(body.sender || "web-demo", "payment complete");
  }

  return NextResponse.json({ received: true, mode: "demo" });
}
