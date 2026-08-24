import type { AgentConfig } from "./agents.ts";

export const CANONICAL_READ_ONLY_ROLE_TOOLS: Record<string, string[]> = {
	scout: ["read", "grep", "find", "ls"],
	researcher: ["read", "web_search", "web_fetch", "deep_research", "batch_enrich", "exa_search"],
	review: ["read", "grep", "find", "ls"],
};

const READ_ONLY_TOOLS = new Set(Object.values(CANONICAL_READ_ONLY_ROLE_TOOLS).flat());

export function isMechanicallyReadOnly(agent: AgentConfig | undefined): boolean {
	if (!agent || agent.tools === undefined || agent.mcpDirectTools?.length) return false;
	return agent.tools.every((tool) => READ_ONLY_TOOLS.has(tool));
}

export function readOnlyOverrideError(
	agent: AgentConfig | undefined,
	value: object,
	label: string,
): string | undefined {
	if (!isMechanicallyReadOnly(agent)) return undefined;
	const request = value as Record<string, unknown>;
	const overrides = ["output", "progress"]
		.filter((field) => Object.hasOwn(request, field));
	return overrides.length > 0
		? `Read-only agent '${agent.name}' does not allow explicit ${overrides.join(" or ")} overrides (${label}).`
		: undefined;
}
