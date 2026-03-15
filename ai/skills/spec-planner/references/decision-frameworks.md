# Decision Frameworks

Systematic approaches for making decisions during spec planning.

## Reversibility Assessment

| Type | Characteristics | Approach |
|------|----------------|----------|
| **Two-way door** | Easily changeable, low blast radius | Decide fast, iterate |
| **One-way door** | Hard to reverse, high blast radius | Invest analysis, get sign-off |

Most decisions are two-way doors. Don't over-analyze.

## Prioritization Methods

### Cost of Delay

```
Priority = Daily Value / (Delivery Time + Risk Buffer)
```

High daily value + short delivery = do first.

### RICE Scoring

```
Score = (Reach × Impact × Confidence) / Effort
```

| Factor | Scale |
|--------|-------|
| Reach | Users affected per quarter |
| Impact | 0.25 (minimal) → 3 (massive) |
| Confidence | 0.5 (low) → 1.0 (high) |
| Effort | Person-weeks |

## Technical Decision Checklist

- [ ] Consulted someone who's done this before?
- [ ] What's the smallest experiment to validate?
- [ ] What triggers reversal?
- [ ] Who owns maintenance after launch?
- [ ] Rollback plan documented?
- [ ] Learning potential maximized?

## Build vs Buy vs Adopt

| Factor | Build | Buy | Adopt (OSS) |
|--------|-------|-----|-------------|
| Core differentiator? | Yes → Build | No | No |
| Time pressure? | Low | High → Buy | Medium |
| Integration depth? | Deep | Shallow | Varies |
| Team capability? | Strong in domain | Weak → Buy | Can contribute |
| Long-term control? | Full | Vendor lock-in | Fork risk |

**Rule of thumb:** Build core differentiators. Buy commodity. Adopt when community is strong and integration is shallow.

## Decomposition Strategies

### Vertical Slicing

Deliver complete user-facing features rather than technical layers:

```
Bad:  Database layer → API layer → UI layer
Good: User can create → User can edit → User can share
```

Each slice is deployable and testable independently.

### Risk-First Ordering

Address highest-uncertainty assumptions before dependent work:

1. Identify the riskiest assumption
2. Design the smallest experiment to validate/invalidate it
3. If validated, proceed with dependent work
4. If invalidated, pivot before sunk cost accumulates

## Dependency Mapping

When deliverables have dependencies:

1. List all deliverables
2. For each, identify what it blocks and what blocks it
3. Topological sort to find critical path
4. Parallelize independent branches
5. Flag external dependencies (other teams, services, approvals)
