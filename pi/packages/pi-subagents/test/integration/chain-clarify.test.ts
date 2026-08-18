import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { describe, it } from "node:test";
import { tryImport } from "../support/helpers.ts";

interface ClarifyTestModel {
	fullId: string;
}

interface ClarifyTestComponent {
	editingStep: number | null;
	selectedStep: number;
	modelSelectedIndex: number;
	filteredModels: ClarifyTestModel[];
	getEffectiveModel(stepIndex: number): string;
	applyThinkingLevel(level: "high" | "max"): void;
	enterModelSelector(): void;
	handleModelSelectorInput(data: string): void;
}

interface ClarifyTestModule {
	ChainClarifyComponent: new (...args: unknown[]) => ClarifyTestComponent;
	saveChain: (config: {
		name: string;
		description: string;
		source: "user";
		filePath: string;
		steps: Array<{ agent: string; task: string }>;
	}) => string;
}

const clarifyMod = await tryImport<ClarifyTestModule>("./chain-clarify.ts");
const available = !!clarifyMod;
const ChainClarifyComponent = clarifyMod?.ChainClarifyComponent;

describe("chain clarify model display", { skip: !available ? "pi packages not available" : undefined }, () => {
	it("saves chains in the active profile and retains the no-environment fallback", () => {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), "pi-chain-save-profile-"));
		const previousHome = process.env.HOME;
		const previousProfile = process.env.PI_CODING_AGENT_DIR;
		try {
			const work = path.join(root, "work");
			const personal = path.join(root, "personal");
			for (const profile of [work, personal]) {
				process.env.PI_CODING_AGENT_DIR = profile;
				const saved = clarifyMod!.saveChain({ name: path.basename(profile), description: "Saved chain", source: "user", filePath: "", steps: [{ agent: "worker", task: "Do work" }] });
				assert.equal(saved, path.join(profile, "agents", `${path.basename(profile)}.chain.md`));
				assert.equal(fs.existsSync(saved), true);
			}

			process.env.HOME = root;
			delete process.env.PI_CODING_AGENT_DIR;
			const saved = clarifyMod!.saveChain({ name: "fallback", description: "Saved chain", source: "user", filePath: "", steps: [{ agent: "worker", task: "Do work" }] });
			assert.equal(saved, path.join(root, ".pi", "agent", "agents", "fallback.chain.md"));
			assert.equal(fs.existsSync(saved), true);
		} finally {
			if (previousHome === undefined) delete process.env.HOME;
			else process.env.HOME = previousHome;
			if (previousProfile === undefined) delete process.env.PI_CODING_AGENT_DIR;
			else process.env.PI_CODING_AGENT_DIR = previousProfile;
			fs.rmSync(root, { recursive: true, force: true });
		}
	});

	it("keeps the preferred provider visible after applying thinking to a bare model", () => {
		const component = new ChainClarifyComponent(
			{ requestRender() {} },
			{ fg(_key: string, text: string) { return text; } },
			[{
				name: "worker",
				description: "",
				systemPrompt: "",
				systemPromptMode: "replace",
				inheritProjectContext: false,
				inheritSkills: false,
				source: "user",
				filePath: "worker.md",
				model: "gpt-5-mini",
			}],
			["Task"],
			"Task",
			undefined,
			[{ output: false, reads: false, progress: false, skills: [], model: "gpt-5-mini" }],
			[
				{ provider: "openai", id: "gpt-5-mini", fullId: "openai/gpt-5-mini" },
				{ provider: "github-copilot", id: "gpt-5-mini", fullId: "github-copilot/gpt-5-mini" },
			],
			"github-copilot",
			[],
			() => {},
			"single",
		);

		assert.equal(component.getEffectiveModel(0), "github-copilot/gpt-5-mini");
		component.editingStep = 0;
		component.applyThinkingLevel("high");
		assert.equal(component.getEffectiveModel(0), "github-copilot/gpt-5-mini:high");
		component.applyThinkingLevel("max");
		assert.equal(component.getEffectiveModel(0), "github-copilot/gpt-5-mini:max");
	});

	it("keeps the current model selected and preserves thinking when switching models", () => {
		const component = new ChainClarifyComponent(
			{ requestRender() {} },
			{ fg(_key: string, text: string) { return text; } },
			[{
				name: "worker",
				description: "",
				systemPrompt: "",
				systemPromptMode: "replace",
				inheritProjectContext: false,
				inheritSkills: false,
				source: "user",
				filePath: "worker.md",
				model: "gpt-5-mini",
			}],
			["Task"],
			"Task",
			undefined,
			[{ output: false, reads: false, progress: false, skills: [], model: "gpt-5-mini" }],
			[
				{ provider: "openai", id: "gpt-5-mini", fullId: "openai/gpt-5-mini" },
				{ provider: "openai", id: "gpt-5", fullId: "openai/gpt-5" },
				{ provider: "github-copilot", id: "gpt-5-mini", fullId: "github-copilot/gpt-5-mini" },
				{ provider: "github-copilot", id: "gpt-5", fullId: "github-copilot/gpt-5" },
			],
			"github-copilot",
			[],
			() => {},
			"single",
		);

		component.editingStep = 0;
		component.applyThinkingLevel("high");
		component.selectedStep = 0;
		component.enterModelSelector();

		assert.equal(component.filteredModels[component.modelSelectedIndex]?.fullId, "github-copilot/gpt-5-mini");

		component.modelSelectedIndex = component.filteredModels.findIndex((model) => model.fullId === "github-copilot/gpt-5");
		component.handleModelSelectorInput("\r");

		assert.equal(component.getEffectiveModel(0), "github-copilot/gpt-5:high");
	});
});
