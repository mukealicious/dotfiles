# Slicing Breadboards

Slicing turns a breadboard into vertical implementation increments.

## Rule

Every slice must be demoable. A slice needs an entry point and an observable output.

Good slices cut through UI, logic, and data enough to show a working behavior. Avoid horizontal slices such as "create schema" or "build service layer" unless they are paired with visible behavior in the same slice.

## Procedure

1. Identify the smallest useful demo of the core mechanism.
2. Assign the required affordances to `V1`.
3. Add later slices for additional mechanisms, states, integrations, or edge cases.
4. Assign every affordance to the slice where it first needs to exist.
5. Keep the full breadboard as the complete target system.
6. For each slice, produce a demo statement.

Aim for nine or fewer slices. More than nine usually means the shape is too large or the slices are too granular.

## Slice Summary

```markdown
| # | Slice | Mechanism | Demo |
|---|-------|-----------|------|
| V1 | Core display | U2, U3, N1, N2, S1 | "Page shows real records from the API." |
| V2 | Search | U1, N3, N4 | "Typing filters the list." |
```

## Per-Slice Tables

For implementation planning, extract the affordances added in each slice:

```markdown
## V2: Search

| # | Component | Affordance | Control | Wires Out | Returns To |
|---|-----------|------------|---------|-----------|------------|
| U1 | Search page | search input | type | -> N3 | - |
| N3 | Search page | `activeQuery.next()` | call | -> N4 | - |
| N4 | Search page | `performSearch()` | call | -> S1 | -> U2 |
```

## Future Wires

It is acceptable for a slice to include affordances whose final wires point to future affordances. In the implemented slice, those can be stubs, no-ops, or hidden states until the future slice exists.

Be explicit:

- `Implemented in V2, final target appears in V4.`
- `Stubbed until V3.`
- `Visible but disabled until V5.`

## Demo Statements

Each slice should have a concrete demo:

- "Open the page and see records loaded from production-like data."
- "Type `smith` and see the list filter after debounce."
- "Refresh the browser and the selected filters remain."
- "Trigger the webhook and see the status update in the admin page."

If a slice has no demo, merge it into a slice that does.
