import { describe, expect, it } from "vitest";
import pallgerixJson from "../../examples/example-spec.json";
import pallgerixYaml from "../../examples/example-spec.yaml?raw";
import uberYaml from "../../examples/example-spec-uber.yaml?raw";
import { parseSpecText } from "./parse";
import { validateSpec } from "./schema";

/**
 * Every file in examples/ is documentation people copy-paste from — if one
 * of these silently stopped validating (e.g. after a schema change), that
 * would be a broken example shipped to users. Keep this list in sync with
 * examples/.
 */
const EXAMPLE_SPECS: Record<string, unknown> = {
  "example-spec.json": pallgerixJson,
  "example-spec.yaml": pallgerixYaml,
  "example-spec-uber.yaml": uberYaml,
};

describe("bundled example specs", () => {
  for (const [filename, contents] of Object.entries(EXAMPLE_SPECS)) {
    it(`${filename} parses and validates against the schema`, () => {
      const raw = typeof contents === "string" ? contents : JSON.stringify(contents);
      const parsed = parseSpecText(raw);
      expect(parsed.ok, parsed.ok ? "" : `parse error: ${(parsed as { error: string }).error}`).toBe(
        true,
      );
      if (!parsed.ok) return;

      const result = validateSpec(parsed.value);
      expect(
        result.ok,
        result.ok ? "" : `validation errors: ${result.errors.join(", ")}`,
      ).toBe(true);
    });
  }

  it("has between 1 and 7 components in the Uber example (schema limit)", () => {
    const parsed = parseSpecText(uberYaml);
    if (!parsed.ok) throw new Error(parsed.error);
    const result = validateSpec(parsed.value);
    if (!result.ok) throw new Error(result.errors.join(", "));
    expect(result.spec.components.length).toBeGreaterThanOrEqual(1);
    expect(result.spec.components.length).toBeLessThanOrEqual(7);
  });
});
