import type { ColorFamily } from "../spec";
import type { NodeKind } from "./types";

/**
 * Client-facing nodes (mobile apps, browsers) render as plain white boxes
 * with a navy border rather than a tinted card — visually distinct from
 * backend components, matching how "actor" boxes read in most system
 * design diagrams (including the FAANG-interview style this module targets).
 */
export const CLIENT_STYLE = {
  bg: "#FFFFFF",
  border: "#1B2A5B",
  heading: "#1B2A5B",
  body: "#4B5670",
  connector: "#1B2A5B",
} as const;

export type NodeFamily = ColorFamily | "client";

const KIND_DEFAULT_FAMILY: Record<Exclude<NodeKind, "client">, ColorFamily> = {
  gateway: "purple",
  service: "green",
  queue: "teal",
  cache: "coral",
  database: "blue",
  external: "amber",
};

/** Explicit colorFamily always wins; otherwise falls back to the node kind's default, then "client" (plain style) if neither is set. */
export function resolveNodeFamily(
  kind: NodeKind | undefined,
  colorFamily: ColorFamily | undefined,
): NodeFamily {
  if (colorFamily) return colorFamily;
  if (!kind || kind === "client") return "client";
  return KIND_DEFAULT_FAMILY[kind];
}
