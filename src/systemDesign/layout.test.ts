import { describe, expect, it } from "vitest";
import uberYaml from "../../examples/example-system-design-uber.yaml?raw";
import { parseSpecText } from "../spec";
import { computeGraphLayout } from "./layout";
import { validateSystemDesignSpec } from "./schema";
import type { SystemDesignSpec } from "./types";

function spec(nodes: SystemDesignSpec["nodes"], edges: SystemDesignSpec["edges"]): SystemDesignSpec {
  return { schemaVersion: 1, system: { name: "Test" }, nodes, edges };
}

describe("computeGraphLayout", () => {
  it("places a linear chain A -> B -> C into three strictly increasing y layers", () => {
    const layout = computeGraphLayout(
      spec(
        [
          { id: "a", name: "A" },
          { id: "b", name: "B" },
          { id: "c", name: "C" },
        ],
        [
          { from: "a", to: "b", kind: "sync" },
          { from: "b", to: "c", kind: "sync" },
        ],
      ),
    );
    const yById = Object.fromEntries(layout.nodes.map((n) => [n.id, n.y]));
    expect(yById.a).toBeLessThan(yById.b);
    expect(yById.b).toBeLessThan(yById.c);
  });

  it("uses longest-path layering: a diamond puts the sink after both parallel paths converge", () => {
    // a -> b -> d (2 hops) and a -> c -> x -> d (3 hops): d must land after
    // the LONGER path, i.e. at layer 3, not layer 2 from the shorter path.
    const layout = computeGraphLayout(
      spec(
        [
          { id: "a", name: "A" },
          { id: "b", name: "B" },
          { id: "c", name: "C" },
          { id: "x", name: "X" },
          { id: "d", name: "D" },
        ],
        [
          { from: "a", to: "b", kind: "sync" },
          { from: "b", to: "d", kind: "sync" },
          { from: "a", to: "c", kind: "sync" },
          { from: "c", to: "x", kind: "sync" },
          { from: "x", to: "d", kind: "sync" },
        ],
      ),
    );
    const yById = Object.fromEntries(layout.nodes.map((n) => [n.id, n.y]));
    expect(yById.d).toBeGreaterThan(yById.x);
    expect(yById.x).toBeGreaterThan(yById.c);
    expect(yById.d).toBeGreaterThan(yById.b);
  });

  it("terminates and produces a valid layout for a graph with a cycle (bidirectional edges)", () => {
    // a <-> b as two directed edges is exactly what a "bidirectional" spec
    // edge implies for layering purposes — must not infinite-loop.
    const layout = computeGraphLayout(
      spec(
        [
          { id: "a", name: "A" },
          { id: "b", name: "B" },
        ],
        [
          { from: "a", to: "b", kind: "bidirectional" },
          { from: "b", to: "a", kind: "bidirectional" },
        ],
      ),
    );
    expect(layout.nodes).toHaveLength(2);
    expect(Number.isFinite(layout.width)).toBe(true);
    expect(Number.isFinite(layout.height)).toBe(true);
    for (const node of layout.nodes) {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
    }
  });

  it("handles a self-loop and a fully isolated node without crashing", () => {
    const layout = computeGraphLayout(
      spec(
        [
          { id: "a", name: "A" },
          { id: "isolated", name: "Isolated" },
        ],
        [{ from: "a", to: "a", kind: "sync" }],
      ),
    );
    const isolated = layout.nodes.find((n) => n.id === "isolated");
    expect(isolated).toBeDefined();
    expect(Number.isFinite(isolated!.x)).toBe(true);
    expect(Number.isFinite(isolated!.y)).toBe(true);
  });

  it("lays out the bundled Uber system design example across multiple layers without throwing", () => {
    const parsed = parseSpecText(uberYaml);
    if (!parsed.ok) throw new Error(parsed.error);
    const result = validateSystemDesignSpec(parsed.value);
    if (!result.ok) throw new Error(result.errors.join(", "));

    const layout = computeGraphLayout(result.spec);
    expect(layout.nodes).toHaveLength(12);
    expect(layout.edges).toHaveLength(11);

    const distinctLayerYs = new Set(layout.nodes.map((n) => n.y));
    expect(distinctLayerYs.size).toBeGreaterThan(1);

    // Every edge should connect to real, finite coordinates.
    for (const edge of layout.edges) {
      expect(Number.isFinite(edge.x1)).toBe(true);
      expect(Number.isFinite(edge.y1)).toBe(true);
      expect(Number.isFinite(edge.x2)).toBe(true);
      expect(Number.isFinite(edge.y2)).toBe(true);
    }
  });
});
