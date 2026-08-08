import type { DiagramSpec } from "../spec";
import { resolveFamily } from "./theme";
import { wrapText } from "./wrapText";

export const SVG_WIDTH = 940;

const MARGIN_X = 60;
const TITLE_TOP = 28;
const TITLE_EYEBROW_HEIGHT = 18;
const TITLE_MAIN_HEIGHT = 40;
const SUBTITLE_HEIGHT = 24;
const TITLE_BLOCK_GAP = 26;

const ROOT_WIDTH = 280;
const ROOT_HEIGHT = 74;
const SPINE_HEIGHT = 36;

const NODE_BOX_X = MARGIN_X;
const NODE_BOX_WIDTH = 190;
const NODE_BOX_HEIGHT = 64;

const CONNECTOR_GAP = 28;
const CARD_X = NODE_BOX_X + NODE_BOX_WIDTH + CONNECTOR_GAP + 70; // room for connector + arrowheads
const CARD_WIDTH = SVG_WIDTH - MARGIN_X - CARD_X;
const CARD_PADDING = 18;
const CARD_HEADING_HEIGHT = 24;
const CARD_BULLET_LINE_HEIGHT = 18;
const CARD_BULLET_GAP = 6;
const BULLET_MAX_CHARS = Math.round((CARD_WIDTH - CARD_PADDING * 2 - 14) / 6.2);

const ROW_GAP = 26;
const BOTTOM_MARGIN = 40;

export interface WrappedBullet {
  lines: string[];
}

export interface LayoutRow {
  id: string;
  name: string;
  shortLabel?: string;
  direction: "outbound" | "inbound" | "bidirectional";
  family: ReturnType<typeof resolveFamily>;
  y: number;
  height: number;
  nodeBox: { x: number; y: number; width: number; height: number };
  connector: { x1: number; y1: number; x2: number; y2: number };
  card: { x: number; y: number; width: number; height: number };
  bullets: WrappedBullet[];
}

export interface DiagramLayout {
  width: number;
  height: number;
  title: {
    eyebrowY: number;
    mainY: number;
    subtitleY: number | null;
  };
  root: { x: number; y: number; width: number; height: number };
  spine: { x1: number; y1: number; x2: number; y2: number };
  rows: LayoutRow[];
}

export function computeLayout(spec: DiagramSpec): DiagramLayout {
  let cursorY = TITLE_TOP + TITLE_EYEBROW_HEIGHT + TITLE_MAIN_HEIGHT;
  const eyebrowY = TITLE_TOP + TITLE_EYEBROW_HEIGHT - 4;
  const mainY = cursorY - 6;
  let subtitleY: number | null = null;
  if (spec.system.subtitle) {
    subtitleY = cursorY + SUBTITLE_HEIGHT - 6;
    cursorY += SUBTITLE_HEIGHT;
  }
  cursorY += TITLE_BLOCK_GAP;

  const rootX = (SVG_WIDTH - ROOT_WIDTH) / 2;
  const root = { x: rootX, y: cursorY, width: ROOT_WIDTH, height: ROOT_HEIGHT };
  cursorY += ROOT_HEIGHT;

  const spine = {
    x1: SVG_WIDTH / 2,
    y1: cursorY,
    x2: SVG_WIDTH / 2,
    y2: cursorY + SPINE_HEIGHT,
  };
  cursorY += SPINE_HEIGHT;

  const rows: LayoutRow[] = spec.components.map((component, index) => {
    const bullets: WrappedBullet[] = component.bullets.map((b) => ({
      lines: wrapText(b, BULLET_MAX_CHARS),
    }));
    const bulletLineCount = bullets.reduce((sum, b) => sum + b.lines.length, 0);
    const cardContentHeight =
      CARD_PADDING * 2 +
      CARD_HEADING_HEIGHT +
      bulletLineCount * CARD_BULLET_LINE_HEIGHT +
      Math.max(0, bullets.length - 1) * CARD_BULLET_GAP;
    const rowHeight = Math.max(cardContentHeight, NODE_BOX_HEIGHT);

    const rowTop = cursorY;
    const nodeBox = {
      x: NODE_BOX_X,
      y: rowTop + (rowHeight - NODE_BOX_HEIGHT) / 2,
      width: NODE_BOX_WIDTH,
      height: NODE_BOX_HEIGHT,
    };
    const card = {
      x: CARD_X,
      y: rowTop + (rowHeight - cardContentHeight) / 2,
      width: CARD_WIDTH,
      height: cardContentHeight,
    };
    const connector = {
      x1: nodeBox.x + nodeBox.width,
      y1: rowTop + rowHeight / 2,
      x2: card.x,
      y2: rowTop + rowHeight / 2,
    };

    cursorY += rowHeight + ROW_GAP;

    return {
      id: component.id,
      name: component.name,
      shortLabel: component.shortLabel,
      direction: component.direction,
      family: resolveFamily(component.colorFamily, index),
      y: rowTop,
      height: rowHeight,
      nodeBox,
      connector,
      card,
      bullets,
    };
  });

  const height = cursorY - ROW_GAP + BOTTOM_MARGIN;

  return {
    width: SVG_WIDTH,
    height,
    title: { eyebrowY, mainY, subtitleY },
    root,
    spine,
    rows,
  };
}
