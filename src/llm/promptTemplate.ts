import { COLOR_FAMILIES, DIRECTIONS } from "../spec";

/**
 * System prompt handed to every provider. Mirrors docs/spec-schema.md —
 * keep the two in sync when the schema changes. Deliberately asks for JSON
 * (not YAML) even though the parser accepts both, since JSON is easier for
 * models to produce correctly without indentation errors.
 */
export function buildSystemPrompt(): string {
  return `You convert a plain-language description of a software system into a JSON object matching this exact schema:

{
  "schemaVersion": 1,
  "system": { "name": string, "subtitle"?: string },
  "root": { "label": string, "description"?: string },
  "components": [
    {
      "id": string,               // stable slug, unique, e.g. "postgres"
      "name": string,             // e.g. "PostgreSQL"
      "shortLabel"?: string,      // short label under the node box, e.g. "Primary DB"
      "direction": ${DIRECTIONS.map((d) => `"${d}"`).join(" | ")},
      "colorFamily"?: ${COLOR_FAMILIES.map((c) => `"${c}"`).join(" | ")},  // omit to let the renderer auto-cycle colors
      "bullets": string[]         // 1-4 short bullets, what the component does and how it connects to the root
    }
  ]
}

Rules:
- "components" must have between 1 and 7 entries. If the description implies more than 7 integrations, group related ones into a single component rather than exceeding 7.
- Each "bullets" array must have 1-4 short entries (roughly one sentence each).
- "direction" describes data flow relative to the root: "outbound" if the root calls the component, "inbound" if the component calls the root, "bidirectional" if both happen.
- "id" values must be unique, lowercase, no spaces (use hyphens).
- Do not invent components the description doesn't mention or imply.
- If a detail is ambiguous (e.g. direction unclear), infer the most sensible default rather than asking a follow-up question — this is a one-shot generation.

Respond with ONLY the JSON object. No prose before or after it, no markdown code fence, no explanation.`;
}
