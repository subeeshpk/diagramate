import { z } from "zod";
import { COLOR_FAMILIES, DIRECTIONS } from "./types";

// Mirrors docs/spec-schema.md. Keep the two in sync when this changes.

const componentSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    shortLabel: z.string().min(1).optional(),
    direction: z.enum(DIRECTIONS),
    colorFamily: z.enum(COLOR_FAMILIES).optional(),
    bullets: z.array(z.string().min(1)).min(1).max(4),
  })
  .strict();

export const diagramSpecSchema = z
  .object({
    schemaVersion: z.literal(1),
    system: z
      .object({
        name: z.string().min(1),
        subtitle: z.string().optional(),
      })
      .strict(),
    root: z
      .object({
        label: z.string().min(1),
        description: z.string().optional(),
      })
      .strict(),
    components: z.array(componentSchema).min(1).max(7),
  })
  .strict()
  .superRefine((spec, ctx) => {
    const seen = new Set<string>();
    for (const [index, component] of spec.components.entries()) {
      if (seen.has(component.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate component id "${component.id}" — ids must be unique.`,
          path: ["components", index, "id"],
        });
      }
      seen.add(component.id);
    }
  });

export type ValidationResult =
  | { ok: true; spec: z.infer<typeof diagramSpecSchema> }
  | { ok: false; errors: string[] };

export function validateSpec(input: unknown): ValidationResult {
  const result = diagramSpecSchema.safeParse(input);
  if (result.success) {
    return { ok: true, spec: result.data };
  }
  const errors = result.error.issues.map((issue) => {
    const path = issue.path.join(".");
    return path ? `${path}: ${issue.message}` : issue.message;
  });
  return { ok: false, errors };
}
