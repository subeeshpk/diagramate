import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import uberYaml from "../../examples/example-system-design-uber.yaml?raw";
import { parseSpecText } from "../spec";
import { GraphSvg } from "./GraphSvg";
import { validateSystemDesignSpec } from "./schema";

/**
 * Pure server-render smoke test — layout.test.ts already checks the
 * geometry math, this catches anything that only breaks at actual React
 * render time (undefined palette lookups, missing keys, etc.) which the
 * pure-function layout tests can't see.
 */
describe("GraphSvg", () => {
  it("renders the bundled Uber system design without throwing, with every node name present", () => {
    const parsed = parseSpecText(uberYaml);
    if (!parsed.ok) throw new Error(parsed.error);
    const result = validateSystemDesignSpec(parsed.value);
    if (!result.ok) throw new Error(result.errors.join(", "));

    const markup = renderToStaticMarkup(<GraphSvg spec={result.spec} />);

    expect(markup).toContain("<svg");
    expect(markup).toContain("viewBox");
    for (const node of result.spec.nodes) {
      expect(markup).toContain(node.name);
    }
    // Async edges get the animated dash class; the Uber example has several.
    expect(markup).toContain("diagramate-flow");
  });

  it("renders a client-kind node with the plain white/navy style, not an undefined palette entry", () => {
    const spec = {
      schemaVersion: 1 as const,
      system: { name: "Test" },
      nodes: [
        { id: "a", name: "Mobile App", kind: "client" as const },
        { id: "b", name: "API", kind: "gateway" as const },
      ],
      edges: [{ from: "a", to: "b", kind: "sync" as const }],
    };
    const markup = renderToStaticMarkup(<GraphSvg spec={spec} />);
    expect(markup).toContain("Mobile App");
    expect(markup).toContain("#1B2A5B"); // CLIENT_STYLE border/heading color
  });
});
