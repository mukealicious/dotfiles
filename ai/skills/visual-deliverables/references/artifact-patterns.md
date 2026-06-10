# Artifact Patterns

Choose the artifact by the reader's task, not by the topic category.

## Pattern Map

| Reader task | Surface | Visual core | Useful interaction | Durable export |
|---|---|---|---|---|
| Understand a stack | Architecture map | Zones, ownership boxes, external systems, data stores, trust boundaries | Sequence toggles, click-to-focus, layer filters | Architecture notes or risk list |
| Trace a request | Flow walkthrough | Left-to-right path or swimlanes with numbered handoffs | Stepper, animated path, side panel details | Trace summary, call chain, open questions |
| Review a PR | Review surface | File map, hot path, risk heatmap, annotated diff slices | Severity filters, expand snippets, jump links | Review comments, checklist |
| Plan a migration | Migration board | Dependency graph, phases, cutover timeline, rollback branch | Toggle current/future state, highlight blockers | Implementation slices, decision log |
| Explain a concept | Interactive explainer | Model diagram plus a tiny simulator | Sliders, toggles, hover glossary, reset | Teaching notes, caveats |
| Compare options | Decision matrix | Side-by-side variants, tradeoff axes, confidence markers | Filter by constraint, select winner, export rationale | Recommendation memo |
| Report status | Status room | Timeline, traffic lights, scope map, trend sparklines | Filter team/service, reveal evidence | Status update, risks, asks |
| Analyze incident | Incident map | Timeline plus blast radius and causal chain | Replay event sequence, expand evidence | Postmortem outline |
| Shape a feature | Product sketch board | User journey, screens, affordances, data flow | Toggle slices, show dependencies | Spec, breadboard, slice list |
| Tune config or prompt | Workbench/editor | Inputs, controls, preview, validation readout | Edit, compare, reset, export | JSON, prompt, patch, checklist |
| Show design system | Contact sheet | Tokens, components, variants, states | Theme/state toggles, copy token | Design notes, token changes |
| Explain agent work | Agent workflow map | Context lanes, tool calls, artifacts, handoffs | Replay steps, inspect artifacts, show budget | Handoff or retrospective |

## Shape Heuristics

### Architecture Map

Use when the question is "what exists and how does it relate?"

- Group by runtime boundary, ownership, trust boundary, or data authority.
- Use fewer large regions before many small boxes.
- Label arrows with verbs: reads, writes, publishes, authenticates, hydrates, retries.
- Add a sequence mode when static arrows become spaghetti.

### Flow Walkthrough

Use when the question is "what happens next?"

- Prefer numbered steps and one highlighted current step.
- Keep the happy path central and failure paths visibly branched.
- Side panel detail should answer: where, what runs, what changes, what can fail.

### Review Surface

Use when the question is "where is the risk?"

- Start with a map of affected areas, not a prose summary.
- Show severity, confidence, and source file together.
- Preserve links or line references where possible.
- Export final comments so the HTML does not trap the review.

### Workbench or Editor

Use when the question is "what should we choose or change?"

- Include initial data and a reset button.
- Show validation inline, not in an alert.
- Include an export button for the final machine-readable or Markdown result.
- Avoid saving to localStorage unless the user asks.

## Anti-Patterns

- A wall of prose with a decorative SVG at the top.
- Generic cards for everything when the real structure is a graph, sequence, table, or map.
- Motion that does not reveal causality.
- Interactions with no quiet default state.
- Diagrams whose arrows are unlabeled or all mean different things.
- Polished visuals based on guessed architecture.
