# Contributing to Diagramate

Thanks for considering it. This project is early — the spec schema and
renderer are still settling, so the highest-value contributions right now
are:

1. **Feedback on `docs/spec-schema.md`** — try modeling a real system you
   know with it and open an issue for anything that felt awkward or
   impossible to express.
2. **Renderer edge cases** — once the renderer lands, systems with 7+ nodes,
   long labels, or fan-out connections are the places layout breaks first.
3. **A second color theme** — the current palette (blue/teal/green/amber/
   coral/purple) is one option; a colorblind-safe theme is a known gap.

## Workflow

1. Fork, branch off `main`.
2. `npm install && npm run dev` to run locally.
3. `npm run lint && npm run test` before opening a PR.
4. Keep PRs scoped to one change — spec schema changes and renderer changes
   should usually be separate PRs so they're reviewable independently.

## Ground rules

- No breaking changes to the spec schema without a version bump and a
  migration note in `docs/spec-schema.md`.
- New export formats belong behind a clearly separate module — don't
  entangle them with the core renderer.
- Be kind in review. This is a side project, not anyone's job.

## Reporting bugs / proposing features

Open a GitHub issue. For features, a short "what problem does this solve"
paragraph is more useful than a fully-specified design — we'll shape it
together in the issue thread.
