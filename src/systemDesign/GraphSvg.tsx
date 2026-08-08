import { forwardRef } from "react";
import { PAGE_BG, PALETTE } from "../renderer/theme";
import { computeGraphLayout } from "./layout";
import { CLIENT_STYLE, type NodeFamily } from "./theme";
import type { SystemDesignSpec } from "./types";

const FONT_FAMILY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

interface GraphSvgProps {
  spec: SystemDesignSpec;
}

function styleFor(family: NodeFamily) {
  return family === "client" ? CLIENT_STYLE : PALETTE[family];
}

/**
 * Renders a SystemDesignSpec (arbitrary nodes + directed edges) as an SVG
 * graph — the peer-to-peer counterpart to DiagramSvg's hub-and-spoke
 * layout, for system designs with multiple services talking to each other
 * rather than one central root. Same visual language (warm background,
 * six-family palette, animated flowing-dash for async edges) so a graph
 * diagram and a hub-and-spoke diagram from the same tool don't look like
 * they came from two different products.
 */
export const GraphSvg = forwardRef<SVGSVGElement, GraphSvgProps>(function GraphSvg(
  { spec },
  ref,
) {
  const layout = computeGraphLayout(spec);
  const families = Array.from(new Set(layout.nodes.map((n) => n.family)));

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      width={layout.width}
      height={layout.height}
      xmlns="http://www.w3.org/2000/svg"
      style={{ fontFamily: FONT_FAMILY }}
    >
      <style>{`
        .diagramate-flow {
          stroke-dasharray: 6 6;
          animation: diagramate-dash 1.4s linear infinite;
        }
        @keyframes diagramate-dash {
          to { stroke-dashoffset: -24; }
        }
        .diagramate-node-label { font-size: 13px; font-weight: 700; }
        .diagramate-node-sublabel { font-size: 10.5px; }
        .diagramate-edge-label { font-size: 10.5px; font-weight: 600; }
      `}</style>

      <defs>
        {families.map((family) => (
          <marker
            key={family}
            id={`diagramate-graph-arrow-${family}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={styleFor(family).connector} />
          </marker>
        ))}
      </defs>

      <rect x={0} y={0} width={layout.width} height={layout.height} fill={PAGE_BG} />

      <text
        x={layout.width / 2}
        y={layout.title.mainY}
        textAnchor="middle"
        fill="#1B2A5B"
        fontSize={24}
        fontWeight={800}
      >
        {spec.system.name}
      </text>
      {layout.title.subtitleY && spec.system.subtitle && (
        <text
          x={layout.width / 2}
          y={layout.title.subtitleY}
          textAnchor="middle"
          fill="#6B6656"
          fontSize={12.5}
        >
          {spec.system.subtitle}
        </text>
      )}

      {/* Edges drawn before nodes so box borders sit cleanly over line ends. */}
      {layout.edges.map((edge, index) => {
        const style = styleFor(edge.family);
        const markerId = `diagramate-graph-arrow-${edge.family}`;
        const isAsync = edge.kind === "async";
        const midX = (edge.x1 + edge.x2) / 2;
        const midY = (edge.y1 + edge.y2) / 2;

        return (
          <g key={index}>
            <line
              x1={edge.x1}
              y1={edge.y1}
              x2={edge.x2}
              y2={edge.y2}
              stroke={style.connector}
              strokeWidth={2}
              className={isAsync ? "diagramate-flow" : undefined}
              markerEnd={`url(#${markerId})`}
              markerStart={edge.kind === "bidirectional" ? `url(#${markerId})` : undefined}
            />
            {edge.label && (
              <text
                x={midX}
                y={midY - 6}
                textAnchor="middle"
                fill={style.heading}
                className="diagramate-edge-label"
                style={{ paintOrder: "stroke", stroke: PAGE_BG, strokeWidth: 4 }}
              >
                {edge.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Nodes */}
      {layout.nodes.map((node) => {
        const style = styleFor(node.family);
        return (
          <g key={node.id}>
            <rect
              x={node.x}
              y={node.y}
              width={node.width}
              height={node.height}
              rx={10}
              fill={style.bg}
              stroke={style.border}
              strokeWidth={1.5}
            />
            <text
              x={node.x + node.width / 2}
              y={node.y + (node.shortLabel ? 27 : 37)}
              textAnchor="middle"
              fill={style.heading}
              className="diagramate-node-label"
            >
              {node.name}
            </text>
            {node.shortLabel && (
              <text
                x={node.x + node.width / 2}
                y={node.y + 44}
                textAnchor="middle"
                fill={style.body}
                className="diagramate-node-sublabel"
              >
                {node.shortLabel}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
});
