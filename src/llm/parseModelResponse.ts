import { parseSpecText, validateSpec } from "../spec";
import { SpecGenerationError } from "./types";
import type { LLMGenerateResult } from "./types";

/**
 * Models frequently wrap JSON in a markdown code fence even when told not
 * to. Strip a single leading/trailing fence (```json / ```yaml / bare ```)
 * before parsing, but keep the original text around for error display so
 * the user can see exactly what the model said.
 */
function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```[a-zA-Z]*\n([\s\S]*?)\n```$/);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

export function parseModelResponse(rawResponse: string): LLMGenerateResult {
  const candidate = stripCodeFence(rawResponse);

  const parsed = parseSpecText(candidate);
  if (!parsed.ok) {
    throw new SpecGenerationError(
      "The model's response wasn't valid JSON or YAML.",
      rawResponse,
      [parsed.error],
    );
  }

  const result = validateSpec(parsed.value);
  if (!result.ok) {
    throw new SpecGenerationError(
      "The model's response didn't match the spec schema.",
      rawResponse,
      result.errors,
    );
  }

  return { spec: result.spec, rawResponse };
}
