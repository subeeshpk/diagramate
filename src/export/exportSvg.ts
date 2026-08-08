import { downloadBlob, slugify, type ExportableSpec } from "./download";

/** Exports the raw SVG on its own, animation rules stripped (static docs use). */
export function exportStaticSvg(svgElement: SVGSVGElement, spec: ExportableSpec) {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  clone.querySelectorAll("style").forEach((styleTag) => {
    styleTag.textContent = (styleTag.textContent ?? "").replace(
      /\.diagramate-flow\s*{[^}]*}/,
      ".diagramate-flow { stroke-dasharray: 6 6; }",
    );
  });
  const markup = new XMLSerializer().serializeToString(clone);
  const withDeclaration = `<?xml version="1.0" encoding="UTF-8"?>\n${markup}`;
  downloadBlob(withDeclaration, `${slugify(spec.system.name)}-architecture.svg`, "image/svg+xml");
}
