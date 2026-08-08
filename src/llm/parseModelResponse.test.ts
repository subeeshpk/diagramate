import { describe, expect, it } from "vitest";
import { SpecGenerationError } from "./types";
import { parseModelResponse } from "./parseModelResponse";

const VALID_SPEC_JSON = JSON.stringify({
  schemaVersion: 1,
  system: { name: "Test System" },
  root: { label: "API" },
  components: [
    {
      id: "db",
      name: "Postgres",
      direction: "bidirectional",
      bullets: ["Stores everything"],
    },
  ],
});

describe("parseModelResponse", () => {
  it("parses a bare JSON response", () => {
    const result = parseModelResponse(VALID_SPEC_JSON);
    expect(result.spec.system.name).toBe("Test System");
    expect(result.rawResponse).toBe(VALID_SPEC_JSON);
  });

  it("strips a ```json code fence before parsing", () => {
    const fenced = "```json\n" + VALID_SPEC_JSON + "\n```";
    const result = parseModelResponse(fenced);
    expect(result.spec.system.name).toBe("Test System");
  });

  it("strips a bare ``` code fence (no language tag) before parsing", () => {
    const fenced = "```\n" + VALID_SPEC_JSON + "\n```";
    const result = parseModelResponse(fenced);
    expect(result.spec.system.name).toBe("Test System");
  });

  it("throws SpecGenerationError with the raw text on unparseable output", () => {
    const garbage = "Sorry, I can't help with that.";
    expect(() => parseModelResponse(garbage)).toThrow(SpecGenerationError);
    try {
      parseModelResponse(garbage);
    } catch (error) {
      expect(error).toBeInstanceOf(SpecGenerationError);
      expect((error as SpecGenerationError).rawResponse).toBe(garbage);
    }
  });

  it("throws SpecGenerationError with validation errors on schema-invalid JSON", () => {
    const invalidSpec = JSON.stringify({ schemaVersion: 1, system: { name: "X" } });
    try {
      parseModelResponse(invalidSpec);
      throw new Error("expected parseModelResponse to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(SpecGenerationError);
      expect((error as SpecGenerationError).validationErrors.length).toBeGreaterThan(0);
    }
  });
});
