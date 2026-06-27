import { joshuaTreeRoutes } from "@/lib/demoData";
import type { ConversationMessage, ExpeditionState, HermesAgent, HermesContext, HermesResponse, ToolCallLog } from "@/lib/types";
import { extractRouteChoice, hasPlanningInputs, inferTripDetails, isApproval, updateStateTimestamp } from "@/lib/hermes/state";
import { ToolRegistry } from "@/lib/hermes/tools";

function hermesMessage(content: string): ConversationMessage {
  return {
    id: crypto.randomUUID(),
    role: "hermes",
    content,
    createdAt: new Date().toISOString()
  };
}

function userMessage(content: string): ConversationMessage {
  return {
    id: crypto.randomUUID(),
    role: "user",
    content,
    createdAt: new Date().toISOString()
  };
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function needsIntake(state: ExpeditionState): string[] {
  const missing: string[] = [];
  if (!state.dates) missing.push("dates");
  if (!state.groupSize) missing.push("group size");
  if (!state.experienceLevel) missing.push("experience level");
  if (!state.budget) missing.push("budget");
  if (!state.gearOwned.length) missing.push("gear you already own");
  return missing;
}

export class MockHermesAgent implements HermesAgent {
  name = "MockHermesAgent";
  private readonly tools = new ToolRegistry();

  async handleMessage(context: HermesContext): Promise<HermesResponse> {
    const toolCalls: ToolCallLog[] = [];
    let state = inferTripDetails(context.message, context.state);
    const messages = [...context.messages, userMessage(context.message)];

    const callTool = async (name: string, input: Record<string, unknown> = {}) => {
      const { output, log } = await this.tools.call(name, input, state);
      toolCalls.push(log);
      return output;
    };

    const lower = context.message.toLowerCase();
    const routeChoice = extractRouteChoice(context.message);

    if (!state.destination && lower.includes("plan")) {
      state = { ...state, destination: "Joshua Tree National Park", proposedRoutes: joshuaTreeRoutes };
    }

    if (routeChoice) {
      const selectedRoute = joshuaTreeRoutes.find((route) => route.id === routeChoice);
      if (selectedRoute) {
        state = updateStateTimestamp({ ...state, selectedRoute });
      }
    }

    if (isApproval(context.message) && state.paymentStatus === "approval_requested") {
      const checkout = await callTool("create_stripe_checkout", { approvedBy: state.userPhone });
      const usdc = await callTool("create_usdc_payment_option", { approvedBy: state.userPhone });
      state = updateStateTimestamp({
        ...state,
        paymentStatus: "checkout_created",
        payment: {
          provider: "stripe",
          checkoutUrl: String(checkout.checkoutUrl),
          stablecoinInstructions: String(usdc.stablecoinInstructions),
          approvedAt: new Date().toISOString()
        }
      });

      const reply = [
        "Approved. Hermes created the Stripe test checkout for the trip package.",
        "",
        `Checkout: ${checkout.checkoutUrl}`,
        "",
        "USDC/stablecoin demo option is also prepared where supported. I will finalize booking confirmations after payment completion."
      ].join("\n");
      return { reply, state, toolCalls, messages: [...messages, hermesMessage(reply)] };
    }

    if (lower.includes("paid") || lower.includes("payment complete") || lower.includes("success")) {
      const permit = await callTool("create_mock_permit_booking", { route: state.selectedRoute?.id });
      const payout = await callTool("create_mock_vendor_payout", { vendor: "Joshua Tree Gear Rental Partner" });
      state = updateStateTimestamp({
        ...state,
        permits: {
          ...state.permits,
          status: "placeholder_booked",
          confirmationId: String(permit.confirmationId)
        },
        paymentStatus: "paid",
        bookingStatus: "booked",
        payment: {
          ...state.payment,
          provider: "stripe",
          completedAt: new Date().toISOString(),
          vendorPayoutId: String(payout.payoutId)
        }
      });
      const brief = await callTool("generate_final_expedition_brief", { route: state.selectedRoute?.id });
      state = updateStateTimestamp({ ...state, finalBrief: String(brief.brief) });
      const reply = `Payment marked complete. Hermes booked the demo vendor payout and generated your final expedition brief:\n\n${brief.brief}`;
      return { reply, state, toolCalls, messages: [...messages, hermesMessage(reply)] };
    }

    if (!state.destination || !hasPlanningInputs(state) || needsIntake(state).length) {
      const missing = needsIntake(state);
      const reply = [
        "I can operate that Joshua Tree weekend plan. To build it safely, send me:",
        missing.includes("dates") ? "- exact dates or weekend target" : "",
        missing.includes("group size") ? "- group size" : "",
        missing.includes("experience level") ? "- experience level: beginner, intermediate, or advanced" : "",
        missing.includes("budget") ? "- rough budget" : "",
        missing.includes("gear you already own") ? "- key gear you already own" : "",
        "",
        "I will keep the route conservative, verify current conditions before departure, and avoid any illegal camping assumptions."
      ].filter(Boolean).join("\n");
      return { reply, state, toolCalls, messages: [...messages, hermesMessage(reply)] };
    }

    if (!state.selectedRoute && (hasPlanningInputs(state) || lower.includes("option") || lower.includes("route"))) {
      const plan = await callTool("plan_trip", { destination: state.destination });
      const routes = await callTool("search_routes", { destination: state.destination });
      state = updateStateTimestamp({ ...state, proposedRoutes: joshuaTreeRoutes });
      const routeList = joshuaTreeRoutes
        .slice(0, 2)
        .map((route, index) => `${index + 1}. ${route.name}: ${route.mileage}, ${route.summary}`)
        .join("\n");
      const reply = [
        `Hermes built the first pass for ${plan.destination}. Pick a route option:`,
        "",
        routeList,
        "",
        `Fallback: ${joshuaTreeRoutes[2].name} if heat, permits, or experience level make backpacking too aggressive.`,
        "",
        "Joshua Tree has limited/no reliable water, so every option requires a full carry plan. Which route should I run logistics on?"
      ].join("\n");
      return { reply, state, toolCalls, messages: [...messages, hermesMessage(reply)] };
    }

    if (state.selectedRoute && state.paymentStatus === "not_requested") {
      const selectedRoute = state.selectedRoute;
      const weather = await callTool("check_weather", { destination: state.destination, dates: state.dates });
      const closures = await callTool("check_fire_or_closure_risk", { destination: state.destination });
      const permitRequirements = await callTool("check_permit_requirements", { route: state.selectedRoute.id });
      const availability = await callTool("check_permit_availability", { route: state.selectedRoute.id });
      const packing = await callTool("create_packing_list", { route: state.selectedRoute.id });
      const missing = await callTool("identify_missing_gear", { owned: state.gearOwned });
      state = updateStateTimestamp({
        ...state,
        weatherRisk: {
          status: "checked",
          forecast: String(weather.forecast),
          riskLevel: weather.riskLevel === "high" ? "high" : "moderate",
          alerts: weather.alerts as string[]
        },
        safetyRisk: closures.riskLevel === "high" ? "high" : "moderate",
        permits: {
          required: Boolean(permitRequirements.required),
          status: availability.status === "available" ? "available" : "unknown",
          notes: String(permitRequirements.notes)
        },
        packingList: packing.packingList as string[],
        missingGear: missing.missingGear as string[]
      });
      const rentals = await callTool("search_gear_rentals", { missingGear: state.missingGear });
      state = updateStateTimestamp({ ...state, gearRentalOptions: rentals.options as ExpeditionState["gearRentalOptions"] });
      const budget = await callTool("create_trip_budget", { route: selectedRoute.id });
      state = updateStateTimestamp({
        ...state,
        costBreakdown: budget.budget as ExpeditionState["costBreakdown"],
        paymentStatus: "approval_requested",
        bookingStatus: "ready_to_book"
      });
      const budgetLines = state.costBreakdown.map((item) => `- ${item.label}: ${formatCurrency(item.amountCents)}`).join("\n");
      const totalCents = state.costBreakdown.reduce((sum, item) => sum + item.amountCents, 0);
      const reply = [
        `I ran logistics for ${selectedRoute.name}.`,
        "",
        `Map: ${selectedRoute.mapLink}`,
        `Weather/risk: ${state.weatherRisk.riskLevel.toUpperCase()} - ${state.weatherRisk.forecast}`,
        `Permit status: ${state.permits.status}. ${state.permits.notes}`,
        `Missing gear: ${state.missingGear.join(", ") || "none flagged"}`,
        "",
        "Budget before approval:",
        budgetLines,
        `Total: ${formatCurrency(totalCents)}`,
        "",
        "Reply yes or approve only if you want Hermes to create a Stripe test checkout. I will not charge without explicit approval."
      ].join("\n");
      return { reply, state, toolCalls, messages: [...messages, hermesMessage(reply)] };
    }

    const reply = [
      "Hermes is holding the trip plan. You can pick a route, approve payment, or tell me payment is complete for the final expedition brief.",
      "Reminder: verify current conditions before departure and check official park alerts."
    ].join("\n");
    return { reply, state, toolCalls, messages: [...messages, hermesMessage(reply)] };
  }
}
