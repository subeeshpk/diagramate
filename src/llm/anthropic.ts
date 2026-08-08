import { buildSystemPrompt } from "./promptTemplate";
import { parseModelResponse } from "./parseModelResponse";
import type { LLMAdapter, LLMGenerateResult } from "./types";

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";
const ANTHROPIC_VERSION = "2023-06-01";

interface AnthropicContentBlock {
  type: string;
  text?: string;
}

interface AnthropicResponse {
  content: AnthropicContentBlock[];
}

/**
 * Calls the Anthropic Messages API directly from the browser using the
 * `anthropic-dangerous-direct-browser-access` opt-in header, which is what
 * makes a no-backend, BYO-key architecture possible for this provider (see
 * docs/architecture.md). The name reflects Anthropic's own framing: the key
 * is visible to anyone with access to this page's JS runtime, which is why
 * it's never persisted beyond the current session — see the UI layer.
 */
export const anthropicAdapter: LLMAdapter = {
  id: "anthropic",
  name: "Anthropic (Claude)",
  supportsBrowserCalls: true,

  async generateSpec(description: string, apiKey: string): Promise<LLMGenerateResult> {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        system: buildSystemPrompt(),
        messages: [{ role: "user", content: description }],
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Anthropic API error (${response.status}): ${body || response.statusText}`);
    }

    const data = (await response.json()) as AnthropicResponse;
    const text = data.content
      .filter((block) => block.type === "text" && block.text)
      .map((block) => block.text)
      .join("\n");

    if (!text) {
      throw new Error("Anthropic returned an empty response.");
    }

    return parseModelResponse(text);
  },
};
