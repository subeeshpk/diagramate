import { describe, expect, it } from "vitest";
import uberYaml from "../../examples/example-system-design-uber.yaml?raw";
import { parseSpecText } from "../spec";
import { buildMermaidFlowchart } from "./exportMermaidFlowchart";
import { validateSystemDesignSpec } from "./schema";

describe("buildMermaidFlowchart", () => {
  it("emits a node declaration per node and an arrow per edge for the Uber example", () => {
    const parsed = parseSpecText(uberYaml);
    if (!parsed.ok) throw new Error(parsed.error);
    const result = validateSystemDesignSpec(parsed.value);
    if (!result.ok) throw new Error(result.errors.join(", "));

    const mermaid = buildMermaidFlowchart(result.spec);

    expect(mermaid.startsWith("flowchart TD")).toBe(true);
    for (const node of result.spec.nodes) {
      expect(mermaid).toContain(`${node.id}["`);
    }
    const arrowByKind = { sync: "-->", async: "-.->", bidirectional: "<-->" } as const;
    for (const edge of result.spec.edges) {
      // Edges may or may not carry a label, so only assert the arrow immediately follows "from".
      expect(mermaid).toContain(`${edge.from} ${arrowByKind[edge.kind]}`);
    }
  });

  it("uses the right arrow style per edge kind on a small fixture", () => {
    const spec = {
      schemaVersion: 1 as const,
      system: { name: "Test" },
      nodes: [
        { id: "a", name: "A" },
        { id: "b", name: "B" },
        { id: "c", name: "C" },
        { id: "d", name: "D" },
      ],
      edges: [
        { from: "a", to: "b", kind: "sync" as const },
        { from: "b", to: "c", kind: "async" as const, label: "event" },
        { from: "c", to: "d", kind: "bidirectional" as const },
      ],
    };
    const mermaid = buildMermaidFlowchart(spec);
    expect(mermaid).toContain("a --> b");
    expect(mermaid).toContain("b -.->|event| c");
    expect(mermaid).toContain("c <--> d");
  });
});
