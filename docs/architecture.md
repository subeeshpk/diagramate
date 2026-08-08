# Technical architecture

## Stack

- **React + TypeScript + Vite.** Static output, no server required, cheap
  to host on GitHub Pages, easy for contributors to run locally.
- **Rendering: SVG, not Canvas.** SVG lets the animated `stroke-dashoffset`
  connectors (already proven in the original HTML template) work directly,
  keeps text crisp, and makes exporting to standalone HTML/SVG trivial
  (it's already markup, not pixels).
- **No backend.** LLM calls go directly from the browser to the provider's
  API using the user's own key, stored in memory / `sessionStorage` only —
  never sent to any server Diagramate controls, because there is no such
  server. This is what makes "BYO key, multi-provider" viable without the
  maintainer taking on API cost or key-handling liability.

## Core modules

```
src/
├── spec/           # spec schema types, JSON Schema validation, parse/serialize
├── llm/            # provider adapters (Anthropic, OpenAI) — text-in, spec-out
├── renderer/        # spec -> SVG/DOM, layout engine, animation, theme
├── export/          # renderer output -> standalone HTML / SVG file / PNG (via canvas rasterization)
├── editor/          # UI: NL input box, JSON/YAML spec editor, live preview
├── webcomponent/    # <diagramate-diagram> custom element + registration entry point
├── systemDesign/    # peer-to-peer graph spec: schema, DAG layout, GraphSvg renderer, Mermaid flowchart export
└── app/             # top-level app shell, routing (single page for v1)
```

### `spec/`

Owns the schema (see `spec-schema.md`) and validation. This is the contract
between the LLM adapters, the manual editor, and the renderer — all three
only ever produce or consume a `DiagramSpec` object. Keeping this boundary
strict is what lets NL-input, manual-editing, and future CLI/DSL import all
share one renderer without special-casing.

### `llm/`

One adapter per provider, each implementing:

```ts
interface LLMAdapter {
  id: string;
  name: string;
  supportsBrowserCalls: boolean;
  generateSpec(description: string, apiKey: string): Promise<LLMGenerateResult>;
}
```

**Only Anthropic actually works browser-direct as of this writing.**
Anthropic's API supports CORS via an opt-in
`anthropic-dangerous-direct-browser-access: true` header (added August
2024), which is exactly what the no-backend, BYO-key architecture needs.
OpenAI's API has no CORS support at all — a browser `fetch` to
`api.openai.com` fails before the request reaches OpenAI's servers,
regardless of key validity. Since adding a backend proxy just for OpenAI
would contradict the no-backend design principle above, `openaiAdapter` is
registered (so it shows up in the provider list and the UI can explain why
it's disabled) but its `generateSpec` throws immediately with a message
pointing at Anthropic or the manual editor instead. Re-litigate this if
OpenAI ever adds CORS support, or if a proxy-based path becomes worth the
added complexity.

`buildSystemPrompt()` (`src/llm/promptTemplate.ts`) embeds the schema rules
directly in the prompt and must be kept in sync with `docs/spec-schema.md`
by hand — there's no single source of truth generating both yet (tracked
below).

`parseModelResponse()` strips a markdown code fence if the model added one
despite being told not to, then runs the result through the exact same
`parseSpecText` + `validateSpec` pipeline the manual editor uses — a model
response and a hand-written spec are indistinguishable once they're text.
On failure it throws `SpecGenerationError` carrying both the raw response
and the validation errors, so the UI can show the user what the model said
and let them fix it in the manual editor rather than silently failing or
retrying blindly.

The API key lives only in the `DescribeSystem` component's React state —
never written to `localStorage`/`sessionStorage`, never sent anywhere but
directly to the provider's API. It's gone on reload; there is intentionally
no "remember my key" feature, since persisting a key this component can't
protect isn't a trade worth making for convenience.

### `renderer/`

Pure function-ish: `DiagramSpec -> SVG tree`. Layout for v1 is deliberately
simple — a single root node, one row per top-level component, in spec order
— matching Template A from the original prompt file. Template B's
multi-diagram (overview + per-flow) layout is v2 once the single-diagram
renderer is solid; don't build a generic auto-layout engine for v1, it's a
trap.

### `export/`

- HTML: wrap the rendered SVG + the CSS/animation rules + a tiny bit of JS
  into one file, matching the original template's "single self-contained
  file" requirement.
- SVG: the rendered SVG on its own, animations stripped or kept as SMIL
  depending on target (static docs usually want them stripped).
- PNG: rasterize the SVG via an offscreen canvas.

### `webcomponent/`

`DiagramateElement` is a plain `HTMLElement` subclass (not a React component)
that mounts a React root into a shadow DOM and renders `<DiagramSvg>` inside
it — reusing the exact same renderer as the main app, so the embed and the
in-app preview can never visually drift apart. Shadow DOM keeps the diagram's
`<style>` (the flowing-dash keyframes, fonts) from leaking into or colliding
with the host page's CSS.

It's built as a **separate library bundle** (`vite.webcomponent.config.ts`,
`npm run build:webcomponent`), not part of the main app bundle, because the
two have opposite goals: the app bundle can assume the page is `index.html`
and split code freely; the embed bundle has to be one dependency-free
`<script src>` a random doc site can drop in, so it bundles React and
ReactDOM directly into itself. That trade-off is what makes it ~530KB
(~160KB gzipped) — acceptable for an embedded diagram on a docs page, not
something to import into an app that already ships React (a
React-component-only export, skipping the custom-element wrapper and letting
the host's own React tree render `<DiagramSvg>` directly, is a reasonable
follow-up if that use case comes up).

Spec input is either a `spec="<json>"` attribute (re-parsed on every
attribute change) or a `.spec = {...}` property set from JS — both go through
the same `validateSpec` used everywhere else, and invalid specs render an
inline error panel in the shadow DOM instead of throwing, since a broken
embed shouldn't take down the host page.

### `systemDesign/`

The peer-to-peer counterpart to `spec/` + `renderer/`: `SystemDesignSpec`
({system, nodes, edges}) instead of the hub-and-spoke {root, components}
shape. Exists because the original hub-and-spoke spec can't represent a
queue feeding multiple consumers, a cache both read and written by the same
service, or any system where components talk to each other rather than only
to one center — exactly the gap between the two templates in the original
`architecture_diagram_prompt_template.md` ("Template A: single system" vs
"Template B: complex system design").

`layout.ts` is the one genuinely algorithmic piece in the codebase: longest-
path layering via Kahn's algorithm, with a DFS back-edge pass first so
cycles (routine with `bidirectional` edges) don't make the layering loop
forever. It's deliberately simple — no edge-crossing minimization, nodes
keep their spec-file order within a layer — which is fine for the ~8-16 node
graphs this schema is scoped to; a real crossing-reduction pass (barycenter
or median heuristic) is the natural next step if bigger graphs start looking
tangled. See `layout.test.ts` for the cases this needs to get right: linear
chains, diamonds (longest path wins, not shortest), and cycle termination.

`GraphSvg` reuses the exact palette (`renderer/theme.ts`'s `PALETTE`) so a
graph diagram and a hub-and-spoke diagram from the same session don't look
like two different products; node "kind" (`client`/`gateway`/`service`/
`queue`/`cache`/`database`/`external`) just picks a sensible default color
family, overridable per node.

`App.tsx` auto-detects which spec shape was pasted (checks for a `nodes`
key) rather than making the user pick a mode — one editor, one preview pane,
two possible renderers underneath. The SVG-based exporters
(`export/exportHtml.ts`, `exportSvg.ts`, `exportPng.ts`) were generalized to
accept a minimal structural type (`ExportableSpec = { system: { name } }`)
so they work for either spec without duplicating export code; Mermaid export
did need to fork, since a hub-and-spoke spec maps naturally to Mermaid's C4
diagram type while a graph maps to Mermaid's flowchart type — different
diagram semantics, not just different data shapes.

**Not yet done**: the NL-to-spec LLM adapter (`llm/`) only knows how to
generate hub-and-spoke specs — `buildSystemPrompt()` hasn't been extended to
also target the graph schema. `docs/prompt-template.md` is hub-and-spoke
only for the same reason; a graph-spec prompt template is a natural,
fairly small follow-up (mirror the structure, swap the schema description).

## What v1 explicitly does not need

- No user accounts, no database, no backend server.
- No real-time collaboration (no CRDT, no websockets).
- No generic auto-layout algorithm (force-directed, etc.) — the row-based
  layout from the existing template is intentional and sufficient for v1.

## Open technical questions (track as issues once repo is live)

- Exact PNG rasterization approach for very tall diagrams (many rows) —
  canvas size limits vary by browser.
- Whether to vendor the spec JSON Schema or generate it from TypeScript
  types (zod + zod-to-json-schema is a reasonable default) — would also let
  `buildSystemPrompt()` generate its schema description instead of
  hand-duplicating it.
- Whether OpenAI support is worth a proxy (Cloudflare Worker, Vercel edge
  function, etc.) given it breaks the no-backend guarantee for everyone,
  not just OpenAI users.
