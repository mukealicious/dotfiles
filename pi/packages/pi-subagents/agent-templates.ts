import type { AgentConfig } from "./agents.ts";

export interface AgentTemplate {
	name: string;
	config: Partial<AgentConfig>;
}

const ORDINARY_LEAF_TOOLS = ["read", "grep", "find", "ls"];

export type TemplateItem =
	| { type: "agent"; name: string; config: Partial<AgentConfig> }
	| { type: "chain"; name: string; description: string }
	| { type: "separator"; label: string };

export const TEMPLATE_ITEMS: TemplateItem[] = [
	{ type: "separator", label: "Agents" },
	{
		type: "agent",
		name: "Blank",
		config: {
			description: "Describe this agent",
			systemPrompt: "",
			tools: [...ORDINARY_LEAF_TOOLS],
			maxSubagentDepth: 0,
		},
	},
	{
		type: "agent",
		name: "Scout",
		config: {
			description: "Analyzes codebases and reports findings",
			systemPrompt: "You are a code analysis agent. Given a codebase and a question, thoroughly investigate the relevant files and report your findings. Focus on accuracy — read the actual code rather than guessing.",
			tools: [...ORDINARY_LEAF_TOOLS],
			maxSubagentDepth: 0,
		},
	},
	{ type: "separator", label: "Chains" },
	{ type: "chain", name: "Blank Chain", description: "Empty chain to configure" },
];
