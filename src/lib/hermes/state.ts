import { joshuaTreeRoutes } from "@/lib/demoData";
import type { ExpeditionState } from "@/lib/types";

export function createInitialExpeditionState(userPhone: string): ExpeditionState {
  return {
    userPhone,
    destination: undefined,
    dates: undefined,
    groupSize: undefined,
    experienceLevel: undefined,
    budget: undefined,
    gearOwned: [],
    transportation: undefined,
    selectedRoute: undefined,
    proposedRoutes: [],
    permits: {
      required: true,
      status: "unknown",
      notes: "Joshua Tree backcountry requirements must be verified before departure."
    },
    weatherRisk: {
      status: "unknown",
      forecast: "Not checked yet.",
      riskLevel: "moderate",
      alerts: []
    },
    safetyRisk: "moderate",
    missingGear: [],
    gearRentalOptions: [],
    packingList: [],
    costBreakdown: [],
    paymentStatus: "not_requested",
    bookingStatus: "not_started",
    lastUpdatedAt: new Date().toISOString()
  };
}

export function updateStateTimestamp(state: ExpeditionState): ExpeditionState {
  return { ...state, lastUpdatedAt: new Date().toISOString() };
}

export function inferTripDetails(message: string, state: ExpeditionState): ExpeditionState {
  const lower = message.toLowerCase();
  const next = { ...state, gearOwned: [...state.gearOwned] };

  if (lower.includes("joshua tree")) {
    next.destination = "Joshua Tree National Park";
  }

  if (lower.includes("weekend") && !next.dates) {
    next.dates = "Upcoming weekend";
  }

  const groupMatch = lower.match(/(?:group of|we are|for)\s+(\d+)/);
  if (groupMatch) {
    next.groupSize = Number(groupMatch[1]);
  }

  if (lower.includes("beginner")) next.experienceLevel = "beginner";
  if (lower.includes("intermediate")) next.experienceLevel = "intermediate";
  if (lower.includes("advanced")) next.experienceLevel = "advanced";

  const budgetMatch = lower.match(/\$?\b(\d{2,4})\b/);
  if (budgetMatch && (lower.includes("budget") || lower.includes("$"))) {
    next.budget = `$${budgetMatch[1]}`;
  }

  const gearHints = ["tent", "backpack", "sleeping bag", "stove", "headlamp", "first aid kit", "satellite messenger"];
  for (const gear of gearHints) {
    if (lower.includes(gear) && !next.gearOwned.includes(gear)) {
      next.gearOwned.push(gear);
    }
  }

  if (lower.includes("drive") || lower.includes("car")) {
    next.transportation = "Driving / personal vehicle";
  }

  if (!next.proposedRoutes.length && next.destination) {
    next.proposedRoutes = joshuaTreeRoutes;
  }

  return updateStateTimestamp(next);
}

export function hasPlanningInputs(state: ExpeditionState): boolean {
  return Boolean(state.destination && state.dates && state.groupSize && state.experienceLevel && state.budget);
}

export function isApproval(message: string): boolean {
  return /\b(yes|approve|approved|go ahead|book it|pay|checkout)\b/i.test(message);
}

export function extractRouteChoice(message: string): string | undefined {
  const lower = message.toLowerCase();
  if (lower.includes("boy scout") || lower.includes("option 1") || lower.includes("first")) return "boy-scout-trail";
  if (lower.includes("california") || lower.includes("option 2") || lower.includes("second")) return "california-riding-hiking";
  if (lower.includes("pine") || lower.includes("desert queen") || lower.includes("fallback")) return "pine-city-desert-queen";
  return undefined;
}
