import { describe, expect, it } from "vitest";
import exampleSpec from "../../examples/example-spec.json";
import { validateSpec } from "../spec";
import { buildMermaidC4 } from "./exportMermaid";

describe("buildMermaidC4", () => {
  it("produces a C4Context diagram with a System per component and one Rel/BiRel per component", () => {
    const result = validateSpec(exampleSpec);
    if (!result.ok) throw new Error("example-spec.json failed validation: " + result.errors.join(", "));

    const mermaid = buildMermaidC4(result.spec);

    expect(mermaid.startsWith("C4Context")).toBe(true);
    expect(mermaid).toContain(`System(root, "${result.spec.root.label}"`);

    for (const component of result.spec.components) {
      expect(mermaid).toContain(`System_Ext(${component.id},`);
      if (component.direction === "outbound") {
        expect(mermaid).toContain(`Rel(root, ${component.id},`);
      } else if (component.direction === "inbound") {
        expect(mermaid).toContain(`Rel(${component.id}, root,`);
      } else {
        expect(mermaid).toContain(`BiRel(root, ${component.id},`);
      }
    }
  });

  it("replaces raw double quotes inside labels instead of emitting them unescaped (would break Mermaid parsing)", () => {
    const spec = {
      schemaVersion: 1 as const,
      system: { name: 'System "with quotes"' },
      root: { label: "Root" },
      components: [
        {
          id: "a",
          name: "A",
          direction: "outbound" as const,
          bullets: ['Does "something" tricky'],
        },
      ],
    };
    const mermaid = buildMermaidC4(spec);

    // Title isn't wrapped in quotes, so it must have its internal quotes sanitized.
    expect(mermaid).toContain("title System 'with quotes'");
    // The bullet becomes a quoted Rel label — internal quotes must be sanitized too.
    expect(mermaid).toContain('Rel(root, a, "Does \'something\' tricky")');
  });
});
