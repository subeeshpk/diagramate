export const COLOR_FAMILIES = [
  "blue",
  "teal",
  "green",
  "amber",
  "coral",
  "purple",
] as const;

export type ColorFamily = (typeof COLOR_FAMILIES)[number];

export const DIRECTIONS = ["outbound", "inbound", "bidirectional"] as const;

export type Direction = (typeof DIRECTIONS)[number];

export interface DiagramComponent {
  id: string;
  name: string;
  shortLabel?: string;
  direction: Direction;
  colorFamily?: ColorFamily;
  bullets: string[];
}

export interface DiagramRoot {
  label: string;
  description?: string;
}

export interface DiagramSystem {
  name: string;
  subtitle?: string;
}

export interface DiagramSpec {
  schemaVersion: 1;
  system: DiagramSystem;
  root: DiagramRoot;
  components: DiagramComponent[];
}
