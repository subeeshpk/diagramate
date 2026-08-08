# Diagramate — Vision & Positioning

## What it is

Diagramate is an open source web app that turns a description of a software
system — typed in plain language or structured as a spec file — into an
interactive, animated architecture diagram. It renders in-browser, exports as
a self-contained HTML file, static SVG/PNG, Mermaid/C4 markup, or an
embeddable web component.

It formalizes the workflow already proven in the `architecture_diagram_prompt_template.md`
approach: describe your system → get a navy-root, color-coded, animated
flowing-connector diagram — but moves it from "paste a prompt into an LLM
chat and hope" into a real, versioned, repeatable tool.

## Why this, when Mermaid/Structurizr/IcePanel/Excalidraw already exist

| Tool | Strength | Gap Diagramate fills |
|---|---|---|
| Mermaid | Native GitHub rendering, huge adoption | Static, no animation, limited visual polish, no NL input |
| Structurizr | True diagrams-as-code, C4-native | DSL has a learning curve; no animated/presentation-grade output |
| IcePanel | Polished collaborative editor | Closed-source core, hosted SaaS, not git-native |
| Excalidraw | Free-form, git-friendly JSON | Manual drawing only — no structured spec, no auto-layout for flows |
| draw.io | Ubiquitous, free | No diagram-as-code, no animation, manual layout |

None combine: (a) a stable, versionable spec format, (b) natural-language
authoring via an LLM, (c) a distinctive animated visual language suited to
demos/recordings, and (d) multiple export targets including a format that
renders natively on GitHub (Mermaid/C4 output).

That combination is the whole bet. If any one of those four is dropped, an
existing tool already covers it better.

## Non-goals (to keep this honest)

- Not trying to replace Structurizr for teams that already have C4 DSL
  pipelines in CI.
- Not trying to be a general-purpose diagramming tool (flowcharts, UML class
  diagrams, ER diagrams are out of scope for v1).
- Not a real-time multiplayer collaboration tool (that's IcePanel's turf and
  is a large engineering lift).

## Target user

Software architects and senior engineers who need to produce a system design
diagram for a doc, an interview, an ADR, or a demo recording — and want it to
look presentation-grade without hand-placing boxes in draw.io.

## v1 scope (what actually ships first)

1. A stable JSON/YAML **spec schema** (see `docs/spec-schema.md`) for nodes,
   connections, and connection types (sync / async / bidirectional / fan-out).
2. A **web app** (React + TypeScript + Vite, static-hostable) with two entry
   points into that spec:
   - Manual form/JSON editor (always works, no dependencies).
   - "Describe your system" natural-language box that calls an LLM
     (user-supplied API key; Anthropic and OpenAI supported at launch) to
     produce the spec.
3. A **renderer** that takes the spec and produces the animated diagram
   in-browser, matching the existing visual language (navy root, warm
   off-white background, color-cycling callout cards, flowing-dash
   connectors).
4. **Exports**: self-contained animated HTML, static SVG, static PNG, and an
   embeddable `<diagramate-diagram>` web component (own bundle, ships React
   inlined so any page can drop it in with one `<script>` tag).
5. Deployed as a static site (GitHub Pages) so anyone can use it with zero
   backend cost to the maintainer.

## Deferred to v2+ (don't build yet)

- Mermaid/C4 DSL export (real value, but a second renderer — do after v1
  renderer is proven).
- Multi-diagram "systems" (overview + per-flow diagrams from one spec, per
  Template B in the original prompt file).
- Additional LLM providers / local model support.
- A CLI (`npx diagramate render spec.yaml`) for CI/doc-pipeline use.

## Maintenance model

Realistic solo-maintainer plan: ship a narrow, working v1 alone, write a
CONTRIBUTING.md and a couple of "good first issue" labeled gaps (SVG export
polish, a second color theme, spec schema validation errors) from day one, so
the project is contribution-ready even before it has contributors. Grow the
roadmap based on actual issues/PRs rather than pre-building everything above.

## Success signal for "is this idea solid"

Not stars. The real test: can someone with zero context clone the repo, run
`npm install && npm run dev`, paste a two-paragraph description of their
system, and get a diagram they'd actually put in a doc — within 5 minutes.
If that loop doesn't work, nothing else about the project matters yet.
