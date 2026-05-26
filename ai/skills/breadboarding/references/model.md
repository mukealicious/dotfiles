# Breadboarding Model

## Places

A Place is a bounded context of interaction. While in a Place, the operator has a specific set of affordances and must take an action to leave.

Use the blocking test:

| Question | Meaning |
|----------|---------|
| Can the operator interact with what is behind? Yes | Same Place with local state |
| Can the operator interact with what is behind? No | Different Place |

Examples:

| UI element | Place? | Reason |
|------------|--------|--------|
| Route/page | Yes | Full context |
| Modal | Yes | Blocks interaction behind it |
| Whole-screen edit mode | Yes | Available affordances change |
| Dropdown | Usually no | Can click away |
| Tooltip | No | Informational only |
| Checkbox-revealed fields | No | Local state change |

Label places with IDs:

| # | Place | Description |
|---|-------|-------------|
| P1 | Search Page | Main search interface |
| P2 | Detail Page | Individual result view |

When a workflow crosses systems, make system boundaries explicit: `P3 Backend API`, `P4 Billing Worker`, `P5 External Provider`.

## Affordances

Affordances are things the operator, code, or another system can act upon.

| Type | ID | Examples |
|------|----|----------|
| UI affordance | U | Button, input, rendered list, email, notification |
| Code affordance | N | Handler, query, service method, subscription, job, API endpoint |
| Data store | S | Database table, local state, URL, queue, cache, config read by behavior |

Avoid fake affordances:

- Layout wrappers that nobody acts on.
- Generic infrastructure labels like `DATABASE`.
- Internal transforms that are just implementation details of the caller.
- Navigation mechanisms when the destination Place is what matters.

## Tables

Places:

| # | Place | Description |
|---|-------|-------------|
| P1 | ... | ... |

UI Affordances:

| # | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|-------|-----------|------------|---------|-----------|------------|
| U1 | P1 | ... | ... | click | -> N1 | - |

Code Affordances:

| # | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|-------|-----------|------------|---------|-----------|------------|
| N1 | P1 | ... | `handleSubmit()` | call | -> N2, -> S1 | -> U2 |

Data Stores:

| # | Place | Store | Description | Wires Out | Returns To |
|---|-------|-------|-------------|-----------|------------|
| S1 | P1 | `results` | Search results | - | -> U3 |

## Wiring

Use `Wires Out` for control flow:

- User action triggers handler.
- Handler calls service.
- Service writes store.
- Handler navigates to Place.

Use `Returns To` for data flow:

- Function returns result to caller.
- Store feeds UI.
- Query result feeds display.
- External state is read on initialization.

Navigation should wire to a Place:

```text
U1 Save button -> N1 saveForm()
N1 saveForm() -> P2 Detail Page
```

Do not wire navigation to an affordance inside the destination Place.

## Verification

Check every table before trusting the breadboard:

- Every displayed UI affordance has a data source or a reason it does not need one.
- Every code affordance has `Wires Out`, `Returns To`, or both.
- Every store is read by something.
- Every `Wires Out` and `Returns To` target exists.
- Every diagram node exists in a table.
- Solid diagram lines represent `Wires Out`; dashed lines represent `Returns To`.
