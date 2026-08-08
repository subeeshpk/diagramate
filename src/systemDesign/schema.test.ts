import { describe, expect, it } from "vitest";
import uberYaml from "../../examples/example-system-design-uber.yaml?raw";
import { parseSpecText } from "../spec";
import { validateSystemDesignSpec } from "./schema";

describe("validateSystemDesignSpec", () => {
  it("validates the bundled Uber system design example", () => {
    const parsed = parseSpecText(uberYaml);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const result = validateSystemDesignSpec(parsed.value);
    expect(result.ok, result.ok ? "" : result.errors.join(", ")).toBe(true);
  });

  const baseSpec = {
    schemaVersion: 1 as const,
    system: { name: "Test" },
    nodes: [
      { id: "a", name: "A" },
      { id: "b", name: "B" },
    ],
    edges: [{ from: "a", to: "b", kind: "sync" as const }],
  };

  it("accepts a minimal valid two-node graph", () => {
    expect(validateSystemDesignSpec(baseSpec).ok).toBe(true);
  });

  it("rejects duplicate node ids", () => {
    const spec = { ...baseSpec, nodes: [...baseSpec.nodes, { id: "a", name: "Duplicate" }] };
    const result = validateSystemDesignSpec(spec);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => e.includes("Duplicate node id"))).toBe(true);
  });

  it("rejects an edge referencing an unknown node id", () => {
    const spec = {
      ...baseSpec,
      edges: [{ from: "a", to: "does-not-exist", kind: "sync" as const }],
    };
    const result = validateSystemDesignSpec(spec);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => e.includes("unknown node id"))).toBe(true);
  });

  it("rejects fewer than 2 nodes", () => {
    const spec = { ...baseSpec, nodes: [baseSpec.nodes[0]], edges: [] };
    expect(validateSystemDesignSpec(spec).ok).toBe(false);
  });

  it("rejects more than 16 nodes", () => {
    const nodes = Array.from({ length: 17 }, (_, i) => ({ id: `n${i}`, name: `Node ${i}` }));
    const spec = { ...baseSpec, nodes, edges: [{ from: "n0", to: "n1", kind: "sync" as const }] };
    expect(validateSystemDesignSpec(spec).ok).toBe(false);
  });

  it("rejects an unknown node kind", () => {
    const spec = {
      ...baseSpec,
      nodes: [{ id: "a", name: "A", kind: "not-a-real-kind" }, baseSpec.nodes[1]],
    };
    expect(validateSystemDesignSpec(spec).ok).toBe(false);
  });
});
