import { parse as parseYaml } from "yaml";

export type ParseResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string };

/**
 * Parses spec text as YAML, which is a strict superset of JSON — every
 * valid JSON document is also valid YAML. This means the editor accepts
 * both formats through a single code path with no format toggle or
 * detection needed: a user can paste JSON, paste YAML, or hand-write either
 * and it just works.
 */
export function parseSpecText(text: string): ParseResult {
  try {
    const value = parseYaml(text);
    return { ok: true, value };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}
