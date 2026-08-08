import type { DiagramSpec } from "../spec";
import { PAGE_BG } from "../renderer/theme";
import { downloadBlob, slugify } from "./download";

/**
 * Wraps a rendered <svg> element's markup into a standalone HTML file:
 * inline styles, Google Fonts link, the SVG itself, and the footer note
 * from the original prompt template. No external JS dependencies.
 */
export function buildStandaloneHtml(svgElement: SVGSVGElement, spec: DiagramSpec): string {
  const svgMarkup = new XMLSerializer().serializeToString(svgElement);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(spec.system.name)} — Architecture Diagram</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<style>
  body {
    margin: 0;
    padding: 40px 20px;
    background: ${PAGE_BG};
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .diagramate-canvas { max-width: 960px; width: 100%; }
  .diagramate-footer {
    margin-top: 24px;
    color: #8A8577;
    font-size: 12px;
    text-align: center;
  }
</style>
</head>
<body>
  <div class="diagramate-canvas">
    ${svgMarkup}
  </div>
  <p class="diagramate-footer">
    Open in a browser and record with ScreenToGif / Kap / LICEcap to export as an animated GIF.
    Generated with <a href="https://github.com/subeeshpk/diagramate" style="color:#8A8577;">Diagramate</a>.
  </p>
</body>
</html>
`;
}

export function exportStandaloneHtml(svgElement: SVGSVGElement, spec: DiagramSpec) {
  const html = buildStandaloneHtml(svgElement, spec);
  downloadBlob(html, `${slugify(spec.system.name)}-architecture.html`, "text/html");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
