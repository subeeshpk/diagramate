# Diagram spec schema (v1)

This is the format every input path — the natural-language LLM adapters and
the manual editor — must produce, and the only format the renderer consumes.
Derived directly from the fields in the original
`architecture_diagram_prompt_template.md` (Template A).

The editor accepts this spec as **either JSON or YAML** — they parse through
the same code path (`src/spec/parse.ts`) since YAML is a strict superset of
JSON, so there's no format toggle to pick. `examples/example-spec.json` and
`examples/example-spec.yaml` are the same spec in both forms.

## Shape

```jsonc
{
  "schemaVersion": 1,
  "system": {
    "name": "Pallgerix",
    "subtitle": "Healthcare platform stack · 5 clinics · staff-only access"
  },
  "root": {
    "label": "Pallgerix API",
    "description": "Core application server"
  },
  "components": [
    {
      "id": "stripe",
      "name": "Stripe",
      "shortLabel": "Payments",
      "direction": "outbound",        // "outbound" | "inbound" | "bidirectional"
      "colorFamily": "blue",           // cycles automatically if omitted
      "bullets": [
        "App calls Stripe to charge a card when an invoice is created",
        "Webhook confirms payment status back to the app"
      ]
    }
  ]
}
```

## Field reference

| Field | Required | Notes |
|---|---|---|
| `schemaVersion` | yes | Integer. Bump on breaking changes; renderer refuses unknown versions rather than guessing. |
| `system.name` | yes | Shown as the small-caps title line. |
| `system.subtitle` | no | One-line subtitle under the title. |
| `root.label` | yes | Root node text. |
| `root.description` | no | Short description, shown under the label if the renderer has room. |
| `components[].id` | yes | Stable identifier, used for keys/animation targets — not shown to the user. |
| `components[].name` | yes | Component name (node label). |
| `components[].shortLabel` | no | Small label under the node box. |
| `components[].direction` | yes | `outbound` (root → component), `inbound` (component → root), `bidirectional`. Maps to arrowhead placement. |
| `components[].colorFamily` | no | One of `blue \| teal \| green \| amber \| coral \| purple`. If omitted, the renderer cycles through the palette in component order — this is what most specs should do. |
| `components[].bullets` | yes | 2–4 short strings for the callout card. Renderer truncates/warns above 4. |

## Deliberately excluded from v1

- Multi-layer / multi-flow specs (Template B). That needs a different
  top-level shape (`layers[]`, `flows[]`) and is a v2 schema addition, not a
  v1 concern — don't try to make one schema cover both now.
- Per-node custom colors outside the six-family palette (keeps the visual
  language consistent, which is part of the product's identity).
- Layout hints (x/y positions, row ordering overrides). v1 layout is always
  "one row per component, in array order."

## Validation rules the renderer enforces

1. `components` must have at least 1 and at most 7 entries (beyond 7, the
   spec is rejected with a message suggesting the user group components —
   matches the original template's guidance).
2. Every `bullets` array must have 1–4 entries.
3. `id` values must be unique.
4. Unknown top-level or component fields are rejected, not silently dropped
   — this catches LLM output drift early instead of producing a diagram
   that's silently missing data.

See `examples/example-spec.json` for a complete worked example.
