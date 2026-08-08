import { describe, expect, it } from "vitest";
// `?raw` is a Vite/Vitest convention for importing a file's contents as a
// plain string instead of letting a loader parse it.
import yamlSpecText from "../../examples/example-spec.yaml?raw";
import jsonSpec from "../../examples/example-spec.json";
import { parseSpecText } from "./parse";
import { validateSpec } from "./schema";

describe("parseSpecText", () => {
  it("parses YAML input into the same structure as the equivalent JSON file", () => {
    const parsed = parseSpecText(yamlSpecText);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value).toEqual(jsonSpec);
  });

  it("parses plain JSON text too, since YAML is a superset of JSON", () => {
    const jsonText = JSON.stringify(jsonSpec);
    const parsed = parseSpecText(jsonText);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value).toEqual(jsonSpec);
  });

  it("YAML input validates against the same spec schema as JSON input", () => {
    const parsed = parseSpecText(yamlSpecText);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const result = validateSpec(parsed.value);
    expect(result.ok).toBe(true);
  });

  it("reports a parse error for malformed input instead of throwing", () => {
    const parsed = parseSpecText("components:\n  - id: a\n  bad indentation here");
    expect(parsed.ok).toBe(false);
  });
});
