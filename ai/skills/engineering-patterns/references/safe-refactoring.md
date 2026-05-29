# Safe Refactoring

Refactoring changes structure without changing observable behavior. Agents should
prefer small verified moves over broad rewrites.

## Loop

1. Establish the current behavior with tests, a typecheck, a smoke command, or a
   characterization check.
2. Make one structural move.
3. Run the narrowest useful verification again.
4. Continue only while the next move is clearly connected to the task.

If verification fails, inspect the last move first. Do not keep piling changes
onto a broken refactor.

## Common Moves

| Smell | Move |
|---|---|
| Repeated code block | Extract function/module around the shared concept |
| Long method with named phases | Extract methods or deepen the owning module |
| Primitive obsession | Introduce a small domain type or parser at the boundary |
| Repeated conditional by type | Move behavior behind a polymorphic module or strategy |
| Feature envy | Move behavior to the module that owns the data/knowledge |
| Shotgun surgery | Create one module that owns the changing rule |
| Pass-through wrapper | Inline it or deepen it until it hides real knowledge |

## Preparatory Refactoring

Refactor before feature work when it makes the requested change smaller or safer.
Good preparatory refactoring:

- is local to the area you are about to change;
- preserves behavior;
- creates a clearer insertion point;
- can be verified independently;
- does not require finishing a large redesign to deliver the feature.

## Legacy Code

When tests are weak:

- add characterization tests around the current behavior before editing;
- find seams where behavior can be observed without invasive mocks;
- avoid broad rewrites that combine behavior changes with structural changes;
- prefer extraction and adapter seams that let you test new code in isolation.

## Stop Conditions

Stop refactoring when:

- the requested change is now simple enough;
- the next move would touch unrelated ownership areas;
- verification is slow or uncertain and the benefit is mostly aesthetic;
- the code is scheduled for deletion;
- the user asked for a narrow fix and the refactor would expand scope.
