import type { DiagramSpec } from "../spec";
import { downloadBlob, slugify } from "./download";

/**
 * Translates a DiagramSpec into Mermaid C4Context DSL — renders natively on
 * GitHub, GitLab, and Notion, no build step or hosting required. This is a
 * separate, purely textual renderer: it does not touch DiagramSvg or the
 * layout engine, so it can't drift out of sync by breaking the animated
 * renderer, and vice versa.
 *
 * Only the first bullet of each component is used as the relationship
 * label, matching Mermaid's convention of short one-line edge labels — the
 * full bullet list is still available via the HTML/SVG/PNG exports.
 */
export function buildMermaidC4(spec: DiagramSpec): string {
  const lines: string[] = ["C4Context"];

  const title = spec.system.subtitle
    ? `${spec.system.name} - ${spec.system.subtitle}`
    : spec.system.name;
  lines.push(`    title ${sanitize(title)}`);
  lines.push("");

  lines.push(`    System(root, ${quote(spec.root.label)}, ${quote(spec.root.description ?? "")})`);
  lines.push("");

  for (const component of spec.components) {
    const description = component.shortLabel ?? component.bullets[0] ?? "";
    lines.push(
      `    System_Ext(${component.id}, ${quote(component.name)}, ${quote(description)})`,
    );
  }
  lines.push("");

  for (const component of spec.components) {
    const relLabel = quote(component.bullets[0] ?? "");
    switch (component.direction) {
      case "outbound":
        lines.push(`    Rel(root, ${component.id}, ${relLabel})`);
        break;
      case "inbound":
        lines.push(`    Rel(${component.id}, root, ${relLabel})`);
        break;
      case "bidirectional":
        lines.push(`    BiRel(root, ${component.id}, ${relLabel})`);
        break;
    }
  }

  return lines.join("\n") + "\n";
}

export function exportMermaid(spec: DiagramSpec) {
  const mermaid = buildMermaidC4(spec);
  downloadBlob(mermaid, `${slugify(spec.system.name)}-architecture.mmd`, "text/plain");
}

/** Mermaid labels can't safely contain raw double quotes; drop line breaks too. */
function sanitize(value: string): string {
  return value.replace(/"/g, "'").replace(/\r?\n/g, " ").trim();
}

function quote(value: string): string {
  return `"${sanitize(value)}"`;
}
