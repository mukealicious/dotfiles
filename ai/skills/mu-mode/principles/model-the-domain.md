# Model the Domain

Represent the real domain in structures that remove invalid states, duplicated rules, and scattered branching.

Consider:

- a state machine instead of synchronized booleans or phase checks;
- a typed model instead of loose parameters;
- a registry, map, table, or discriminated union instead of branching across files;
- a reducer or command/event model instead of ad hoc mutations;
- a module organized around one body of domain knowledge rather than execution order;
- a queue, cache, index, graph, tree, or normalized collection when access patterns require it.

Start from what the system must never allow, who owns each invariant, and how callers read or change the data. Do not force an abstraction when boring local code is already clear. A useful structure removes branches, duplicated rules, invalid states, or lifecycle risk; it does not merely rename them.
