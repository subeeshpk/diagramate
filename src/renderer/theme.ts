import type { ColorFamily } from "../spec";

export interface FamilyPalette {
  bg: string; // light tint card background
  border: string; // matching border
  heading: string; // dark heading color
  body: string; // mid-tone bullet text color
  connector: string; // connector line + node accent
}

export const PAGE_BG = "#F7F6F2";
export const ROOT_BG = "#1B2A5B";
export const ROOT_TEXT = "#FFFFFF";

export const PALETTE: Record<ColorFamily, FamilyPalette> = {
  blue: {
    bg: "#E8F0FE",
    border: "#A9C6F5",
    heading: "#1D3A6E",
    body: "#3C5C94",
    connector: "#4472C4",
  },
  teal: {
    bg: "#E1F4F1",
    border: "#9AD9CE",
    heading: "#0F5C52",
    body: "#2E7D71",
    connector: "#2A9D8F",
  },
  green: {
    bg: "#EAF6E4",
    border: "#B6DFA0",
    heading: "#2F5D24",
    body: "#4F7A3E",
    connector: "#6BA84F",
  },
  amber: {
    bg: "#FCF1DA",
    border: "#F1CE8A",
    heading: "#7A5410",
    body: "#96712A",
    connector: "#D9A441",
  },
  coral: {
    bg: "#FCE8E4",
    border: "#F3B4A6",
    heading: "#8C3220",
    body: "#B04B37",
    connector: "#E0674C",
  },
  purple: {
    bg: "#EFE7F7",
    border: "#C9AEE6",
    heading: "#4C2A73",
    body: "#6C4694",
    connector: "#8E5FC2",
  },
};

export const COLOR_CYCLE: ColorFamily[] = [
  "blue",
  "teal",
  "green",
  "amber",
  "coral",
  "purple",
];

/** Resolve a component's palette, cycling through COLOR_CYCLE by index when no colorFamily is set. */
export function resolveFamily(
  colorFamily: ColorFamily | undefined,
  index: number,
): ColorFamily {
  return colorFamily ?? COLOR_CYCLE[index % COLOR_CYCLE.length];
}
