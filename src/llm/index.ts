import { anthropicAdapter } from "./anthropic";
import { openaiAdapter } from "./openai";
import type { LLMAdapter } from "./types";

export * from "./types";
export * from "./promptTemplate";
export * from "./parseModelResponse";
export { anthropicAdapter } from "./anthropic";
export { openaiAdapter } from "./openai";

export const LLM_ADAPTERS: LLMAdapter[] = [anthropicAdapter, openaiAdapter];
