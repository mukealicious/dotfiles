#!/usr/bin/env node
/**
 * Read-only D10 evidence for the supported Pi profile boundary.
 *
 * This command deliberately has no cleanup or migration mode. It only reads
 * profile/resource metadata and runs `pi auth check --no-refresh`; no model
 * request is made and no fallback state is touched.
 */
import * as fs from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as os from "node:os";
import * as path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROFILES = [
	{ name: "work", provider: "openai" },
	{ name: "personal", provider: "openai-codex" },
];
const MITSUPI_EXTENSIONS = [
	"extensions/answer.ts",
	"extensions/context.ts",
	"extensions/files.ts",
	"extensions/multi-edit.ts",
	"extensions/prompt-editor.ts",
	"extensions/todos.ts",
	"extensions/uv.ts",
	"extensions/whimsical.ts",
	"extensions/btw.ts",
	"extensions/review.ts",
];
const MITSUPI_SKILLS = [
	"skills/apple-mail/SKILL.md",
	"skills/commit/SKILL.md",
	"skills/github/SKILL.md",
	"skills/google-workspace/SKILL.md",
	"skills/mermaid/SKILL.md",
	"skills/pi-share/SKILL.md",
	"skills/sentry/SKILL.md",
	"skills/summarize/SKILL.md",
	"skills/uv/SKILL.md",
];
const REQUIRED_LOCAL_PACKAGES = ["pi-exa", "pi-parallel", "pi-openai-fast", "pi-subagents"];
const REQUIRED_MANAGED_AGENTS = ["review.md"];
const REQUIRED_LOCAL_EXTENSIONS = ["handoff.ts", "notify.ts", "usage-footer.ts"];
const REQUIRED_THEMES = ["gruvbox-dark.json", "gruvbox-light.json"];
const REQUIRED_SHARED_SKILLS = [
	"agent-context",
	"apple-reminders",
	"breadboarding",
	"bro",
	"build-skill",
	"code-review",
	"codebase-design",
	"domain-modeling",
	"dotfiles-dev",
	"flares",
	"framing-doc",
	"grill-me",
	"grill-with-docs",
	"grilling",
	"handoff",
	"herdr",
	"hunk-review",
	"impeccable",
	"implement",
	"kickoff-doc",
	"librarian",
	"moja-glava",
	"opensrc",
	"post-mortem",
	"production-readiness",
	"qmd",
	"surf-browser",
	"tdd",
	"tufte-data-viz",
	"upstream-review",
	"visual-deliverables",
];
const FALLBACK_CATEGORIES = {
	historical: "unsupported_historical_sessions_state",
	cache: "cache",
	stale: "stale_generated_resources_integration",
	unknown: "unknown_user_owned",
};
const KNOWN_STALE_FALLBACK_CHILDREN = {
	agents: new Map([["researcher.md", "symlink"], ["review.md", "file"]]),
	extensions: new Map([
		["cloudflare-approval.ts", "symlink"],
		["context-hp.ts", "symlink"],
		["cost.ts", "symlink"],
		["herdr-agent-state.ts", "file"],
		["notify.ts", "symlink"],
		["pi-openai-fast.json", "file"],
		["usage-footer.ts", "symlink"],
		["watchdog.ts", "symlink"],
	]),
	themes: new Map([["gruvbox-dark.json", "symlink"], ["gruvbox-light.json", "symlink"]]),
};
const DEFAULT_LARGE_SESSION_BYTES = 1024 * 1024 * 1024;
const MAX_SCAN_ENTRIES = 1_000_000;

function parseArgs(argv) {
	const options = {
		home: process.env.PI_PROFILE_CHECK_HOME || process.env.HOME || os.homedir(),
		repo: process.env.PI_PROFILE_CHECK_REPO || ROOT,
		piCommand: process.env.PI_PROFILE_CHECK_PI_COMMAND || "",
		herdrCommand: process.env.PI_PROFILE_CHECK_HERDR_COMMAND || "",
		largeSessionBytes: Number(process.env.PI_PROFILE_CHECK_LARGE_SESSION_BYTES || DEFAULT_LARGE_SESSION_BYTES),
		pretty: false,
	};

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "--json") continue;
		if (arg === "--pretty") {
			options.pretty = true;
			continue;
		}
		const [flag, inlineValue] = arg.split("=", 2);
		if (["--home", "--repo", "--pi-command", "--herdr-command", "--large-session-bytes"].includes(flag)) {
			const value = inlineValue ?? argv[++index];
			if (!value) throw new Error(`${flag} requires a value`);
			if (flag === "--home") options.home = value;
			if (flag === "--repo") options.repo = value;
			if (flag === "--pi-command") options.piCommand = value;
			if (flag === "--herdr-command") options.herdrCommand = value;
			if (flag === "--large-session-bytes") options.largeSessionBytes = Number(value);
			continue;
		}
		throw new Error(`unknown option: ${arg}`);
	}

	if (!Number.isSafeInteger(options.largeSessionBytes) || options.largeSessionBytes < 0) {
		throw new Error("--large-session-bytes must be a non-negative integer");
	}
	options.home = path.resolve(options.home);
	options.repo = path.resolve(options.repo);
	return options;
}

function isWithin(root, candidate) {
	const relative = path.relative(path.resolve(root), path.resolve(candidate));
	return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function safeLstat(filePath) {
	try {
		return { stat: fs.lstatSync(filePath), error: undefined };
	} catch (error) {
		return { stat: undefined, error };
	}
}

function resolveWithTrace(filePath) {
	const absolute = path.resolve(filePath);
	const traced = [];
	let current = absolute;
	let unresolved = false;
	let loop = false;
	const seen = new Set();

	for (let iteration = 0; iteration < 64; iteration += 1) {
		const marker = path.normalize(current);
		if (seen.has(marker)) {
			loop = true;
			break;
		}
		seen.add(marker);
		const { stat } = safeLstat(current);
		if (!stat || !stat.isSymbolicLink()) break;
		const target = fs.readlinkSync(current);
		const resolvedTarget = path.resolve(path.dirname(current), target);
		traced.push(resolvedTarget);
		current = resolvedTarget;
	}

	let resolved = absolute;
	try {
		resolved = fs.realpathSync.native(absolute);
	} catch {
		unresolved = true;
	}
	return { absolute, resolved, traced, unresolved, loop };
}

function pathSafety(filePath, fallbackRoot) {
	const { stat, error } = safeLstat(filePath);
	if (!stat) {
		const fallbackCrossing = isWithin(fallbackRoot, filePath);
		return {
			present: false,
			safe: false,
			kind: "missing",
			fallbackCrossing,
			unresolved: false,
			error: error?.code || "unreadable",
		};
	}
	const trace = resolveWithTrace(filePath);
	const fallbackCrossing = [trace.absolute, trace.resolved, ...trace.traced].some((candidate) => isWithin(fallbackRoot, candidate));
	return {
		present: true,
		safe: !fallbackCrossing && !trace.unresolved && !trace.loop,
		kind: stat.isDirectory() ? "directory" : stat.isSymbolicLink() ? "symlink" : stat.isFile() ? "file" : "other",
		fallbackCrossing,
		unresolved: trace.unresolved,
		loop: trace.loop,
		resolved: trace.resolved,
	};
}

function emptySummary(filePath) {
	return {
		path: filePath,
		present: false,
		safe: true,
		entries: 0,
		files: 0,
		directories: 0,
		symlinks: 0,
		bytes: 0,
		fallbackCrossings: 0,
		externalCrossings: 0,
		unresolved: 0,
		errors: 0,
		truncated: false,
	};
}

function summarizeTree(filePath, fallbackRoot, { required = true, maxEntries = MAX_SCAN_ENTRIES, ownerRoot } = {}) {
	const resolvedOwnerRoot = ownerRoot
		? (pathSafety(ownerRoot, fallbackRoot).resolved || path.resolve(ownerRoot))
		: undefined;
	const initial = safeLstat(filePath);
	if (!initial.stat) {
		const summary = emptySummary(filePath);
		const safety = pathSafety(filePath, fallbackRoot);
		summary.safe = !required && !safety.fallbackCrossing;
		summary.fallbackCrossings = safety.fallbackCrossing ? 1 : 0;
		summary.errors = required ? 1 : 0;
		return summary;
	}

	const summary = emptySummary(filePath);
	summary.present = true;
	const stack = [path.resolve(filePath)];
	while (stack.length > 0) {
		if (summary.entries >= maxEntries) {
			summary.truncated = true;
			break;
		}
		const current = stack.pop();
		const { stat, error } = safeLstat(current);
		if (!stat) {
			summary.errors += 1;
			continue;
		}
		summary.entries += 1;
		const safety = pathSafety(current, fallbackRoot);
		if (safety.fallbackCrossing) summary.fallbackCrossings += 1;
		if (resolvedOwnerRoot && safety.resolved && !isWithin(resolvedOwnerRoot, safety.resolved)) summary.externalCrossings += 1;
		if (safety.unresolved || safety.loop) summary.unresolved += 1;
		if (stat.isSymbolicLink()) {
			summary.symlinks += 1;
			continue;
		}
		if (stat.isDirectory()) {
			summary.directories += 1;
			let children;
			try {
				children = fs.readdirSync(current).map((name) => path.join(current, name));
			} catch {
				summary.errors += 1;
				continue;
			}
			stack.push(...children);
			continue;
		}
		if (stat.isFile()) {
			summary.files += 1;
			summary.bytes += stat.size;
		}
	}

	summary.safe = summary.fallbackCrossings === 0 && summary.externalCrossings === 0 && summary.unresolved === 0 && summary.errors === 0 && !summary.truncated;
	return summary;
}

function summarizePath(filePath, fallbackRoot, { required = true } = {}) {
	const status = pathSafety(filePath, fallbackRoot);
	if (!status.present) {
		return {
			path: filePath,
			present: false,
			safe: !required && !status.fallbackCrossing,
			entries: 0,
			files: 0,
			directories: 0,
			symlinks: 0,
			bytes: 0,
			fallbackCrossings: status.fallbackCrossing ? 1 : 0,
			unresolved: 0,
			errors: required ? 1 : 0,
			truncated: false,
		};
	}
	const stat = fs.lstatSync(filePath);
	return {
		path: filePath,
		present: true,
		safe: status.safe,
		entries: 1,
		files: stat.isFile() ? 1 : 0,
		directories: stat.isDirectory() ? 1 : 0,
		symlinks: stat.isSymbolicLink() ? 1 : 0,
		bytes: stat.isFile() ? stat.size : 0,
		fallbackCrossings: status.fallbackCrossing ? 1 : 0,
		externalCrossings: 0,
		unresolved: status.unresolved || status.loop ? 1 : 0,
		errors: 0,
		truncated: false,
	};
}

function listNames(directory, predicate = () => true) {
	try {
		return fs.readdirSync(directory).filter(predicate).sort();
	} catch {
		return [];
	}
}

function readJson(filePath) {
	try {
		return JSON.parse(fs.readFileSync(filePath, "utf8"));
	} catch {
		return undefined;
	}
}

function expandSettingPath(value, home, repo, profileRoot) {
	if (typeof value !== "string" || value.length === 0) return "";
	if (value === "~/.dotfiles" || value.startsWith("~/.dotfiles/")) {
		return path.join(repo, value.slice("~/.dotfiles".length).replace(/^\//, ""));
	}
	if (value === "~") return home;
	if (value.startsWith("~/")) return path.join(home, value.slice(2));
	if (value.startsWith("/")) return path.resolve(value);
	return path.resolve(profileRoot, value);
}

function relativeResourcePath(value, profileRoot, repo) {
	if (isWithin(repo, value)) return path.relative(repo, value) || ".";
	if (isWithin(profileRoot, value)) return path.relative(profileRoot, value) || ".";
	return path.basename(value);
}

function expectedLink(sourcePath, targetPath, fallbackRoot) {
	const source = pathSafety(sourcePath, fallbackRoot);
	const target = pathSafety(targetPath, fallbackRoot);
	let matches = false;
	if (source.present && target.present && source.resolved && target.resolved) {
		matches = path.resolve(source.resolved) === path.resolve(target.resolved);
	}
	return {
		present: target.present,
		safe: source.safe && target.safe && matches,
		matches,
		fallbackCrossings: source.fallbackCrossing || target.fallbackCrossing ? 1 : 0,
	};
}

function aggregateSummaries(summaries, filePath = "") {
	const result = emptySummary(filePath);
	result.present = summaries.some((summary) => summary.present);
	for (const summary of summaries) {
		result.entries += summary.entries;
		result.files += summary.files;
		result.directories += summary.directories;
		result.symlinks += summary.symlinks;
		result.bytes += summary.bytes;
		result.fallbackCrossings += summary.fallbackCrossings;
		result.externalCrossings += summary.externalCrossings;
		result.unresolved += summary.unresolved;
		result.errors += summary.errors;
		result.truncated ||= summary.truncated;
	}
	result.safe = summaries.every((summary) => summary.safe);
	return result;
}

function resourceResult(summary, extra = {}) {
	return {
		path: summary.path,
		present: summary.present,
		safe: summary.safe,
		entries: summary.entries,
		bytes: summary.bytes,
		fallbackCrossings: summary.fallbackCrossings,
		externalCrossings: summary.externalCrossings,
		unresolved: summary.unresolved,
		errors: summary.errors,
		truncated: summary.truncated,
		...extra,
	};
}

function settingsProvider(profileRoot) {
	const settingsPath = path.join(profileRoot, "settings.json");
	const settings = readJson(settingsPath);
	return {
		path: settingsPath,
		settings,
		valid: Boolean(settings && typeof settings === "object" && !Array.isArray(settings)),
		provider: settings && typeof settings.defaultProvider === "string" ? settings.defaultProvider : "",
	};
}

function sourceBoundary(repo) {
	const sourceFiles = [
		"bin/pi",
		"bin/pi-work",
		"bin/pi-personal",
		"ai/install.sh",
		"pi/install.sh",
		"herdr/install.sh",
	];
	const sources = {};
	let sourcePass = true;
	for (const relativePath of sourceFiles) {
		const filePath = path.join(repo, relativePath);
		let text = "";
		try {
			text = fs.readFileSync(filePath, "utf8");
		} catch {
			sources[relativePath] = { present: false, fallbackReferences: 0, operationalDependency: true };
			sourcePass = false;
			continue;
		}
		const lines = text.split("\n").filter((line) => line.includes(".pi/agent"));
		let operationalDependency = lines.length > 0;
		let migrationOnly = false;
		if (relativePath === "ai/install.sh") {
			migrationOnly = lines.length > 0 && lines.every((line) => line.includes("legacy_instruction=") || line.includes("legacy_agents_dir="));
			operationalDependency = !migrationOnly;
		}
		if (relativePath !== "ai/install.sh" && lines.length > 0) operationalDependency = true;
		sources[relativePath] = {
			present: true,
			fallbackReferences: lines.length,
			migrationOnly,
			operationalDependency,
		};
		if (operationalDependency) sourcePass = false;
	}

	const wrapperText = {};
	for (const profile of PROFILES) {
		const wrapperPath = path.join(repo, "bin", `pi-${profile.name}`);
		const dispatcherPath = path.join(repo, "bin", "pi");
		const wrapper = (() => {
			try {
				return fs.readFileSync(wrapperPath, "utf8");
			} catch {
				return "";
			}
		})();
		const dispatcher = (() => {
			try {
				return fs.readFileSync(dispatcherPath, "utf8");
			} catch {
				return "";
			}
		})();
		const bound = wrapper.includes(`PI_WRAPPER_PROFILE=${profile.name}`)
			&& dispatcher.includes('export PI_CODING_AGENT_DIR="$HOME/.pi/$profile"')
			&& dispatcher.includes("GIT_EDITOR=true")
			&& dispatcher.includes("GIT_SEQUENCE_EDITOR=true")
			&& dispatcher.includes("GIT_MERGE_AUTOEDIT=no");
		wrapperText[profile.name] = {
			path: wrapperPath,
			present: Boolean(wrapper),
			fallbackReferences: (wrapper.match(/\.pi\/agent/g) || []).length + (dispatcher.match(/\.pi\/agent/g) || []).length,
			boundProfile: bound,
		};
		if (!bound) sourcePass = false;
	}

	const packageChecks = [
		{
			name: "pi-subagents",
			source: path.join(repo, "pi/packages/pi-subagents/profile-paths.ts"),
			readme: path.join(repo, "pi/packages/pi-subagents/README.md"),
			provenance: path.join(repo, "pi/packages/pi-subagents/VENDORED_FROM.md"),
			fallbackPattern: 'path.join(homedir, ".pi", "agent")',
		},
		{
			name: "pi-openai-fast",
			source: path.join(repo, "pi/packages/pi-openai-fast/extensions/index.ts"),
			readme: path.join(repo, "pi/packages/pi-openai-fast/README.md"),
			provenance: path.join(repo, "pi/packages/pi-openai-fast/VENDORED_FROM.md"),
			fallbackPattern: 'join(homeDir, ".pi", "agent")',
		},
	];
	const localPackageFallbacks = {};
	for (const check of packageChecks) {
		const source = (() => {
			try {
				return fs.readFileSync(check.source, "utf8");
			} catch {
				return "";
			}
		})();
		const readme = (() => {
			try {
				return fs.readFileSync(check.readme, "utf8");
			} catch {
				return "";
			}
		})();
		const provenance = (() => {
			try {
				return fs.readFileSync(check.provenance, "utf8");
			} catch {
				return "";
			}
		})();
		const sourceHasFallback = source.includes(check.fallbackPattern) || source.includes('".pi", "agent"');
		const sourceUsesProfileEnvironment = source.includes("PI_CODING_AGENT_DIR");
		const documented = readme.includes("~/.pi/agent") && provenance.includes("~/.pi/agent");
		const operationalDependency = !sourceUsesProfileEnvironment || !sourceHasFallback || !documented;
		localPackageFallbacks[check.name] = {
			compatibilityFallbackPresent: sourceHasFallback,
			profileEnvironmentPresent: sourceUsesProfileEnvironment,
			documented,
			operationalDependency,
		};
		if (operationalDependency) sourcePass = false;
	}

	return {
		pass: sourcePass,
		wrappers: wrapperText,
		sources,
		localPackageFallbacks,
	};
}

function fallbackEntryKind(stat) {
	if (stat.isDirectory()) return "directory";
	if (stat.isSymbolicLink()) return "symlink";
	if (stat.isFile()) return "file";
	return "other";
}

function readSmallFallbackText(filePath, stat) {
	if (!stat.isFile() || stat.size > 128 * 1024) return undefined;
	try {
		return fs.readFileSync(filePath, "utf8");
	} catch {
		return undefined;
	}
}

function hasKnownStaleFileIdentity(relativePath, filePath, stat) {
	const content = readSmallFallbackText(filePath, stat);
	if (content === undefined) return false;
	if (relativePath === "AGENTS.md") {
		return content.includes("Managed by ~/.dotfiles/ai/install.sh");
	}
	if (relativePath === path.join("agents", "review.md")) {
		return content.includes("# Managed by ~/.dotfiles/ai/install.sh")
			&& /^name:\s*review\s*$/m.test(content);
	}
	if (relativePath === path.join("extensions", "herdr-agent-state.ts")) {
		return content.startsWith("// installed by herdr\n// managed by herdr;");
	}
	if (relativePath === path.join("extensions", "pi-openai-fast.json")) {
		try {
			const config = JSON.parse(content);
			const keys = Object.keys(config).sort();
			return keys.every((key) => ["active", "persistState", "supportedModels"].includes(key))
				&& typeof config.active === "boolean"
				&& typeof config.persistState === "boolean"
				&& Array.isArray(config.supportedModels)
				&& config.supportedModels.every((model) => typeof model === "string");
		} catch {
			return false;
		}
	}
	if (relativePath === path.join("skills", "tldraw-offline", "SKILL.md")) {
		return content.includes("<!-- installed-by:tldraw-desktop-agent-skills -->")
			&& /^name:\s*tldraw-offline\s*$/m.test(content);
	}
	return false;
}

function classifyFallbackEntry(relativePath, filePath, stat) {
	const [top, child, grandchild, ...rest] = relativePath.split(path.sep);
	if (["sessions", "run-history.jsonl", "history.jsonl", "auth.json", "settings.json", "modes.json", "trust.json"].includes(top)) {
		return FALLBACK_CATEGORIES.historical;
	}
	if (["node_modules", "git", "models-store.json", "mcp-cache.json", "cache", "caches"].includes(top)) {
		return FALLBACK_CATEGORIES.cache;
	}
	if (top === "skills") {
		if (!child && stat.isDirectory()) return FALLBACK_CATEGORIES.stale;
		if (child === "tldraw-offline" && !grandchild && stat.isDirectory()) return FALLBACK_CATEGORIES.stale;
		if (
			child === "tldraw-offline"
			&& grandchild === "SKILL.md"
			&& rest.length === 0
			&& hasKnownStaleFileIdentity(relativePath, filePath, stat)
		) return FALLBACK_CATEGORIES.stale;
		return FALLBACK_CATEGORIES.unknown;
	}
	const staleChildren = KNOWN_STALE_FALLBACK_CHILDREN[top];
	if (staleChildren) {
		if (!child && stat.isDirectory()) return FALLBACK_CATEGORIES.stale;
		if (grandchild || rest.length > 0) return FALLBACK_CATEGORIES.unknown;
		const expectedKind = staleChildren.get(child);
		if (expectedKind !== fallbackEntryKind(stat)) return FALLBACK_CATEGORIES.unknown;
		if (expectedKind === "file" && !hasKnownStaleFileIdentity(relativePath, filePath, stat)) {
			return FALLBACK_CATEGORIES.unknown;
		}
		return FALLBACK_CATEGORIES.stale;
	}
	if (top === "AGENTS.md") {
		return hasKnownStaleFileIdentity(relativePath, filePath, stat)
			? FALLBACK_CATEGORIES.stale
			: FALLBACK_CATEGORIES.unknown;
	}
	if ([
		"mcp.json",
		"package.json",
		"package-lock.json",
		"cloudflare-approval.ts",
		"context-hp.ts",
		"herdr-agent-state.ts",
		"notify.ts",
		"pi-openai-fast.json",
		"usage-footer.ts",
		"cost.ts",
		"watchdog.ts",
		"researcher.md",
		"review.md",
	].includes(top) && stat.isSymbolicLink()) return FALLBACK_CATEGORIES.stale;
	return FALLBACK_CATEGORIES.unknown;
}

function fallbackInventory(fallbackRoot) {
	const initial = safeLstat(fallbackRoot);
	if (!initial.stat) {
		return {
			path: fallbackRoot,
			present: false,
			entries: 0,
			bytes: 0,
			categories: [],
			unknownUserOwnedData: false,
			manualReviewRequired: false,
			deletionRecommendation: "absent",
		};
	}
	const categoryMap = new Map();
	const rootStat = initial.stat;
	const stack = [{ filePath: fallbackRoot, relativePath: "" }];
	let entries = 0;
	let bytes = 0;
	let errors = 0;
	let truncated = false;
	while (stack.length > 0) {
		if (entries >= MAX_SCAN_ENTRIES) {
			truncated = true;
			break;
		}
		const current = stack.pop();
		const { stat } = safeLstat(current.filePath);
		if (!stat) {
			errors += 1;
			continue;
		}
		entries += 1;
		const category = current.relativePath
			? classifyFallbackEntry(current.relativePath, current.filePath, stat)
			: FALLBACK_CATEGORIES.stale;
		if (!categoryMap.has(category)) categoryMap.set(category, { category, entries: 0, files: 0, directories: 0, symlinks: 0, bytes: 0 });
		const item = categoryMap.get(category);
		item.entries += 1;
		if (stat.isDirectory()) {
			item.directories += 1;
			let children;
			try {
				children = fs.readdirSync(current.filePath);
			} catch {
				errors += 1;
				continue;
			}
			for (const name of children) {
				stack.push({ filePath: path.join(current.filePath, name), relativePath: current.relativePath ? path.join(current.relativePath, name) : name });
			}
		} else if (stat.isSymbolicLink()) {
			item.symlinks += 1;
		} else if (stat.isFile()) {
			item.files += 1;
			item.bytes += stat.size;
			bytes += stat.size;
		}
	}
	if (rootStat.isFile()) bytes = rootStat.size;
	const categories = [...categoryMap.values()].sort((a, b) => a.category.localeCompare(b.category));
	const unknownUserOwnedData = truncated || errors > 0 || categories.some((item) => item.category === FALLBACK_CATEGORIES.unknown);
	const manualReviewRequired = unknownUserOwnedData;
	return {
		path: fallbackRoot,
		present: true,
		entries,
		bytes,
		errors,
		truncated,
		categories,
		unknownUserOwnedData,
		manualReviewRequired,
		deletionRecommendation: manualReviewRequired ? "manual_review_required" : "safe_after_profile_checks",
	};
}

function authMechanism(profileName, environment, authResult) {
	if (profileName === "personal") {
		return authResult?.authType === "oauth" ? "oauth_profile" : "profile_auth";
	}
	if (environment.OPENAI_API_KEY?.trim()) return "api_key_env";
	if (environment.OPENAI_OP_REF?.trim()) return "one_password_ref";
	return "not_configured";
}

function parsePiJson(stdout) {
	const lines = String(stdout || "").split("\n").map((line) => line.trim()).filter(Boolean).reverse();
	for (const line of lines) {
		if (!line.startsWith("{")) continue;
		try {
			const value = JSON.parse(line);
			if (value && typeof value === "object" && !Array.isArray(value)) return value;
		} catch {
			// Ignore startup text and continue looking for the JSON auth response.
		}
	}
	return undefined;
}

function runCommand(command, args, environment, cwd) {
	if (!command) return { ran: false, exitCode: undefined, stdout: "", stderr: "", error: "command_missing" };
	const result = spawnSync(command, args, {
		cwd,
		env: environment,
		encoding: "utf8",
		maxBuffer: 1024 * 1024,
		timeout: 30_000,
	});
	return {
		ran: result.error === undefined,
		exitCode: result.status === null ? undefined : result.status,
		stdout: result.stdout || "",
		stderr: result.stderr || "",
		error: result.error?.code || (result.error ? "command_error" : ""),
	};
}

function authProbe(profile, options, configuredProvider) {
	const profileRoot = path.join(options.home, ".pi", profile.name);
	const wrapperPath = options.piCommand || path.join(options.repo, "bin", `pi-${profile.name}`);
	const environment = {
		...process.env,
		HOME: options.home,
		USERPROFILE: options.home,
		PI_CODING_AGENT_DIR: profileRoot,
		PI_OFFLINE: "1",
		PI_TELEMETRY: "0",
	};
	const command = runCommand(wrapperPath, ["auth", "check", "--provider", profile.provider, "--json", "--no-refresh"], environment, options.repo);
	const parsed = parsePiJson(command.stdout);
	const providerMatched = parsed?.provider === profile.provider;
	const status = parsed?.status === "ready" || parsed?.status === "not_ready" ? parsed.status : command.error ? "command_failed" : "invalid_response";
	const commandRan = command.ran;
	const commandSucceeded = commandRan && command.exitCode === 0;
	const usable = commandSucceeded && providerMatched && status === "ready";
	return {
		wrapper: wrapperPath,
		commandRan,
		commandSucceeded,
		commandExitCode: command.exitCode,
		configuredProvider,
		provider: parsed?.provider || "",
		providerMatched,
		status,
		authType: typeof parsed?.authType === "string" ? parsed.authType : "",
		mechanism: authMechanism(profile.name, environment, parsed),
		usable,
		noPaidCalls: true,
	};
}

function herdrProbe(profile, options) {
	const profileRoot = path.join(options.home, ".pi", profile.name);
	const command = options.herdrCommand || "herdr";
	const environment = {
		...process.env,
		HOME: options.home,
		USERPROFILE: options.home,
		PI_CODING_AGENT_DIR: profileRoot,
	};
	const result = runCommand(command, ["integration", "status"], environment, options.repo);
	const current = result.ran && /(^|\n)pi: current /m.test(result.stdout);
	return {
		command,
		commandRan: result.ran,
		current,
		safe: current,
		status: result.ran ? (current ? "current" : "missing_or_outdated") : "command_unavailable",
	};
}

function buildProfile(profile, options, fallbackRoot, sourceInfo, otherProfileState) {
	const profileRoot = path.join(options.home, ".pi", profile.name);
	const profileRootSummary = summarizePath(profileRoot, fallbackRoot, { required: true });
	const settingsInfo = settingsProvider(profileRoot);
	const settings = settingsInfo.settings || {};
	const profilePath = (relative) => path.join(profileRoot, relative);

	const knownStateNames = [
		"auth.json",
		"herdr-agent-state.ts",
		"settings.json",
		"models-store.json",
		"mcp.json",
		"mcp-cache.json",
		"modes.json",
		"trust.json",
		"run-history.jsonl",
		"sessions",
		"extensions",
		"themes",
		"agents",
		"npm",
		"node_modules",
		"package.json",
		"package-lock.json",
	];
	const discoveredStateNames = listNames(profileRoot).filter((name) => name !== "AGENTS.md");
	const stateNames = [...new Set([...knownStateNames, ...discoveredStateNames])].sort();
	const externallyManagedResourceDirs = new Set(["agents", "extensions", "themes"]);
	const state = {};
	for (const name of stateNames) {
		const statePath = profilePath(name);
		const { stat } = safeLstat(statePath);
		state[name] = stat?.isDirectory() && !stat.isSymbolicLink()
			? summarizeTree(statePath, fallbackRoot, {
				required: false,
				...(externallyManagedResourceDirs.has(name) ? {} : { ownerRoot: profileRoot }),
			})
			: summarizePath(statePath, fallbackRoot, { required: false });
		if (externallyManagedResourceDirs.has(name) && state[name].present) {
			state[name].safe = state[name].fallbackCrossings === 0 && state[name].errors === 0 && !state[name].truncated;
		}
	}
	const sessionSummary = summarizeTree(profilePath("sessions"), fallbackRoot, { required: false });
	const session = {
		path: sessionSummary.path,
		present: sessionSummary.present,
		entries: sessionSummary.entries,
		bytes: sessionSummary.bytes,
		fallbackCrossings: sessionSummary.fallbackCrossings,
		safe: sessionSummary.safe,
		large: sessionSummary.bytes >= options.largeSessionBytes,
		optionalManualDeletion: sessionSummary.bytes >= options.largeSessionBytes,
	};

	const managedSourceRoot = path.join(options.repo, ".ai-runtime", "pi", "agents");
	const authoredManagedNames = listNames(path.join(options.repo, "pi", "agents"), (name) => name.endsWith(".frontmatter"))
		.map((name) => name.replace(/\.frontmatter$/, ".md"));
	const generatedManagedNames = listNames(managedSourceRoot, (name) => name.endsWith(".md"));
	const managedManifestCurrent = REQUIRED_MANAGED_AGENTS.every((name) => authoredManagedNames.includes(name) && generatedManagedNames.includes(name));
	const managedNames = REQUIRED_MANAGED_AGENTS;
	const managedTargetRoot = profilePath("agents");
	const managedTargetSummary = summarizeTree(managedTargetRoot, fallbackRoot, { required: true });
	const managedLinks = managedNames.map((name) => expectedLink(path.join(managedSourceRoot, name), path.join(managedTargetRoot, name), fallbackRoot));
	const customAgentNames = listNames(managedTargetRoot).filter((name) => !managedNames.includes(name));
	const profileRootResolved = pathSafety(profileRoot, fallbackRoot).resolved || path.resolve(profileRoot);
	const customAgentOwnership = customAgentNames.map((name) => {
		const status = pathSafety(path.join(managedTargetRoot, name), fallbackRoot);
		return status.safe && Boolean(status.resolved) && isWithin(profileRootResolved, status.resolved);
	});
	const managedAgents = {
		path: managedTargetRoot,
		sourcePath: managedSourceRoot,
		manifestCurrent: managedManifestCurrent,
		present: managedTargetSummary.present,
		entries: managedTargetSummary.entries,
		bytes: managedTargetSummary.bytes,
		unresolved: managedTargetSummary.unresolved,
		errors: managedTargetSummary.errors,
		truncated: managedTargetSummary.truncated,
		safe: managedManifestCurrent && managedTargetSummary.safe && managedLinks.every((item) => item.safe) && customAgentOwnership.every(Boolean),
		expected: managedNames.length,
		linked: managedLinks.filter((item) => item.matches).length,
		missing: managedLinks.filter((item) => !item.present).length,
		misdirected: managedLinks.filter((item) => item.present && !item.matches).length,
		fallbackCrossings: managedLinks.reduce((sum, item) => sum + item.fallbackCrossings, managedTargetSummary.fallbackCrossings),
		customEntries: customAgentNames.length,
		customOwned: customAgentOwnership.filter(Boolean).length,
		customExternal: customAgentOwnership.filter((owned) => !owned).length,
	};

	const generatedInstruction = path.join(options.repo, ".ai-runtime", "pi", "AGENTS.md");
	const instructionLink = expectedLink(generatedInstruction, profilePath("AGENTS.md"), fallbackRoot);
	const instructions = {
		path: profilePath("AGENTS.md"),
		sourcePath: generatedInstruction,
		present: instructionLink.present,
		safe: instructionLink.safe,
		matches: instructionLink.matches,
		fallbackCrossings: instructionLink.fallbackCrossings,
	};

	const configuredSkills = Array.isArray(settings.skills) ? settings.skills : [];
	const skillRoots = configuredSkills.map((value) => expandSettingPath(value, options.home, options.repo, profileRoot)).filter(Boolean);
	const generatedSkillRoot = path.join(options.repo, ".ai-runtime", "pi", "skills");
	const projectedSkillResults = skillRoots.map((skillRoot) => {
		const optional = skillRoot.endsWith(path.join("skills", "tldraw-offline"));
		const summary = summarizeTree(skillRoot, fallbackRoot, { required: !optional });
		return {
			path: skillRoot,
			label: path.resolve(skillRoot) === path.resolve(generatedSkillRoot) ? "generated" : optional ? "external_optional" : "configured",
			optional,
			...resourceResult(summary),
		};
	});
	const authoredSkillRoot = path.join(options.repo, "ai", "skills");
	const authoredSkillStatuses = REQUIRED_SHARED_SKILLS.map((name) => summarizePath(path.join(authoredSkillRoot, name, "SKILL.md"), fallbackRoot, { required: true }));
	const generatedSkillStatuses = REQUIRED_SHARED_SKILLS.map((name) => summarizePath(path.join(generatedSkillRoot, name, "SKILL.md"), fallbackRoot, { required: true }));
	const generatedRootConfigured = skillRoots.some((skillRoot) => path.resolve(skillRoot) === path.resolve(generatedSkillRoot));
	const projectedSkills = {
		configured: configuredSkills.length,
		roots: projectedSkillResults,
		generatedRootConfigured,
		expected: REQUIRED_SHARED_SKILLS.length,
		authored: authoredSkillStatuses.filter((item) => item.present).length,
		projected: generatedSkillStatuses.filter((item) => item.present).length,
		missing: generatedSkillStatuses.filter((item) => !item.present).length,
		safe: generatedRootConfigured
			&& projectedSkillResults.every((item) => item.safe)
			&& authoredSkillStatuses.every((item) => item.safe)
			&& generatedSkillStatuses.every((item) => item.safe),
		fallbackCrossings: projectedSkillResults.reduce((sum, item) => sum + item.fallbackCrossings, 0)
			+ authoredSkillStatuses.reduce((sum, item) => sum + item.fallbackCrossings, 0)
			+ generatedSkillStatuses.reduce((sum, item) => sum + item.fallbackCrossings, 0),
	};

	const localExtensionSource = path.join(options.repo, "pi", "extensions");
	const localExtensionTarget = profilePath("extensions");
	const localExtensionSummary = summarizeTree(localExtensionTarget, fallbackRoot, { required: true });
	const authoredLocalExtensionNames = listNames(localExtensionSource, (name) => name.endsWith(".ts"));
	const localExtensionManifestCurrent = REQUIRED_LOCAL_EXTENSIONS.every((name) => authoredLocalExtensionNames.includes(name));
	const localExtensionNames = REQUIRED_LOCAL_EXTENSIONS;
	const localExtensionLinks = localExtensionNames.map((name) => expectedLink(path.join(localExtensionSource, name), path.join(localExtensionTarget, name), fallbackRoot));
	const localExtensions = {
		path: localExtensionTarget,
		sourcePath: localExtensionSource,
		...resourceResult(localExtensionSummary),
		manifestCurrent: localExtensionManifestCurrent,
		expected: localExtensionNames.length,
		linked: localExtensionLinks.filter((item) => item.matches).length,
		missing: localExtensionLinks.filter((item) => !item.present).length,
		misdirected: localExtensionLinks.filter((item) => item.present && !item.matches).length,
		unmanagedUnresolved: Math.max(0, localExtensionSummary.unresolved - localExtensionLinks.filter((item) => item.unresolved).length),
		safe: localExtensionManifestCurrent
			&& localExtensionSummary.fallbackCrossings === 0
			&& localExtensionSummary.errors === 0
			&& !localExtensionSummary.truncated
			&& localExtensionLinks.every((item) => item.safe),
	};

	const themeSourceRoot = path.join(options.repo, "pi", "themes");
	const themeTargetRoot = profilePath("themes");
	const themeSummary = summarizeTree(themeTargetRoot, fallbackRoot, { required: true });
	const authoredThemeNames = listNames(themeSourceRoot, (name) => name.endsWith(".json"));
	const themeManifestCurrent = REQUIRED_THEMES.every((name) => authoredThemeNames.includes(name));
	const themeNames = REQUIRED_THEMES;
	const themeLinks = themeNames.map((name) => expectedLink(path.join(themeSourceRoot, name), path.join(themeTargetRoot, name), fallbackRoot));
	const selectedTheme = typeof settings.theme === "string" ? settings.theme : "";
	const selectedThemePath = selectedTheme ? path.join(themeTargetRoot, `${selectedTheme}.json`) : "";
	const selectedThemeStatus = selectedThemePath ? pathSafety(selectedThemePath, fallbackRoot) : { present: false, safe: false, fallbackCrossing: false };
	const themes = {
		path: themeTargetRoot,
		...resourceResult(themeSummary),
		manifestCurrent: themeManifestCurrent,
		expected: themeNames.length,
		linked: themeLinks.filter((item) => item.matches).length,
		selected: selectedTheme,
		selectedPresent: selectedThemeStatus.present,
		selectedSafe: selectedThemeStatus.safe,
		safe: themeManifestCurrent && themeSummary.safe && themeLinks.every((item) => item.safe) && selectedThemeStatus.safe,
	};

	const packageEntries = Array.isArray(settings.packages) ? settings.packages : [];
	const packageResults = packageEntries.filter((entry) => typeof entry === "string").map((entry) => {
		const packagePath = expandSettingPath(entry, options.home, options.repo, profileRoot);
		const summary = summarizePath(packagePath, fallbackRoot, { required: true });
		return {
			path: packagePath,
			label: relativeResourcePath(packagePath, profileRoot, options.repo),
			...resourceResult(summary),
		};
	});
	const requiredLocalPackagePaths = REQUIRED_LOCAL_PACKAGES.map((name) => path.join(options.repo, "pi", "packages", name));
	const requiredLocalPackageStatuses = requiredLocalPackagePaths.map((packagePath) => {
		const summary = summarizePath(packagePath, fallbackRoot, { required: true });
		return {
			path: packagePath,
			configured: packageResults.some((item) => path.resolve(item.path) === path.resolve(packagePath)),
			...resourceResult(summary),
		};
	});
	const packages = {
		configured: packageEntries.length,
		local: packageResults.length,
		present: packageResults.filter((item) => item.present).length,
		required: requiredLocalPackageStatuses.length,
		requiredConfigured: requiredLocalPackageStatuses.filter((item) => item.configured).length,
		requiredPresent: requiredLocalPackageStatuses.filter((item) => item.present).length,
		safe: packageResults.every((item) => item.safe)
			&& requiredLocalPackageStatuses.every((item) => item.configured && item.safe),
		entries: packageResults,
	};

	const mitsupiConfigs = packageEntries.filter((entry) => entry && typeof entry === "object" && entry.source === "npm:mitsupi@1.6.0");
	const mitsupiConfig = mitsupiConfigs[0];
	const mitsupiRoot = profilePath("npm/node_modules/mitsupi");
	const mitsupiSummary = summarizeTree(mitsupiRoot, fallbackRoot, { required: true });
	const mitsupiJson = readJson(path.join(mitsupiRoot, "package.json"));
	const configuredExtensions = mitsupiConfig && Array.isArray(mitsupiConfig.extensions) ? mitsupiConfig.extensions : [];
	const configuredMitsupiSkills = mitsupiConfig && Array.isArray(mitsupiConfig.skills) ? mitsupiConfig.skills : [];
	const configuredPrompts = mitsupiConfig && Array.isArray(mitsupiConfig.prompts) ? mitsupiConfig.prompts : undefined;
	const configuredThemes = mitsupiConfig && Array.isArray(mitsupiConfig.themes) ? mitsupiConfig.themes : undefined;
	const extensionStatuses = MITSUPI_EXTENSIONS.map((relative) => summarizePath(path.join(mitsupiRoot, relative), fallbackRoot, { required: true }));
	const skillStatuses = MITSUPI_SKILLS.map((relative) => summarizePath(path.join(mitsupiRoot, relative), fallbackRoot, { required: true }));
	const mitsupiOwned = statePathOwned({ present: mitsupiSummary.present, safe: mitsupiSummary.safe, path: mitsupiRoot }, profileRoot, "npm", fallbackRoot);
	const mitsupi = {
		path: mitsupiRoot,
		...resourceResult(mitsupiSummary, { owned: mitsupiOwned }),
		version: typeof mitsupiJson?.version === "string" ? mitsupiJson.version : "",
		packagePresent: mitsupiJson?.name === "mitsupi" && mitsupiJson?.version === "1.6.0",
		configured: mitsupiConfigs.length === 1,
		configuredCopies: mitsupiConfigs.length,
		extensions: {
			expected: MITSUPI_EXTENSIONS,
			configured: configuredExtensions,
			present: extensionStatuses.filter((item) => item.present).length,
			safe: extensionStatuses.every((item) => item.safe),
		},
		skills: {
			expected: MITSUPI_SKILLS,
			configured: configuredMitsupiSkills,
			present: skillStatuses.filter((item) => item.present).length,
			safe: skillStatuses.every((item) => item.safe),
		},
		promptsEmpty: Array.isArray(configuredPrompts) && configuredPrompts.length === 0,
		themesEmpty: Array.isArray(configuredThemes) && configuredThemes.length === 0,
		safe: mitsupiConfigs.length === 1
			&& mitsupiOwned
			&& mitsupiSummary.safe
			&& mitsupiJson?.name === "mitsupi"
			&& mitsupiJson?.version === "1.6.0"
			&& configuredExtensions.length === MITSUPI_EXTENSIONS.length
			&& configuredExtensions.every((value, index) => value === MITSUPI_EXTENSIONS[index])
			&& configuredMitsupiSkills.length === MITSUPI_SKILLS.length
			&& configuredMitsupiSkills.every((value, index) => value === MITSUPI_SKILLS[index])
			&& extensionStatuses.every((item) => item.safe)
			&& skillStatuses.every((item) => item.safe)
			&& Array.isArray(configuredPrompts) && configuredPrompts.length === 0
			&& Array.isArray(configuredThemes) && configuredThemes.length === 0,
	};

	const dependencyPaths = [
		{ label: "profile_node_modules", path: profilePath("node_modules"), required: true },
		{ label: "profile_package_store", path: profilePath("npm/node_modules"), required: true },
		{ label: "dotfiles_pi_dependencies", path: path.join(options.repo, "pi/node_modules"), required: true },
		{ label: "pi_subagents_dependencies", path: path.join(options.repo, "pi/packages/pi-subagents/node_modules"), required: true },
	];
	const dependencyResults = dependencyPaths.map((dependency) => {
		const summary = dependency.label === "profile_node_modules"
			? summarizePath(dependency.path, fallbackRoot, { required: dependency.required })
			: summarizeTree(dependency.path, fallbackRoot, { required: dependency.required });
		const owned = dependency.label === "profile_package_store"
			? statePathOwned(summary, profileRoot, "npm", fallbackRoot)
			: true;
		return { label: dependency.label, ...resourceResult(summary, { owned }) };
	});
	const dependencies = {
		roots: dependencyResults,
		present: dependencyResults.filter((item) => item.present).length,
		safe: dependencyResults.every((item) => item.safe && item.owned),
	};

	const handoffSource = path.join(options.repo, "pi/extensions/handoff.ts");
	const handoffTarget = profilePath("extensions/handoff.ts");
	const handoffSkill = path.join(options.repo, ".ai-runtime/pi/skills/handoff/SKILL.md");
	const handoffLink = expectedLink(handoffSource, handoffTarget, fallbackRoot);
	const handoffSkillStatus = summarizePath(handoffSkill, fallbackRoot, { required: true });
	const handoff = {
		extension: { path: handoffTarget, sourcePath: handoffSource, ...handoffLink },
		skill: resourceResult(handoffSkillStatus),
		safe: handoffLink.safe && handoffSkillStatus.safe,
	};

	const herdr = herdrProbe(profile, options);
	const auth = authProbe(profile, options, settingsInfo.provider);
	const expectedProvider = profile.provider;
	const providerConfigured = settingsInfo.valid && settingsInfo.provider === expectedProvider;
	const statePathEntries = Object.values(state);
	const statePathOwnership = Object.fromEntries(Object.entries(state).map(([name, summary]) => [name, statePathOwned(summary, profileRoot, name, fallbackRoot)]));
	const stateSafe = profileRootSummary.safe && stateSafeForProfile(statePathEntries, profileRoot, fallbackRoot);
	const profilePass = providerConfigured
		&& auth.usable
		&& auth.providerMatched
		&& auth.commandSucceeded
		&& stateSafe
		&& instructions.safe
		&& managedAgents.safe
		&& projectedSkills.safe
		&& localExtensions.safe
		&& themes.safe
		&& packages.safe
		&& mitsupi.safe
		&& dependencies.safe
		&& handoff.safe
		&& herdr.current;

	return {
		name: profile.name,
		root: profileRoot,
		provider: expectedProvider,
		launch: {
			selection: {
				expectedProfile: profile.name,
				wrapper: auth.wrapper,
				wrapperCommandRan: auth.commandRan,
				wrapperCommandSucceeded: auth.commandSucceeded,
				providerConfigured,
				providerObserved: auth.provider,
				providerMatched: auth.providerMatched,
				verified: sourceInfo.wrappers[profile.name]?.boundProfile === true && providerConfigured && auth.commandSucceeded && auth.providerMatched,
			},
			auth,
		},
		state: {
			profileRoot: resourceResult(profileRootSummary),
			mutableRootsSafe: stateSafe,
			paths: Object.fromEntries(Object.entries(state).map(([name, summary]) => [name, resourceResult(summary, { owned: statePathOwnership[name] })])),
			sessions: session,
			crossProfileCollisions: otherProfileState ? findStateCollisions(state, otherProfileState) : [],
		},
		resources: {
			instructions,
			managedAgents,
			projectedSkills,
			localExtensions,
			themes,
			dependencies,
			packages,
			mitsupi,
			handoff,
			herdr,
		},
		criteria: {
			launchSelection: sourceInfo.wrappers[profile.name]?.boundProfile === true && providerConfigured && auth.commandSucceeded && auth.providerMatched,
			authUsable: auth.usable,
			stateOwned: stateSafe,
			resourcesSafe: instructions.safe && managedAgents.safe && projectedSkills.safe && localExtensions.safe && themes.safe && dependencies.safe && packages.safe && mitsupi.safe && handoff.safe,
			herdrCurrent: herdr.current,
			profilePass,
		},
	};
}

function statePathOwned(summary, profileRoot, name, fallbackRoot) {
	if (!summary.present) return true;
	if (name === "node_modules") return summary.safe;
	const status = pathSafety(summary.path, fallbackRoot);
	const ownerRoot = pathSafety(profileRoot, fallbackRoot).resolved || path.resolve(profileRoot);
	const resourceDirSafe = new Set(["agents", "extensions", "themes"]).has(name)
		? summary.fallbackCrossings === 0 && summary.errors === 0 && !summary.truncated
		: summary.safe;
	return resourceDirSafe && status.safe && Boolean(status.resolved) && isWithin(ownerRoot, status.resolved);
}

function stateSafeForProfile(summaries, profileRoot, fallbackRoot) {
	return summaries.every((summary) => !summary.present || statePathOwned(summary, profileRoot, path.basename(summary.path), fallbackRoot));
}

function findStateCollisions(first, second) {
	const sharedAllowed = new Set(["node_modules"]);
	const collisions = [];
	for (const name of Object.keys(first)) {
		if (sharedAllowed.has(name) || !first[name].present || !second[name]?.present) continue;
		const firstPath = pathSafety(first[name].path, "/__never_match__");
		const secondPath = pathSafety(second[name].path, "/__never_match__");
		if (firstPath.resolved && secondPath.resolved && path.resolve(firstPath.resolved) === path.resolve(secondPath.resolved)) collisions.push(name);
	}
	return collisions;
}

function shellQuote(value) {
	return `'${String(value).replaceAll("'", "'\\''")}'`;
}

function flattenCriteria(profiles, sourceInfo, fallback) {
	const profileCriteria = profiles.flatMap((profile) => Object.entries(profile.criteria).filter(([name]) => name !== "profilePass").map(([name, value]) => ({ profile: profile.name, criterion: name, pass: value })));
	const profilesIndependent = profiles.length === 2
		&& profiles.every((profile) => profile.state.crossProfileCollisions.length === 0)
		&& profiles.every((profile) => profile.criteria.stateOwned);
	const sourcePass = sourceInfo.pass;
	const profilePass = profiles.every((profile) => profile.criteria.profilePass);
	const fallbackReview = fallback.manualReviewRequired;
	return {
		profileCriteria,
		profilesIndependent,
		sourceBoundary: sourcePass,
		profilesPass: profilePass,
		fallbackReviewRequired: fallbackReview,
		allProfileAndSourceCriteria: profilePass && sourcePass,
	};
}

function main() {
	let options;
	try {
		options = parseArgs(process.argv.slice(2));
	} catch (error) {
		console.error(`pi-profile-check: ${error instanceof Error ? error.message : String(error)}`);
		process.exitCode = 2;
		return;
	}

	const fallbackRoot = path.join(options.home, ".pi", "agent");
	const fallback = fallbackInventory(fallbackRoot);
	const sourceInfo = sourceBoundary(options.repo);
	const profiles = [];
	for (const profile of PROFILES) {
		profiles.push(buildProfile(profile, options, fallbackRoot, sourceInfo, undefined));
	}
	for (let index = 0; index < profiles.length; index += 1) {
		const other = profiles[index === 0 ? 1 : 0];
		profiles[index].state.crossProfileCollisions = findStateCollisions(
			Object.fromEntries(Object.entries(profiles[index].state.paths).map(([name, value]) => [name, value])),
			Object.fromEntries(Object.entries(other.state.paths).map(([name, value]) => [name, value])),
		);
		profiles[index].criteria.stateOwned = profiles[index].criteria.stateOwned && profiles[index].state.crossProfileCollisions.length === 0;
		profiles[index].criteria.profilePass = profiles[index].criteria.profilePass && profiles[index].state.crossProfileCollisions.length === 0;
	}

	const criteria = flattenCriteria(profiles, sourceInfo, fallback);
	const blockers = [];
	for (const profile of profiles) {
		for (const item of profile.criteria ? Object.entries(profile.criteria) : []) {
			if (item[1] !== true && item[0] !== "profilePass") blockers.push(`${profile.name}:${item[0]}`);
		}
	}
	if (!sourceInfo.pass) blockers.push("source_boundary");
	if (fallback.unknownUserOwnedData) blockers.push("fallback:unknown_user_owned");
	if (fallback.manualReviewRequired && !fallback.unknownUserOwnedData) blockers.push("fallback:manual_review");
	const profileAndSourcePass = criteria.allProfileAndSourceCriteria;
	const status = !profileAndSourcePass ? "blocked" : fallback.manualReviewRequired ? "manual_review" : "pass";
	const output = {
		schema: "pi-profile-boundary/v1",
		mode: "read_only",
		paidCalls: false,
		home: options.home,
		fallback,
		profiles,
		sourceBoundary: sourceInfo,
		criteria,
		deletion: {
			safe: status === "pass",
			status,
			manualCommand: `rm -rf -- ${shellQuote(fallbackRoot)}`,
			automationPerformed: false,
			backupPerformed: false,
			migrationPerformed: false,
		},
		blockers: [...new Set(blockers)],
	};
	console.log(JSON.stringify(output, null, options.pretty ? 2 : 0));
	if (status !== "pass") process.exitCode = 1;
}

main();
