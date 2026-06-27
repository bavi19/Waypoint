import { createHermesAgent } from "@/lib/hermes/agent";
import { getOrCreateConversation, saveConversation } from "@/lib/storage";
import type { HermesResponse } from "@/lib/types";

export async function routeThroughHermesAgent(sender: string, message: string): Promise<HermesResponse> {
  const conversation = getOrCreateConversation(sender);
  const agent = createHermesAgent();
  const response = await agent.handleMessage({
    conversationId: conversation.id,
    sender,
    message,
    messages: conversation.messages,
    state: conversation.state
  });

  const mergedToolCalls = [...conversation.toolCalls, ...response.toolCalls];
  saveConversation({
    ...conversation,
    state: response.state,
    messages: response.messages,
    toolCalls: mergedToolCalls
  });

  return {
    ...response,
    toolCalls: mergedToolCalls
  };
}
