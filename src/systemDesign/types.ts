import { COLOR_FAMILIES, type ColorFamily } from "../spec";

export const NODE_KINDS = [
  "client",
  "gateway",
  "service",
  "queue",
  "cache",
  "database",
  "external",
] as const;

export type NodeKind = (typeof NODE_KINDS)[number];

export const EDGE_KINDS = ["sync", "async", "bidirectional"] as const;

export type EdgeKind = (typeof EDGE_KINDS)[number];

export interface SystemDesignNode {
  id: string;
  name: string;
  shortLabel?: string;
  /** Determines default color family (see systemDesign/theme.ts); omit for a plain client-style box. */
  kind?: NodeKind;
  /** Overrides the kind-based default color. */
  colorFamily?: ColorFamily;
}

export interface SystemDesignEdge {
  from: string;
  to: string;
  /** sync = solid line, single arrowhead. async = animated dashed line (queues/events). bidirectional = solid, arrowheads both ends. */
  kind: EdgeKind;
  label?: string;
}

export interface SystemDesignSystem {
  name: string;
  subtitle?: string;
}

export interface SystemDesignSpec {
  schemaVersion: 1;
  system: SystemDesignSystem;
  nodes: SystemDesignNode[];
  edges: SystemDesignEdge[];
}

export { COLOR_FAMILIES };
export type { ColorFamily };
