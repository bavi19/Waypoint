export type RiskLevel = "low" | "moderate" | "high" | "extreme";
export type PaymentStatus = "not_requested" | "approval_requested" | "approved" | "checkout_created" | "paid";
export type BookingStatus = "not_started" | "ready_to_book" | "booked";

export interface ConversationMessage {
  id: string;
  role: "user" | "hermes" | "system";
  content: string;
  createdAt: string;
}

export interface ExpeditionRoute {
  id: string;
  name: string;
  type: "backpacking" | "fallback-day";
  mileage: string;
  elevation: string;
  summary: string;
  mapLink: string;
  warnings: string[];
  permitNotes: string;
}

export interface BudgetLineItem {
  label: string;
  amountCents: number;
  notes?: string;
}

export interface PaymentRecord {
  provider: "stripe" | "usdc";
  checkoutUrl?: string;
  stablecoinInstructions?: string;
  approvedAt?: string;
  completedAt?: string;
  vendorPayoutId?: string;
}

export interface ToolCallLog {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  createdAt: string;
}

export interface PermitState {
  required: boolean;
  status: "unknown" | "checking" | "available" | "placeholder_booked" | "unavailable";
  notes: string;
  confirmationId?: string;
}

export interface WeatherRisk {
  status: "unknown" | "checked";
  forecast: string;
  riskLevel: RiskLevel;
  alerts: string[];
}

export interface ExpeditionState {
  userPhone: string;
  destination?: string;
  dates?: string;
  groupSize?: number;
  experienceLevel?: "beginner" | "intermediate" | "advanced";
  budget?: string;
  gearOwned: string[];
  transportation?: string;
  selectedRoute?: ExpeditionRoute;
  proposedRoutes: ExpeditionRoute[];
  permits: PermitState;
  weatherRisk: WeatherRisk;
  safetyRisk: RiskLevel;
  missingGear: string[];
  gearRentalOptions: Array<{ item: string; vendor: string; priceCents: number }>;
  packingList: string[];
  costBreakdown: BudgetLineItem[];
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
  payment?: PaymentRecord;
  finalBrief?: string;
  lastUpdatedAt: string;
}

export interface HermesContext {
  conversationId: string;
  sender: string;
  message: string;
  messages: ConversationMessage[];
  state: ExpeditionState;
}

export interface HermesResponse {
  reply: string;
  state: ExpeditionState;
  toolCalls: ToolCallLog[];
  messages: ConversationMessage[];
}

export interface HermesAgent {
  name: string;
  handleMessage(context: HermesContext): Promise<HermesResponse>;
}

export interface ToolDefinition<TInput extends Record<string, unknown> = Record<string, unknown>, TOutput extends Record<string, unknown> = Record<string, unknown>> {
  name: string;
  description: string;
  run(input: TInput, state: ExpeditionState): Promise<TOutput>;
}
