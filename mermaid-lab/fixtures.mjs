/** Public synthetic Mermaid fixtures. Never copy private vault labels here. */
export const rendererFixtures = [
  { id: 'flowchart', source: 'flowchart LR\n A[Capture] --> B{Review}\n B -->|keep| C[Connect]\n B -->|skip| D[Archive]' },
  { id: 'subgraph', source: 'flowchart LR\n subgraph Local\n direction TB\n A[Input] --> B[Output]\n end\n B --> C[Next]\n classDef hot fill:#fdd,stroke:#900\n class A hot' },
  { id: 'sequence', source: 'sequenceDiagram\n participant A as Client\n participant B as Worker\n A->>B: Request\n alt Success\n B-->>A: Result\n else Failure\n B-->>A: Error\n end' },
  { id: 'state', source: 'stateDiagram-v2\n [*] --> Draft\n Draft --> Reviewed\n Reviewed --> [*]' },
  { id: 'class', source: 'classDiagram\n class Note {\n +String title\n +save() void\n }\n Note --> Folder' },
  { id: 'er', source: 'erDiagram\n FOLDER ||--o{ NOTE : contains\n NOTE {\n string title\n }' },
  { id: 'gantt', source: 'gantt\n title Plan\n dateFormat YYYY-MM-DD\n section Build\n Prototype :a, 2026-10-01, 3d\n Review :after a, 2d' },
  { id: 'pie', source: 'pie title Notes\n "Projects" : 3\n "Resources" : 7' },
  { id: 'mindmap', source: 'mindmap\n root((Notes))\n  Projects\n  Resources' },
  { id: 'timeline', source: 'timeline\n title Releases\n October : Prototype\n November : Review' },
  { id: 'frontmatter-accessibility', source: '---\ntitle: Preview\nconfig:\n  theme: dark\n---\nflowchart LR\n accTitle: Local preview\n accDescr: A local input becomes an output\n A[Input] --> B[Output]' },
  { id: 'unicode-html', source: 'flowchart LR\n A["Živjo 🌋<br/>Line two"] --> B["**Bold** and _italic_"]' },
  { id: 'math', source: 'flowchart LR\n A["$$x^2$$"] --> B[Plain]' },
  { id: 'tree-50', source: 'flowchart TD\n' + Array.from({ length: 49 }, (_, i) => ` n${Math.floor(i / 3)}[Node ${Math.floor(i / 3)}] --> n${i + 1}[Node ${i + 1}]`).join('\n') },
];
