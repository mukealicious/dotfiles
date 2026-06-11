# Thin AI Clients

Use this when designing AI-assisted product flows, agentic workflows, chat
interfaces, local-vs-cloud inference boundaries, or deciding how much UI to
build around a model-backed capability.

## Core Heuristic

> In AI workflows, the client should often capture intent, show progress and
> results, and support correction; a deep AI module should own inference,
> context, tools, permissions, persistence, and failure behavior.

This is not "replace every interface with a prompt." A good UI can encode domain
constraints, safe defaults, valid actions, and business workflow better than an
open-ended text box.

## Seam Contract

For an AI-backed workflow, name the seam explicitly:

```markdown
AI seam: <gateway/orchestrator/tool runner>
User intent: <what the client captures>
Client owns: <progress, review, cancellation, correction, local cache>
AI module owns: <context, inference, tools, permissions, persistence>
Failure behavior: <timeout, retry, partial result, rollback, escalation>
Observability: <trace/session IDs, tool logs, audit events, cost/latency metrics>
```

The client can be visually rich while architecturally thin. "Thin" means it does
not own hard-to-reproduce reasoning, context assembly, or tool protocol.

## When UI Still Beats AI

Keep or build explicit UI when:

- the workflow has a small, known action space where buttons/forms prevent error;
- the action is irreversible, financial, permission-sensitive, or compliance-heavy;
- users need comparison, spatial memory, scanning, or bulk manipulation;
- business rules are embedded in ordering, required fields, or visible state;
- auditability requires deterministic inputs and reviewable decisions.

A prompt is often a poor replacement for a button that both suggests the right
action and constrains the system to do the right thing.

## Local-vs-Cloud Decision

Default to cloud/server inference when quality, context size, tool access,
coordination, or utilization economics dominate.

Prefer local inference/execution when privacy, offline behavior, sub-interaction
latency, device access, or deterministic/pinned behavior is the real constraint.

Hybrid is common: local client for capture/review/cache; server agent for
reasoning and orchestration; local adapter for device-specific work.

## Production Boundary

Cloud AI and agents are production dependencies. Apply
[production-boundaries.md](./production-boundaries.md) to model providers,
context stores, tool runners, generated writes, rate limits, and audit trails.

## Review Questions

1. What is truly UI, and what is agent execution?
2. Is the client duplicating reasoning, context assembly, or tool protocol?
3. Does explicit UI constrain high-risk actions better than natural language?
4. Where can the user inspect progress, cancel, correct, or review results?
5. What happens on timeout, tool failure, duplicate execution, or partial completion?
6. Is local inference chosen for a measured reason or just architectural taste?
