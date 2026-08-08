import { z } from "zod";
import { COLOR_FAMILIES } from "../spec";
import { EDGE_KINDS, NODE_KINDS } from "./types";

// Mirrors docs/spec-schema.md's "System design (graph) spec" section. Keep
// the two in sync when this changes.

const nodeSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    shortLabel: z.string().min(1).optional(),
    kind: z.enum(NODE_KINDS).optional(),
    colorFamily: z.enum(COLOR_FAMILIES).optional(),
  })
  .strict();

const edgeSchema = z
  .object({
    from: z.string().min(1),
    to: z.string().min(1),
    kind: z.enum(EDGE_KINDS),
    label: z.string().min(1).optional(),
  })
  .strict();

export const systemDesignSpecSchema = z
  .object({
    schemaVersion: z.literal(1),
    system: z
      .object({
        name: z.string().min(1),
        subtitle: z.string().optional(),
      })
      .strict(),
    nodes: z.array(nodeSchema).min(2).max(16),
    edges: z.array(edgeSchema).min(1).max(40),
  })
  .strict()
  .superRefine((spec, ctx) => {
    const ids = new Set<string>();
    spec.nodes.forEach((node, index) => {
      if (ids.has(node.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate node id "${node.id}" — ids must be unique.`,
          path: ["nodes", index, "id"],
        });
      }
      ids.add(node.id);
    });

    spec.edges.forEach((edge, index) => {
      if (!ids.has(edge.from)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `edges[${index}].from references unknown node id "${edge.from}".`,
          path: ["edges", index, "from"],
        });
      }
      if (!ids.has(edge.to)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `edges[${index}].to references unknown node id "${edge.to}".`,
          path: ["edges", index, "to"],
        });
      }
    });
  });

export type SystemDesignValidationResult =
  | { ok: true; spec: z.infer<typeof systemDesignSpecSchema> }
  | { ok: false; errors: string[] };

export function validateSystemDesignSpec(input: unknown): SystemDesignValidationResult {
  const result = systemDesignSpecSchema.safeParse(input);
  if (result.success) {
    return { ok: true, spec: result.data };
  }
  const errors = result.error.issues.map((issue) => {
    const path = issue.path.join(".");
    return path ? `${path}: ${issue.message}` : issue.message;
  });
  return { ok: false, errors };
}
