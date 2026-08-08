# Reusable prompt: generate a Diagramate spec

Copy everything in the box below, fill in your system description at the
bottom, and paste it into any LLM chat (Claude, ChatGPT, etc.). It'll
produce a YAML spec you can paste straight into the Diagramate editor's
"Write spec" tab.

This is the same schema the app's own "Describe system" feature uses
internally (`src/llm/promptTemplate.ts`) — this template exists for anyone
who'd rather use their own chat interface, doesn't have an Anthropic key
handy, or wants to review/edit the prompt before running it.

---

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

---

## Notes

- **Component count**: if you know upfront you have more than 7
  integrations, say so in your description and ask the model to group
  related ones (e.g. "group all the notification channels into one
  component").
- **Ambiguous direction**: if you're not sure whether something is
  `outbound`, `inbound`, or `bidirectional`, describe the interaction in
  plain language anyway (e.g. "the database is both read and written on
  every request") — the model will pick the right one.
- **Validating the output**: paste whatever comes back into the Diagramate
  editor. If it's invalid, the editor shows exactly which field is wrong
  rather than failing silently — fix it by hand or re-prompt with the error
  message included.
- See `docs/spec-schema.md` for the full schema reference, and
  `examples/example-spec-uber.yaml` for a complete worked example generated
  from this exact template.
