# Explore a design decision

Use when the user requests alternatives, a prototype, or agrees that an unresolved
direction needs an experiment. This combines Emil's working-variant workflow with
pstack's decision-first prototype method. It is one branch with two artifact purposes.

## 1. Name the decision and artifact purpose

State what comparison will settle: layout, density, interaction, visual personality,
motion, or a behavioral hypothesis. Bound the surface to a coherent decision. For
a broad request, choose the highest-leverage part and make that scope explicit.

Choose the purpose from the request; ask if it materially changes the work:

- **Decision experiment:** disposable evidence. Use the lightest permitted surface
  that answers the question. Production implementation follows separately.
- **Integration candidate:** project-native variants that can become production
  code after selection, review, and normal project checks.

**Done:** the decision, scope, artifact purpose, and selection criteria are explicit.
If the direction is already settled, report that exploration is unnecessary. Use
[implementation](implement.md) only when the request authorizes implementation.

## 2. Map the ground

Read the framework, styling/motion conventions, tokens, surrounding UI, supported
sizes, content ranges, and product personality. Read
[visual design](../references/visual-design.md) for visual direction and
[content and states](../references/content-and-states.md) for product behavior.
For variants with feedback, transitions, gestures, or temporal states, read
[component behavior](../references/motion/components.md),
[motion standards](../references/motion/standards.md), and the applicable
[component recipes](../references/motion/recipes.md). This applies even when the
user names a component rather than asks for animation.
Use references or prior art when they help an open direction; preserve their provenance.

**Done:** variants have realistic content and context, and respect relevant project
constraints. A standalone idea can choose its own deliberate visual direction;
project-native candidates must fit the product.

## 3. Choose materially different directions

Default to 2–3 alternatives. Use up to 5 only when requested or the decision clearly
needs them. Name each direction and its axis: Quiet, Editorial, Dense, or another
meaningful label. Three accent colors on the same layout are not three directions.
For a behavioral hypothesis, vary the factor being tested so the observation is useful.

Each integration candidate must be defensible on its own, not a deliberately weak
foil. A cheap experiment may have limited fidelity, but the interaction under
comparison must work. Use realistic copy rather than placeholder text.

**Done:** each variant tests a distinct answer and the fidelity is sufficient to
judge the decision. Remove converged alternatives rather than pad the count.

## 4. Build an isolated comparison

Use a standalone page or an explicitly development-only route. Keep prototype
files separate from production imports. Verify deployment exclusion rather than
assume the route name provides it. Mock mutations and use safe fixture data.

Read [picker](../references/picker.md). Render one full-size variant at a time in
realistic surrounding context. A toast needs its page; a button needs its form.
Use local controls for a parameter experiment if that is the decision. Such controls
change the prototype only, not production source or agent instructions.

**Done:** every variant is reachable, its relevant interactions work, and the
comparison has no live mutation or browser-to-agent channel.

## 5. Observe and present

Follow [verification](../references/verification.md). Flip through every variant,
exercise the compared interactions, and capture evidence appropriate to the question.
For timing, observe temporal behavior rather than rely on screenshots alone.

Present variant, axis, where it works, cost, and observations. A recommendation must
follow the decision criteria, not declare a winner by taste alone. Give the page or
file location and the selection controls. State whether the artifact is disposable.

**Done:** every alternative has evidence and an honest tradeoff. Stop for the user's
choice. Choice changes the preferred direction; it is not an automatic source-write event.

## 6. Integrate only within authorization

For a selected integration candidate, follow the project's implementation workflow
when the user authorizes integration. For a decision experiment, implement the
chosen behavior separately; do not promote disposable shortcuts as production code.
If another round is requested, diverge around the selected direction rather than
rebuild unrelated alternatives.

Remove this task's prototype when integration is accepted unless the user wants it
retained. Preserve unrelated files. A retained prototype must stay development-only.

**Done:** the selected result passes project and actual-page checks, and prototype
retention or cleanup is explicit. Selection without integration permission ends at step 5.
