import type { LLMAdapter, LLMGenerateResult } from "./types";

/**
 * OpenAI's API does not support CORS — there is no opt-in header equivalent
 * to Anthropic's `anthropic-dangerous-direct-browser-access`, and browser
 * `fetch` calls to api.openai.com fail before the request even reaches
 * OpenAI's servers, regardless of API key validity. Making this work would
 * require a backend proxy, which contradicts the no-backend architecture
 * this project is built around (see docs/architecture.md).
 *
 * The adapter still exists — `supportsBrowserCalls: false` lets the UI gate
 * on it and explain why, rather than the user discovering a cryptic CORS
 * error in devtools. If a proxy-based path is ever added, this is where the
 * real implementation goes.
 */
export const openaiAdapter: LLMAdapter = {
  id: "openai",
  name: "OpenAI (GPT)",
  supportsBrowserCalls: false,

  async generateSpec(): Promise<LLMGenerateResult> {
    throw new Error(
      "OpenAI's API doesn't support direct browser calls (no CORS support), so it can't be used " +
        "without a backend proxy, which this project doesn't have. Use the Anthropic provider, or " +
        "write the spec by hand in the editor.",
    );
  },
};
