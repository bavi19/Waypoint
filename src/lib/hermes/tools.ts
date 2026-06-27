import Stripe from "stripe";
import { joshuaTreePackingList, joshuaTreeRoutes, missingGearCatalog } from "@/lib/demoData";
import type { BudgetLineItem, ExpeditionState, ToolCallLog, ToolDefinition } from "@/lib/types";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

function cents(amount: number): number {
  return Math.round(amount * 100);
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function createDemoCheckoutUrl(totalCents: number): string {
  const total = (totalCents / 100).toFixed(2);
  return `${appUrl()}/?checkout=demo&amount=${encodeURIComponent(total)}`;
}

async function createStripeCheckoutSession(state: ExpeditionState): Promise<{ url: string; id: string; mode: "stripe" | "demo" }> {
  const totalCents = state.costBreakdown.reduce((sum, item) => sum + item.amountCents, 0);
  if (!stripeSecretKey || stripeSecretKey.includes("sk_test_replace")) {
    return {
      url: createDemoCheckoutUrl(totalCents),
      id: `demo_checkout_${Date.now()}`,
      mode: "demo"
    };
  }

  const stripe = new Stripe(stripeSecretKey);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${appUrl()}/?payment=success`,
    cancel_url: `${appUrl()}/?payment=cancelled`,
    line_items: state.costBreakdown.map((item) => ({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: item.amountCents,
        product_data: {
          name: item.label,
          description: item.notes
        }
      }
    })),
    metadata: {
      destination: state.destination || "Joshua Tree National Park",
      vendor: "Joshua Tree Gear Rental Partner"
    }
  });

  return {
    url: session.url || createDemoCheckoutUrl(totalCents),
    id: session.id,
    mode: "stripe"
  };
}

export const expeditionTools: ToolDefinition[] = [
  {
    name: "plan_trip",
    description: "Create high-level Joshua Tree trip plan options.",
    async run(input, state) {
      return {
        destination: state.destination || "Joshua Tree National Park",
        dates: state.dates || "Upcoming weekend",
        groupSize: state.groupSize || 2,
        routes: joshuaTreeRoutes.map((route) => route.name),
        safetyRule:
          "All plans must verify current conditions before departure and avoid illegal camping."
      };
    }
  },
  {
    name: "search_routes",
    description: "Search curated Joshua Tree route options.",
    async run() {
      return { routes: joshuaTreeRoutes };
    }
  },
  {
    name: "generate_map_link",
    description: "Generate route map links.",
    async run(input, state) {
      return {
        route: state.selectedRoute?.name || joshuaTreeRoutes[0].name,
        mapLink: state.selectedRoute?.mapLink || joshuaTreeRoutes[0].mapLink
      };
    }
  },
  {
    name: "check_weather",
    description: "Check weather and heat risk through a wrapper.",
    async run() {
      return {
        forecast: "Mock forecast: clear desert skies, cool overnight lows, warm afternoons.",
        riskLevel: "moderate",
        alerts: [
          "Carry extra water; Joshua Tree has limited/no reliable water sources.",
          "Start early and avoid exposed midday travel if temperatures rise."
        ]
      };
    }
  },
  {
    name: "check_fire_or_closure_risk",
    description: "Check official alert wrappers for fire and closure risk.",
    async run() {
      return {
        riskLevel: "moderate",
        closures: [],
        note: "Mock wrapper: verify current National Park Service alerts before departure."
      };
    }
  },
  {
    name: "check_permit_requirements",
    description: "Determine permit or registration requirements.",
    async run(input, state) {
      return {
        required: true,
        notes:
          state.selectedRoute?.permitNotes ||
          "Backcountry registration/permit requirements must be verified with official Joshua Tree guidance."
      };
    }
  },
  {
    name: "check_permit_availability",
    description: "Check permit availability with a mocked provider.",
    async run() {
      return {
        status: "available",
        provider: "mock-jtnp-permit-wrapper",
        holdExpiresInMinutes: 15
      };
    }
  },
  {
    name: "create_mock_permit_booking",
    description: "Create a demo-only permit booking confirmation.",
    async run() {
      return {
        confirmationId: `JTNP-MOCK-${Date.now().toString().slice(-6)}`,
        status: "placeholder_booked",
        disclaimer: "Demo-only placeholder. User must verify and complete official requirements."
      };
    }
  },
  {
    name: "create_packing_list",
    description: "Create a conservative packing list.",
    async run() {
      return { packingList: joshuaTreePackingList };
    }
  },
  {
    name: "identify_missing_gear",
    description: "Compare owned gear with required Joshua Tree gear.",
    async run(input, state) {
      const owned = state.gearOwned.map((item) => item.toLowerCase());
      const missingGear = missingGearCatalog.filter((item) => !owned.some((ownedItem) => ownedItem.includes(item)));
      return { missingGear };
    }
  },
  {
    name: "search_gear_rentals",
    description: "Search a mock gear marketplace.",
    async run(input, state) {
      const options = state.missingGear.map((item) => ({
        item,
        vendor: "Joshua Tree Gear Rental Partner",
        priceCents: item.includes("satellite") ? cents(34) : cents(14)
      }));
      return { options };
    }
  },
  {
    name: "create_trip_budget",
    description: "Create a trip budget before payment approval.",
    async run(input, state) {
      const missingGearCount = Math.max(state.missingGear.length, 2);
      const budget: BudgetLineItem[] = [
        { label: "Permit / reservation fee", amountCents: cents(18), notes: "Placeholder demo estimate" },
        { label: "Gear rental", amountCents: cents(24 * missingGearCount), notes: "Joshua Tree Gear Rental Partner" },
        { label: "Food estimate", amountCents: cents(38), notes: "Two trail meals plus snacks per person estimate" },
        { label: "Fuel estimate", amountCents: cents(36), notes: "Round-trip driving estimate" },
        { label: "Waypoint service fee", amountCents: cents(19), notes: "Trip operations and briefing" },
        { label: "Optional trail donation", amountCents: cents(5), notes: "Demo donation line item" }
      ];
      return {
        budget,
        totalCents: budget.reduce((sum, item) => sum + item.amountCents, 0)
      };
    }
  },
  {
    name: "create_stripe_checkout",
    description: "Create Stripe test mode checkout after explicit approval.",
    async run(input, state) {
      const checkout = await createStripeCheckoutSession(state);
      return {
        checkoutUrl: checkout.url,
        checkoutId: checkout.id,
        mode: checkout.mode,
        totalCents: state.costBreakdown.reduce((sum, item) => sum + item.amountCents, 0)
      };
    }
  },
  {
    name: "create_usdc_payment_option",
    description: "Create a USDC/stablecoin payment option copy block.",
    async run() {
      return {
        stablecoinInstructions:
          "USDC payment option: demo copy only. In production, Waypoint would generate a wallet invoice where supported and reconcile on-chain payment before booking."
      };
    }
  },
  {
    name: "create_mock_vendor_payout",
    description: "Create a mock Stripe Connect vendor payout.",
    async run() {
      return {
        vendor: "Joshua Tree Gear Rental Partner",
        payoutId: `po_mock_${Date.now()}`,
        status: "scheduled"
      };
    }
  },
  {
    name: "generate_emergency_plan",
    description: "Generate an emergency plan with conservative guidance.",
    async run(input, state) {
      return {
        emergencyPlan: [
          "Share itinerary, vehicle location, and return time with a trusted contact.",
          "Carry a satellite messenger or emergency beacon because cell service is unreliable.",
          "Turn around early for heat illness symptoms, navigation uncertainty, or water margin concerns.",
          "In an emergency, contact 911 or park rangers when service is available."
        ],
        riskLevel: state.experienceLevel === "beginner" ? "high" : "moderate"
      };
    }
  },
  {
    name: "generate_final_expedition_brief",
    description: "Generate the polished final expedition brief.",
    async run(input, state) {
      const total = state.costBreakdown.reduce((sum, item) => sum + item.amountCents, 0);
      const route = state.selectedRoute || joshuaTreeRoutes[0];
      return {
        brief: [
          `Powered by Hermes`,
          ``,
          `Trip: ${route.name}`,
          `Dates: ${state.dates || "Upcoming weekend"}`,
          `Route: ${route.summary}`,
          `Map: ${route.mapLink}`,
          `Mileage/elevation: ${route.mileage}; ${route.elevation}`,
          `Permit/campsite: ${state.permits.notes} Confirmation: ${state.permits.confirmationId || "pending official verification"}.`,
          `Water plan: carry all water, with at least 1 gallon per person per day plus emergency margin. Joshua Tree has limited/no reliable water.`,
          `Gear checklist: ${state.packingList.join("; ")}`,
          `Missing gear/rental: ${state.missingGear.length ? state.missingGear.join(", ") : "none flagged"}`,
          `Food/fuel estimate: included in $${(total / 100).toFixed(2)} demo budget.`,
          `Weather/risk: ${state.weatherRisk.riskLevel.toUpperCase()} - ${state.weatherRisk.forecast}`,
          `Emergency plan: share itinerary, carry emergency communication, turn around conservatively, and contact 911/rangers when needed.`,
          `Payment/booking: ${state.paymentStatus}; booking status ${state.bookingStatus}.`,
          `Next steps: verify current conditions before departure, check official park alerts, confirm legal camping/permit requirements, and re-check weather within 24 hours.`
        ].join("\n")
      };
    }
  }
];

export class ToolRegistry {
  private readonly tools = new Map(expeditionTools.map((tool) => [tool.name, tool]));

  async call(name: string, input: Record<string, unknown>, state: ExpeditionState): Promise<{ output: Record<string, unknown>; log: ToolCallLog }> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Unknown Hermes tool: ${name}`);
    }

    const output = await tool.run(input, state);
    return {
      output,
      log: {
        id: crypto.randomUUID(),
        name,
        input,
        output,
        createdAt: new Date().toISOString()
      }
    };
  }
}
