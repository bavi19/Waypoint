import type { HermesAgent, HermesContext, HermesResponse } from "@/lib/types";
import { MockHermesAgent } from "@/lib/hermes/mockHermesAgent";

export class RealHermesAgent implements HermesAgent {
  name = "RealHermesAgent";
  private readonly fallback = new MockHermesAgent();

  async handleMessage(context: HermesContext): Promise<HermesResponse> {
    const baseUrl = process.env.HERMES_BASE_URL;
    const apiKey = process.env.HERMES_API_KEY;

    if (!baseUrl || !apiKey) {
      return this.fallback.handleMessage(context);
    }

    // Placeholder seam for the real Nous Hermes SDK/API. The request contract mirrors
    // HermesContext/HermesResponse so the mock and production agents stay swappable.
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/agents/waypoint-expedition/message`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(context)
    });

    if (!response.ok) {
      return this.fallback.handleMessage(context);
    }

    return (await response.json()) as HermesResponse;
  }
}
