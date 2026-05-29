# Final Pass

Use this before handoff, commit, or PR. The goal is to remove avoidable
AI-shaped residue without reopening scope.

## Checklist

- Behavior still matches the user request.
- The diff is the smallest clear diff that solves the problem.
- New abstractions hide real knowledge and pass the deletion test.
- No duplicate source-of-truth types, schemas, constants, or parsing rules.
- Validation happens at untrusted boundaries, not repeatedly downstream.
- Names match repo vocabulary and ownership.
- No debug logs, placeholder copy, dead branches, or unused helpers remain.
- Tests, type checks, lint, or targeted smoke checks still pass.
- Comments explain non-obvious intent, invariants, or tradeoffs, not line-by-line
  mechanics.

## Review Vectors

### Repo Fit

- Did the change follow local file placement and naming conventions?
- Did it use existing helpers before adding new ones?
- Did it cross ownership boundaries without a strong reason?

### Type And Contract Fit

- Did the change preserve canonical types and schemas?
- Are casts, `any`, nullable fallbacks, or broad unions hiding uncertainty?
- Are error modes explicit at the interface?

### Simplicity

- Are helpers, factories, adapters, or wrappers earning their keep?
- Could a caller use the new interface without reading the implementation?
- Did the change add configuration that callers should not decide?

## What To Fix Automatically

Fix issues that are local, clearly correct, and behavior-preserving:

- dead code and debug residue;
- unnecessary wrappers or pass-through helpers;
- widened or duplicated types;
- obvious naming/placement drift;
- defensive checks that duplicate trusted typed boundaries.

Leave speculative cleanup for a follow-up.
