import type { HermesAgent } from "@/lib/types";
import { MockHermesAgent } from "@/lib/hermes/mockHermesAgent";
import { RealHermesAgent } from "@/lib/hermes/realHermesAgent";

export function createHermesAgent(): HermesAgent {
  if (process.env.HERMES_API_KEY && process.env.HERMES_BASE_URL) {
    return new RealHermesAgent();
  }

  return new MockHermesAgent();
}
