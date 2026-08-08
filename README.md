# Diagramate

Turn a plain-language description of your software system into an
interactive, animated architecture diagram — in your browser, no account
required.

> Status: early scaffold. See [VISION.md](./VISION.md) for positioning and
> scope, [docs/architecture.md](./docs/architecture.md) for the technical
> plan, and [docs/spec-schema.md](./docs/spec-schema.md) for the diagram spec
> format.

## Why

Existing tools make you choose: diagram-as-code that's git-friendly but
static (Mermaid, Structurizr), or a polished visual editor that's closed
and hosted (IcePanel), or free-form sketching with no structure (Excalidraw).
Diagramate is a versionable spec + natural-language authoring + a
presentation-grade animated renderer, exportable to HTML, SVG, PNG.

## Quick start (once v1 lands)

```bash
git clone https://github.com/<your-username>/diagramate.git
cd diagramate
npm install
npm run dev
```

Open the app, either:
- paste a description of your system into the "Describe your system" box
  (bring your own Anthropic or OpenAI API key), or
- write/paste a spec directly (see `docs/spec-schema.md`).

Export the result as a self-contained animated HTML file, SVG, or PNG — or
embed it live on any page with the `<diagramate-diagram>` web component:

```html
<script src="dist-webcomponent/diagramate.js"></script>
<diagramate-diagram spec='{"schemaVersion":1, ...}'></diagramate-diagram>
```

Build it locally with `npm run build:webcomponent`; see
`examples/embed.html` for a full working page.

## Project layout

```
diagramate/
├── VISION.md              # positioning, competitive analysis, v1 scope
├── docs/
│   ├── architecture.md    # technical architecture of the web app
│   └── spec-schema.md     # the diagram spec format (nodes, connections, types)
├── examples/
│   └── example-spec.json  # a worked example spec
├── src/                    # app source (added as implementation proceeds)
└── CONTRIBUTING.md
```

## Roadmap

v1: spec schema, manual editor, NL-to-spec via BYO LLM key, animated HTML/SVG/PNG export, embeddable web component, static hosting on GitHub Pages.

v2+: Mermaid/C4 DSL export, multi-diagram "systems" (overview + per-flow), CLI for CI pipelines, more LLM providers.

Full detail in [VISION.md](./VISION.md).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Issues labeled `good first issue`
are a good place to start once the v1 renderer lands.

## License

MIT — see [LICENSE](./LICENSE).
