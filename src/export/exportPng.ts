import type { DiagramSpec } from "../spec";
import { downloadBlob, slugify } from "./download";

/**
 * Rasterizes the SVG via an offscreen <canvas>. Works for v1's diagram
 * sizes; very tall multi-row diagrams may hit browser canvas size limits —
 * tracked as an open question in docs/architecture.md.
 */
export async function exportStaticPng(svgElement: SVGSVGElement, spec: DiagramSpec) {
  const width = svgElement.viewBox.baseVal.width || svgElement.clientWidth;
  const height = svgElement.viewBox.baseVal.height || svgElement.clientHeight;
  const scale = 2; // export at 2x for crisp text

  const markup = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  try {
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    ctx.scale(scale, scale);
    ctx.drawImage(image, 0, 0, width, height);

    const pngBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!pngBlob) throw new Error("Failed to rasterize diagram to PNG");
    downloadBlob(pngBlob, `${slugify(spec.system.name)}-architecture.png`, "image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}
