# Reusable prompts: generate a Diagramate spec

Two templates below, matching Diagramate's two spec shapes:

- **Template A — single system.** One central service and up to 7 things it
  depends on (a database, Stripe, Auth0, etc.). Use this when there's a
  clear "root" and everything else is a dependency of it.
- **Template B — system design (graph).** Multiple services calling each
  other, a queue with several consumers, a cache read and written by more
  than one service — no single "center." This is the shape for
  FAANG-interview-style system design diagrams.

Copy the relevant block, fill in your system description at the bottom, and
paste it into any LLM chat (Claude, ChatGPT, etc.). It'll produce a YAML
document you can paste straight into the Diagramate editor's "Write spec"
tab — the editor auto-detects which of the two shapes you pasted, no format
picker needed.

These mirror the schemas the app's own "Describe system" feature targets
internally (`src/llm/promptTemplate.ts` — currently Template A only, see the
note at the bottom). This doc exists for anyone who'd rather use their own
chat interface, doesn't have an Anthropic key handy, or wants to review/edit
the prompt before running it.

---

## Template A: single system

```
Convert my system description below into a YAML document matching this exact schema:

schemaVersion: 1
system:
  name: string                # required
  subtitle: string             # optional, one line
root:
  label: string                 # required — the central system/service
  description: string           # optional, one line
components:                     # 1 to 7 entries
  - id: string                   # required, unique, lowercase, hyphens only, e.g. "postgres"
    name: string                  # required, e.g. "PostgreSQL"
    shortLabel: string             # optional, short label under the node box, e.g. "Primary DB"
    direction: outbound | inbound | bidirectional   # required — see below
    colorFamily: blue | teal | green | amber | coral | purple   # optional, omit to auto-cycle
    bullets:                        # 1 to 4 short entries, one sentence each
      - string

Rules:
- components must have between 1 and 7 entries. If my description implies more than 7 integrations, group related ones into a single component instead of exceeding 7 (tell me which ones you grouped).
- direction describes data flow relative to the root: "outbound" if the root calls the component, "inbound" if the component calls the root, "bidirectional" if both happen.
- Don't invent components or integrations I didn't mention or clearly imply.
- If something is ambiguous (e.g. direction unclear), infer the most sensible default rather than asking me a follow-up — just make a call and move on.
- Respond with ONLY the YAML document. No prose before or after it, no markdown code fence.

My system:
[Describe it in a couple of paragraphs — what it does, who uses it, and what
it talks to. Plain language is fine, e.g. "the app calls Stripe to charge a
card when an invoice is created" — no need to pre-structure it yourself.]
```

### Notes on Template A

- **Component count**: if you know upfront you have more than 7
  integrations, say so in your description and ask the model to group
  related ones (e.g. "group all the notification channels into one
  component").
- **Ambiguous direction**: if you're not sure whether something is
  `outbound`, `inbound`, or `bidirectional`, describe the interaction in
  plain language anyway (e.g. "the database is both read and written on
  every request") — the model will pick the right one.
- See `examples/example-spec-uber.yaml` for a worked example generated from
  this exact template.

---

## Template B: system design (graph)

```
Convert my system description below into a YAML document matching this exact schema:

schemaVersion: 1
system:
  name: string                # required
  subtitle: string             # optional, one line
nodes:                          # 2 to 16 entries
  - id: string                   # required, unique, lowercase, hyphens only, e.g. "driver-assignment-queue"
    name: string                  # required, e.g. "Driver Assignment Queue"
    shortLabel: string             # optional, short label under the node name
    kind: client | gateway | service | queue | cache | database | external   # optional — sets a default color; omit for a plain client-style box
    colorFamily: blue | teal | green | amber | coral | purple                 # optional, overrides the kind-based color
edges:                          # 1 to 40 entries
  - from: string                  # required, must match a node id above
    to: string                     # required, must match a node id above
    kind: sync | async | bidirectional   # required — see below
    label: string                   # optional, short label shown on the edge (recommended for async edges)

Rules:
- nodes must have between 2 and 16 entries. Group closely related sub-components if my description implies more (tell me which ones you grouped).
- Every edge's "from" and "to" must reference a real id from the nodes list.
- Edge kind:
  - "sync" — a request/response call where the caller waits (solid line, single arrowhead). Use for direct API/service calls.
  - "async" — a fire-and-forget event, queue message, or webhook (animated dashed line). Add a label with the event/topic name where possible.
  - "bidirectional" — something read AND written by the same caller, like a cache or shared datastore (solid line, arrowheads both ends).
- Fan-out (one producer, several independent consumers — e.g. a queue or topic feeding multiple services) is just multiple edges from that node to each consumer. Don't try to represent "many recipients" with a single edge.
- Don't invent components or connections I didn't mention or clearly imply.
- If something is ambiguous (e.g. sync vs async unclear), infer the most sensible default rather than asking me a follow-up — just make a call and move on.
- Respond with ONLY the YAML document. No prose before or after it, no markdown code fence.

My system:
[Walk through it the way you'd narrate it out loud: what triggers the flow,
what calls what, and whether the caller waits for a response or just fires
off an event and moves on. Plain language is fine — e.g. "when a ride is
requested, the ride service publishes an event to Kafka, which the
notification service consumes to alert the driver." No need to pre-structure
it yourself.]
```

### Notes on Template B

- **Sync vs. async**: the distinguishing question is whether the caller
  waits for a response before doing anything else (sync) or just sends a
  message and moves on (async). Describe the interaction that way if you're
  not sure which label applies.
- **Fan-out**: if a queue or topic feeds several consumers, just list one
  edge per consumer (`kafka -> notification-service`, `kafka -> analytics`,
  etc.) rather than trying to describe "broadcasts to everyone" in one edge.
- **Cycles are fine**: a service that both reads and writes a cache, or two
  services that call each other, is normal — use `bidirectional`, or two
  separate `sync`/`async` edges if the two directions carry different kinds
  of data. The layout algorithm handles cycles automatically.
- **Node count**: if you're modeling a large system, mention that upfront
  and ask the model to fold minor internal details into the relevant
  service's `shortLabel` rather than giving every internal component its
  own node — the schema caps out at 16 nodes for legibility.
- See `examples/example-system-design-uber.yaml` for a complete worked
  example — the driver-assignment flow from a ride-hailing system, generated
  from this exact template.

---

## What "Describe system" (in-app) currently supports

The app's built-in "Describe system" feature (Anthropic only, BYO key) only
targets **Template A** right now — `src/llm/promptTemplate.ts` hasn't been
extended to also generate graph specs. Until that lands, Template B above is
the way to get a system-design spec from natural language: paste it into
Claude (or any chat), then paste the result into Diagramate's "Write spec"
tab.
