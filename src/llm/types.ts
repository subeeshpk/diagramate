import type { DiagramSpec } from "../spec";

export interface LLMGenerateResult {
  spec: DiagramSpec;
  /** Raw text the model returned, kept around for a "view what the model said" affordance. */
  rawResponse: string;
}

/**
 * Thrown when the model responded but its output didn't parse/validate as a
 * DiagramSpec. Callers should show `rawResponse` + `validationErrors` and
 * let the user drop into the manual editor to fix it by hand — see
 * docs/architecture.md's guidance on the llm/ module.
 */
export class SpecGenerationError extends Error {
  rawResponse: string;
  validationErrors: string[];

  constructor(message: string, rawResponse: string, validationErrors: string[]) {
    super(message);
    this.name = "SpecGenerationError";
    this.rawResponse = rawResponse;
    this.validationErrors = validationErrors;
  }
}

export interface LLMAdapter {
  id: string;
  name: string;
  /**
   * Whether this provider's API can be called directly from a browser via
   * CORS. Anthropic supports this with an explicit opt-in header; OpenAI
   * does not support CORS on its API at all as of this writing, so calling
   * it from client-side JS fails regardless of API key validity. UI should
   * gate on this rather than let the user hit an opaque network error.
   */
  supportsBrowserCalls: boolean;
  generateSpec(description: string, apiKey: string): Promise<LLMGenerateResult>;
}
