import { forwardRef } from "react";
import type { DiagramSpec } from "../spec";
import { computeLayout } from "./layout";
import { PAGE_BG, PALETTE, ROOT_BG, ROOT_TEXT } from "./theme";

const FONT_FAMILY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

interface DiagramSvgProps {
  spec: DiagramSpec;
}

/**
 * Renders a DiagramSpec as a self-contained SVG tree: title, root node,
 * spine, and one row per component (node box -> animated connector ->
 * colored callout card). This is the single source of truth for the visual
 * language — the HTML/SVG/PNG exporters all serialize whatever this renders.
 */
export const DiagramSvg = forwardRef<SVGSVGElement, DiagramSvgProps>(function DiagramSvg(
  { spec },
  ref,
) {
  const layout = computeLayout(spec);

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
        .diagramate-bullet-text { font-size: 12.5px; }
        .diagramate-heading { font-weight: 700; }
      `}</style>

      <defs>
        {Object.entries(PALETTE).map(([family, palette]) => (
          <marker
            key={family}
            id={`diagramate-arrow-${family}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={palette.connector} />
          </marker>
        ))}
      </defs>

      <rect x={0} y={0} width={layout.width} height={layout.height} fill={PAGE_BG} />

      {/* Title */}
      <text
        x={layout.width / 2}
        y={layout.title.eyebrowY}
        textAnchor="middle"
        fill="#8A8577"
        fontSize={12}
        letterSpacing={2.5}
        fontWeight={600}
      >
        SYSTEM ARCHITECTURE
      </text>
      <text
        x={layout.width / 2}
        y={layout.title.mainY}
        textAnchor="middle"
        fill="#1B2A5B"
        fontSize={28}
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
          fontSize={13}
        >
          {spec.system.subtitle}
        </text>
      )}

      {/* Root node */}
      <rect
        x={layout.root.x}
        y={layout.root.y}
        width={layout.root.width}
        height={layout.root.height}
        rx={12}
        fill={ROOT_BG}
        style={{ filter: "drop-shadow(0 4px 10px rgba(27,42,91,0.25))" }}
      />
      <text
        x={layout.root.x + layout.root.width / 2}
        y={layout.root.y + (spec.root.description ? 30 : 40)}
        textAnchor="middle"
        fill={ROOT_TEXT}
        fontSize={16}
        fontWeight={700}
      >
        {spec.root.label}
      </text>
      {spec.root.description && (
        <text
          x={layout.root.x + layout.root.width / 2}
          y={layout.root.y + 50}
          textAnchor="middle"
          fill="#C6CEE6"
          fontSize={11.5}
        >
          {spec.root.description}
        </text>
      )}

      {/* Spine */}
      <line
        x1={layout.spine.x1}
        y1={layout.spine.y1}
        x2={layout.spine.x2}
        y2={layout.spine.y2}
        stroke="#1B2A5B"
        strokeWidth={2}
        opacity={0.35}
      />

      {/* Rows */}
      {layout.rows.map((row) => {
        const palette = PALETTE[row.family];
        const markerId = `diagramate-arrow-${row.family}`;
        const markerEnd =
          row.direction === "outbound" || row.direction === "bidirectional"
            ? `url(#${markerId})`
            : undefined;
        const markerStart =
          row.direction === "inbound" || row.direction === "bidirectional"
            ? `url(#${markerId})`
            : undefined;

        return (
          <g key={row.id}>
            {/* Node box */}
            <rect
              x={row.nodeBox.x}
              y={row.nodeBox.y}
              width={row.nodeBox.width}
              height={row.nodeBox.height}
              rx={8}
              fill="#FFFFFF"
              stroke={palette.border}
              strokeWidth={1.5}
            />
            <text
              x={row.nodeBox.x + row.nodeBox.width / 2}
              y={row.nodeBox.y + (row.shortLabel ? 27 : 37)}
              textAnchor="middle"
              fill="#22262E"
              fontSize={13.5}
              fontWeight={700}
            >
              {row.name}
            </text>
            {row.shortLabel && (
              <text
                x={row.nodeBox.x + row.nodeBox.width / 2}
                y={row.nodeBox.y + 44}
                textAnchor="middle"
                fill="#6B6F76"
                fontSize={11}
              >
                {row.shortLabel}
              </text>
            )}

            {/* Connector */}
            <line
              x1={row.connector.x1}
              y1={row.connector.y1}
              x2={row.connector.x2}
              y2={row.connector.y2}
              stroke={palette.connector}
              strokeWidth={2}
              className="diagramate-flow"
              markerEnd={markerEnd}
              markerStart={markerStart}
            />

            {/* Card */}
            <rect
              x={row.card.x}
              y={row.card.y}
              width={row.card.width}
              height={row.card.height}
              rx={10}
              fill={palette.bg}
              stroke={palette.border}
              strokeWidth={1.5}
            />
            <text
              x={row.card.x + 18}
              y={row.card.y + 26}
              fill={palette.heading}
              fontSize={14.5}
              className="diagramate-heading"
            >
              {row.name}
            </text>
            {(() => {
              let lineY = row.card.y + 26 + 22;
              return row.bullets.map((bullet, bulletIndex) => {
                const bulletLines = bullet.lines.map((line, lineIndex) => {
                  const y = lineY;
                  lineY += 18;
                  return (
                    <text
                      key={lineIndex}
                      x={row.card.x + 32}
                      y={y}
                      fill={palette.body}
                      className="diagramate-bullet-text"
                    >
                      {lineIndex === 0 ? `• ${line}` : line}
                    </text>
                  );
                });
                lineY += 6;
                return <g key={bulletIndex}>{bulletLines}</g>;
              });
            })()}
          </g>
        );
      })}
    </svg>
  );
});
