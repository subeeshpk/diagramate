import type { SystemDesignEdge, SystemDesignSpec } from "./types";
import { resolveNodeFamily, type NodeFamily } from "./theme";

const NODE_WIDTH = 170;
const NODE_HEIGHT = 64;
const LAYER_GAP = 120;
const NODE_GAP = 34;
const MARGIN = 50;
const TITLE_HEIGHT = 96;

export interface GraphNodeLayout {
  id: string;
  name: string;
  shortLabel?: string;
  family: NodeFamily;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GraphEdgeLayout {
  kind: SystemDesignEdge["kind"];
  label?: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  family: NodeFamily;
}

export interface GraphLayout {
  width: number;
  height: number;
  title: { mainY: number; subtitleY: number | null };
  nodes: GraphNodeLayout[];
  edges: GraphEdgeLayout[];
}

/**
 * Layers the graph top-to-bottom via longest-path layering (Kahn's
 * algorithm on a DAG), the same family of algorithm behind tools like
 * dagre, simplified for the graph sizes this schema targets (≤16 nodes).
 * Cycles are broken first via a DFS back-edge pass — real system designs
 * routinely have bidirectional edges (a cache read+written by the same
 * service) that would otherwise make longest-path layering loop forever.
 *
 * Within a layer, nodes keep their original spec order rather than being
 * reordered to minimize edge crossings — good enough for typical interview
 * diagrams (8-16 nodes); a barycenter crossing-reduction pass is a
 * reasonable follow-up if larger graphs start looking tangled.
 */
export function computeGraphLayout(spec: SystemDesignSpec): GraphLayout {
  const nodeById = new Map(spec.nodes.map((node) => [node.id, node]));

  const forwardAdjacency = new Map<string, string[]>();
  spec.nodes.forEach((node) => forwardAdjacency.set(node.id, []));
  for (const edge of spec.edges) {
    forwardAdjacency.get(edge.from)?.push(edge.to);
  }

  const backEdgeKeys = findBackEdges(spec.nodes.map((n) => n.id), forwardAdjacency);

  const dagAdjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  spec.nodes.forEach((node) => {
    dagAdjacency.set(node.id, []);
    inDegree.set(node.id, 0);
  });
  for (const edge of spec.edges) {
    if (backEdgeKeys.has(`${edge.from}->${edge.to}`)) continue;
    dagAdjacency.get(edge.from)?.push(edge.to);
    inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
  }

  const layer = new Map<string, number>();
  const queue: string[] = [];
  const remainingInDegree = new Map(inDegree);
  for (const node of spec.nodes) {
    if ((remainingInDegree.get(node.id) ?? 0) === 0) {
      layer.set(node.id, 0);
      queue.push(node.id);
    }
  }
  let head = 0;
  while (head < queue.length) {
    const u = queue[head++];
    for (const v of dagAdjacency.get(u) ?? []) {
      layer.set(v, Math.max(layer.get(v) ?? 0, (layer.get(u) ?? 0) + 1));
      const remaining = (remainingInDegree.get(v) ?? 0) - 1;
      remainingInDegree.set(v, remaining);
      if (remaining === 0) queue.push(v);
    }
  }
  // Safety net: anything unreached (shouldn't happen once back edges are
  // excluded, but a malformed graph shouldn't crash the renderer).
  spec.nodes.forEach((node) => {
    if (!layer.has(node.id)) layer.set(node.id, 0);
  });

  const maxLayer = Math.max(0, ...Array.from(layer.values()));
  const layers: string[][] = Array.from({ length: maxLayer + 1 }, () => []);
  spec.nodes.forEach((node) => {
    layers[layer.get(node.id) ?? 0].push(node.id);
  });

  const layerWidths = layers.map(
    (ids) => ids.length * NODE_WIDTH + Math.max(0, ids.length - 1) * NODE_GAP,
  );
  const totalWidth = Math.max(...layerWidths, 400);

  const nodeLayoutById = new Map<string, GraphNodeLayout>();
  layers.forEach((ids, layerIndex) => {
    const layerWidth = layerWidths[layerIndex];
    const startX = (totalWidth - layerWidth) / 2 + MARGIN;
    const y = TITLE_HEIGHT + layerIndex * LAYER_GAP;
    ids.forEach((id, i) => {
      const node = nodeById.get(id)!;
      const x = startX + i * (NODE_WIDTH + NODE_GAP);
      nodeLayoutById.set(id, {
        id,
        name: node.name,
        shortLabel: node.shortLabel,
        family: resolveNodeFamily(node.kind, node.colorFamily),
        x,
        y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });
    });
  });

  const nodes = spec.nodes.map((node) => nodeLayoutById.get(node.id)!);

  const edges: GraphEdgeLayout[] = spec.edges.map((edge) => {
    const from = nodeLayoutById.get(edge.from)!;
    const to = nodeLayoutById.get(edge.to)!;
    const [p1, p2] = connectorPoints(from, to);
    return {
      kind: edge.kind,
      label: edge.label,
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y,
      family: from.family,
    };
  });

  const height = TITLE_HEIGHT + maxLayer * LAYER_GAP + NODE_HEIGHT + MARGIN;
  const width = totalWidth + MARGIN * 2;

  return {
    width,
    height,
    title: { mainY: 38, subtitleY: spec.system.subtitle ? 60 : null },
    nodes,
    edges,
  };
}

/**
 * DFS-based back-edge detection: a standard edge is classified as a "back
 * edge" if it points to a node currently on the DFS stack (an ancestor),
 * which is exactly what creates a cycle. Excluding back edges from the
 * layering graph guarantees Kahn's algorithm terminates.
 */
function findBackEdges(
  nodeIds: string[],
  adjacency: Map<string, string[]>,
): Set<string> {
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, number>(nodeIds.map((id) => [id, WHITE]));
  const backEdges = new Set<string>();

  function visit(u: string) {
    color.set(u, GRAY);
    for (const v of adjacency.get(u) ?? []) {
      const state = color.get(v);
      if (state === WHITE) {
        visit(v);
      } else if (state === GRAY) {
        backEdges.add(`${u}->${v}`);
      }
    }
    color.set(u, BLACK);
  }

  for (const id of nodeIds) {
    if (color.get(id) === WHITE) visit(id);
  }

  return backEdges;
}

/** Picks connection points on each box's border along the dominant axis between the two centers, so lines terminate cleanly at the box edge instead of the center. */
function connectorPoints(
  from: { x: number; y: number; width: number; height: number },
  to: { x: number; y: number; width: number; height: number },
): [{ x: number; y: number }, { x: number; y: number }] {
  const fromCenter = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
  const toCenter = { x: to.x + to.width / 2, y: to.y + to.height / 2 };
  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;

  if (Math.abs(dy) >= Math.abs(dx)) {
    const p1 = { x: fromCenter.x, y: dy > 0 ? from.y + from.height : from.y };
    const p2 = { x: toCenter.x, y: dy > 0 ? to.y : to.y + to.height };
    return [p1, p2];
  }
  const p1 = { x: dx > 0 ? from.x + from.width : from.x, y: fromCenter.y };
  const p2 = { x: dx > 0 ? to.x : to.x + to.width, y: toCenter.y };
  return [p1, p2];
}
