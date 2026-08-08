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

## System design (graph) spec

The spec above models one root plus up to 7 things it depends on — good for
"here's my service and its integrations," not for an arbitrary multi-service
system where components talk to *each other*, not just to one center (a
queue feeding multiple consumers, a cache read and written by several
services, etc.). For that shape, use the graph spec instead:

```jsonc
{
  "schemaVersion": 1,
  "system": {
    "name": "Uber — Ride Matching System Design",
    "subtitle": "Driver assignment flow"
  },
  "nodes": [
    { "id": "driver-app", "name": "Driver App", "kind": "client" },
    { "id": "ride-service", "name": "Ride Service", "kind": "service" },
    { "id": "kafka", "name": "Kafka", "kind": "queue" }
  ],
  "edges": [
    { "from": "ride-service", "to": "kafka", "kind": "async", "label": "trip status event" }
  ]
}
```

The editor auto-detects this shape (presence of a `nodes` key) and switches
renderers automatically — no format picker, just paste either kind of spec.

### Field reference

| Field | Required | Notes |
|---|---|---|
| `schemaVersion` | yes | Same versioning story as the hub-and-spoke spec. |
| `system.name` / `system.subtitle` | name required, subtitle optional | Shown as the diagram title. |
| `nodes[].id` | yes | Stable identifier, referenced by edges. Unique. |
| `nodes[].name` | yes | Node label. |
| `nodes[].shortLabel` | no | Small label under the node name. |
| `nodes[].kind` | no | One of `client \| gateway \| service \| queue \| cache \| database \| external`. Sets a default color (see `src/systemDesign/theme.ts`); omit for a plain white/navy "client" style. |
| `nodes[].colorFamily` | no | Overrides the kind-based default color; same six-family palette as the hub-and-spoke spec. |
| `edges[].from` / `edges[].to` | yes | Must reference existing node ids. |
| `edges[].kind` | yes | `sync` (solid line, one arrowhead — request/response), `async` (animated dashed line — queues/events, use for fan-out by adding one edge per consumer), or `bidirectional` (solid, arrowheads both ends — e.g. a cache both read and written). |
| `edges[].label` | no | Short label drawn at the edge midpoint; recommended for `async` edges so the event/topic name is visible. |

### Validation rules

1. `nodes` must have between 2 and 16 entries.
2. `edges` must have at least 1 entry (up to 40).
3. Node `id`s must be unique; every edge's `from`/`to` must reference a real node id.
4. Unknown fields are rejected, same as the hub-and-spoke spec.

### Layout

Nodes are arranged top-to-bottom by longest-path layering (the same family
of algorithm behind tools like dagre): a node's layer is one more than the
deepest predecessor that reaches it, so a queue with a short path in and a
long path in from elsewhere lands after the longer path. Cycles (common with
`bidirectional` edges) are broken automatically via a back-edge detection
pass before layering, so a cache that's both read and written doesn't
deadlock the algorithm. See `src/systemDesign/layout.ts` for the
implementation and its known limitation (no edge-crossing minimization yet —
fine for the ~8-16 node graphs this schema targets).

See `examples/example-system-design-uber.yaml` for a complete worked
example — a driver-assignment flow modeled after the classic system design
interview whiteboard diagram.
