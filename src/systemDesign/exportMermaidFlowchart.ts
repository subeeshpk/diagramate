import { downloadBlob, slugify } from "../export/download";
import type { SystemDesignEdge, SystemDesignSpec } from "./types";

const ARROW_BY_KIND: Record<SystemDesignEdge["kind"], string> = {
  sync: "-->",
  async: "-.->",
  bidirectional: "<-->",
};

/**
 * Translates a SystemDesignSpec into Mermaid flowchart DSL. Flowchart
 * (not C4) is the right Mermaid diagram type here — C4 models a system's
 * external dependencies from one root (see export/exportMermaid.ts for
 * that), while flowchart handles arbitrary peer-to-peer graphs, which is
 * what this schema represents.
 */
export function buildMermaidFlowchart(spec: SystemDesignSpec): string {
  const lines: string[] = ["flowchart TD"];

  for (const node of spec.nodes) {
    const label = node.shortLabel
      ? `${sanitize(node.name)} (${sanitize(node.shortLabel)})`
      : sanitize(node.name);
    lines.push(`    ${node.id}["${label}"]`);
  }
  lines.push("");

  for (const edge of spec.edges) {
    const arrow = ARROW_BY_KIND[edge.kind];
    const label = edge.label ? `|${sanitize(edge.label)}|` : "";
    lines.push(`    ${edge.from} ${arrow}${label} ${edge.to}`);
  }

  return lines.join("\n") + "\n";
}

export function exportMermaidFlowchart(spec: SystemDesignSpec) {
  const mermaid = buildMermaidFlowchart(spec);
  downloadBlob(mermaid, `${slugify(spec.system.name)}-system-design.mmd`, "text/plain");
}

function sanitize(value: string): string {
  return value.replace(/"/g, "'").replace(/\r?\n/g, " ").trim();
}
