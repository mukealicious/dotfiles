/**
 * Skill resolution and caching for subagent extension
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { parseFrontmatter, stripFrontmatter } from "@earendil-works/pi-coding-agent";
import { resolveActiveProfileDir } from "./profile-paths.ts";

export type SkillSource =
	| "project"
	| "user"
	| "project-package"
	| "user-package"
	| "project-settings"
	| "user-settings"
	| "extension"
	| "builtin"
	| "unknown";

export interface ResolvedSkill {
	name: string;
	path: string;
	content: string;
	source: SkillSource;
	disableModelInvocation: boolean;
	metadataValid: boolean;
}

interface SkillCacheEntry {
	mtime: number;
	skill: ResolvedSkill;
}

interface CachedSkillEntry {
	name: string;
	filePath: string;
	source: SkillSource;
	description?: string;
	disableModelInvocation: boolean;
	metadataValid: boolean;
	order: number;
}

interface SkillSearchPath {
	path: string;
	source: SkillSource;
}

const skillCache = new Map<string, SkillCacheEntry>();
const MAX_CACHE_SIZE = 50;

let loadSkillsCache: { cwd: string; profileDir: string; skills: CachedSkillEntry[]; timestamp: number } | null = null;
const LOAD_SKILLS_CACHE_TTL_MS = 5000;

const CONFIG_DIR = ".pi";
function getAgentDir(): string {
	return resolveActiveProfileDir();
}

const SOURCE_PRIORITY: Record<SkillSource, number> = {
	project: 700,
	"project-settings": 650,
	"project-package": 600,
	user: 300,
	"user-settings": 250,
	"user-package": 200,
	extension: 150,
	builtin: 100,
	unknown: 0,
};

function isWithinPath(filePath: string, dir: string): boolean {
	const relative = path.relative(dir, filePath);
	return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function readOptionalJsonFile(filePath: string, label: string): unknown {
	try {
		return JSON.parse(fs.readFileSync(filePath, "utf-8"));
	} catch (error) {
		const code = typeof error === "object" && error !== null && "code" in error
			? (error as { code?: unknown }).code
			: undefined;
		if (code === "ENOENT") return null;
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Failed to read ${label} '${filePath}': ${message}`, {
			cause: error instanceof Error ? error : undefined,
		});
	}
}

function isPackageOverridePattern(pattern: string): boolean {
	return pattern.startsWith("!") || pattern.startsWith("+") || pattern.startsWith("-");
}

function normalizePackagePattern(pattern: string): string {
	const normalized = pattern.replace(/\\/g, "/");
	return normalized.startsWith("./") ? normalized.slice(2) : normalized;
}

function escapeRegex(value: string): string {
	return value.replace(/[.+^${}()|[\]\\]/g, "\\$&");
}

/**
 * Match the small glob pattern language used by Pi package filters without
 * adding a runtime dependency to this vendored package. Pi's package manager
 * also tests the relative path, basename, and (for skills) the skill
 * directory name, so mirror those candidates below.
 */
function packagePatternRegex(pattern: string): RegExp {
	const normalized = normalizePackagePattern(pattern);
	let expression = "^";
	for (let index = 0; index < normalized.length; index++) {
		const character = normalized[index];
		if (character === "*" && normalized[index + 1] === "*") {
			if (normalized[index + 2] === "/") {
				expression += "(?:.*/)?";
				index += 2;
			} else {
				expression += ".*";
				index += 1;
			}
		} else if (character === "*") {
			expression += "[^/]*";
		} else if (character === "?") {
			expression += "[^/]";
		} else {
			expression += escapeRegex(character ?? "");
		}
	}
	return new RegExp(`${expression}$`);
}

function packageResourceCandidates(filePath: string, packageRoot: string): string[] {
	const relativePath = path.relative(packageRoot, filePath).replace(/\\/g, "/");
	const fileName = path.basename(filePath);
	const candidates = [relativePath, fileName, filePath.replace(/\\/g, "/")];

	if (fileName === "SKILL.md") {
		const skillDir = path.dirname(filePath);
		candidates.push(
			path.relative(packageRoot, skillDir).replace(/\\/g, "/"),
			path.basename(skillDir),
			skillDir.replace(/\\/g, "/"),
		);
	}

	return candidates;
}

function matchesPackagePattern(filePath: string, pattern: string, packageRoot: string, exact = false): boolean {
	const normalized = normalizePackagePattern(pattern);
	const candidates = packageResourceCandidates(filePath, packageRoot);
	if (exact) return candidates.some((candidate) => candidate === normalized);
	const matcher = packagePatternRegex(normalized);
	return candidates.some((candidate) => matcher.test(candidate));
}

function isEnabledByPackagePatterns(filePath: string, patterns: string[], packageRoot: string): boolean {
	const includes = patterns.filter((pattern) => !isPackageOverridePattern(pattern));
	const excludes = patterns.filter((pattern) => pattern.startsWith("!")).map((pattern) => pattern.slice(1));
	const forceIncludes = patterns.filter((pattern) => pattern.startsWith("+")).map((pattern) => pattern.slice(1));
	const forceExcludes = patterns.filter((pattern) => pattern.startsWith("-")).map((pattern) => pattern.slice(1));

	let enabled = includes.length === 0 || includes.some((pattern) => matchesPackagePattern(filePath, pattern, packageRoot));
	if (enabled && excludes.some((pattern) => matchesPackagePattern(filePath, pattern, packageRoot))) enabled = false;
	if (forceIncludes.some((pattern) => matchesPackagePattern(filePath, pattern, packageRoot, true))) enabled = true;
	if (forceExcludes.some((pattern) => matchesPackagePattern(filePath, pattern, packageRoot, true))) enabled = false;
	return enabled;
}

function collectPackageSkillFiles(resourcePath: string, visited = new Set<string>()): string[] {
	if (!fs.existsSync(resourcePath)) return [];

	let stat: fs.Stats;
	let realPath: string;
	try {
		stat = fs.statSync(resourcePath);
		realPath = fs.realpathSync(resourcePath);
	} catch {
		return [];
	}

	if (stat.isFile()) return resourcePath.toLowerCase().endsWith(".md") ? [path.resolve(resourcePath)] : [];
	if (!stat.isDirectory() || visited.has(realPath)) return [];
	visited.add(realPath);

	const rootSkill = path.join(resourcePath, "SKILL.md");
	if (fs.existsSync(rootSkill)) return [path.resolve(rootSkill)];

	let entries: fs.Dirent[];
	try {
		entries = fs.readdirSync(resourcePath, { withFileTypes: true });
	} catch {
		return [];
	}

	const files: string[] = [];
	for (const entry of entries) {
		if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
		const childPath = path.join(resourcePath, entry.name);
		if (entry.isDirectory() || entry.isSymbolicLink()) {
			files.push(...collectPackageSkillFiles(childPath, visited));
		} else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
			files.push(path.resolve(childPath));
		}
	}
	return files;
}

function applyPackageDelta(
	allFiles: string[],
	enabledFiles: string[],
	patterns: string[],
	packageRoot: string,
): string[] {
	const enabled = new Set(enabledFiles);
	for (const pattern of patterns) {
		const prefix = pattern[0];
		const target = prefix === "+" || prefix === "-" || prefix === "!" ? pattern.slice(1) : pattern;
		const exact = prefix === "+" || prefix === "-";
		const include = prefix !== "-" && prefix !== "!";
		for (const filePath of allFiles) {
			if (!matchesPackagePattern(filePath, target, packageRoot, exact)) continue;
			if (include) enabled.add(filePath);
			else enabled.delete(filePath);
		}
	}
	return allFiles.filter((filePath) => enabled.has(filePath));
}

function extractSkillPathsFromPackageRoot(
	packageRoot: string,
	source: SkillSource,
	userPatterns?: string[],
	deltaPatterns?: string[],
	deltaStartsDisabled = false,
): SkillSearchPath[] {
	const packageJsonPath = path.join(packageRoot, "package.json");
	const pkg = readOptionalJsonFile(packageJsonPath, "package manifest");
	if (!pkg || typeof pkg !== "object" || Array.isArray(pkg)) return [];
	const pi = (pkg as { pi?: unknown }).pi;
	if (!pi || typeof pi !== "object" || Array.isArray(pi)) return [];
	const skills = (pi as { skills?: unknown }).skills;
	if (!Array.isArray(skills)) return [];

	const manifestEntries = skills.filter((entry): entry is string => typeof entry === "string");
	const sourceEntries = manifestEntries.filter((entry) => !isPackageOverridePattern(entry));
	const manifestPatterns = manifestEntries.filter(isPackageOverridePattern);
	const allFiles = sourceEntries.flatMap((entry) => collectPackageSkillFiles(path.resolve(packageRoot, entry)));
	const manifestFiles = manifestPatterns.length === 0
		? allFiles
		: allFiles.filter((filePath) => isEnabledByPackagePatterns(filePath, manifestPatterns, packageRoot));
	let enabledFiles = deltaStartsDisabled
		? []
		: userPatterns === undefined
			? manifestFiles
			: userPatterns.length === 0
				? []
				: manifestFiles.filter((filePath) => isEnabledByPackagePatterns(filePath, userPatterns, packageRoot));
	if (deltaPatterns && deltaPatterns.length > 0) {
		enabledFiles = applyPackageDelta(manifestFiles, enabledFiles, deltaPatterns, packageRoot);
	}
	return enabledFiles.map((filePath) => ({ path: filePath, source }));
}

function collectSettingsSkillPaths(cwd: string): SkillSearchPath[] {
	const results: SkillSearchPath[] = [];
	const settingsFiles = [
		{ file: path.join(cwd, CONFIG_DIR, "settings.json"), base: path.join(cwd, CONFIG_DIR), source: "project-settings" as const },
		{ file: path.join(getAgentDir(), "settings.json"), base: getAgentDir(), source: "user-settings" as const },
	];

	for (const { file, base, source } of settingsFiles) {
		const settings = readOptionalJsonFile(file, "skills settings file");
		if (!settings || typeof settings !== "object" || Array.isArray(settings)) continue;
		const skills = (settings as { skills?: unknown }).skills;
		if (!Array.isArray(skills)) continue;
		for (const entry of skills) {
			if (typeof entry !== "string") continue;
			let resolved = entry;
			if (resolved.startsWith("~/")) {
				resolved = path.join(os.homedir(), resolved.slice(2));
			} else if (!path.isAbsolute(resolved)) {
				resolved = path.resolve(base, resolved);
			}
			results.push({ path: resolved, source });
		}
	}

	return results;
}

function isSafePackagePath(value: string): boolean {
	return value.length > 0
		&& !path.isAbsolute(value)
		&& value.split(/[\\/]/).every((part) => part.length > 0 && part !== "." && part !== "..");
}

function parseNpmPackageName(source: string): string | undefined {
	const spec = source.slice(4).trim();
	if (!spec) return undefined;
	const match = spec.match(/^(@?[^@]+(?:\/[^@]+)?)(?:@(.+))?$/);
	const packageName = match?.[1] ?? spec;
	return isSafePackagePath(packageName) ? packageName : undefined;
}

function stripGitRef(repoPath: string): string {
	const atIndex = repoPath.indexOf("@");
	const hashIndex = repoPath.indexOf("#");
	const refIndex = [atIndex, hashIndex].filter((index) => index >= 0).sort((a, b) => a - b)[0];
	return refIndex === undefined ? repoPath : repoPath.slice(0, refIndex);
}

function parseGitPackagePath(source: string): { host: string; repoPath: string } | undefined {
	const spec = source.slice(4).trim();
	if (!spec) return undefined;

	let host = "";
	let repoPath = "";
	const scpLike = spec.match(/^git@([^:]+):(.+)$/);
	if (scpLike) {
		host = scpLike[1] ?? "";
		repoPath = scpLike[2] ?? "";
	} else if (/^[a-z][a-z0-9+.-]*:\/\//i.test(spec)) {
		try {
			const url = new URL(spec);
			host = url.hostname;
			repoPath = url.pathname.replace(/^\/+/, "");
		} catch {
			return undefined;
		}
	} else {
		const slashIndex = spec.indexOf("/");
		if (slashIndex < 0) return undefined;
		host = spec.slice(0, slashIndex);
		repoPath = spec.slice(slashIndex + 1);
	}

	const normalizedPath = stripGitRef(repoPath).replace(/\.git$/, "").replace(/^\/+/, "");
	if (!host || !isSafePackagePath(host) || !isSafePackagePath(normalizedPath) || normalizedPath.split(/[\\/]/).length < 2) {
		return undefined;
	}
	return { host, repoPath: normalizedPath };
}

function resolveSettingsPackageRoot(source: string, baseDir: string): string | undefined {
	const trimmed = source.trim();
	if (!trimmed) return undefined;
	if (trimmed.startsWith("git:")) {
		const parsed = parseGitPackagePath(trimmed);
		return parsed ? path.join(baseDir, "git", parsed.host, parsed.repoPath) : undefined;
	}
	if (trimmed.startsWith("npm:")) {
		const packageName = parseNpmPackageName(trimmed);
		return packageName ? path.join(baseDir, "npm", "node_modules", packageName) : undefined;
	}
	const normalized = trimmed.startsWith("file:") ? trimmed.slice(5) : trimmed;
	if (normalized === "~") return os.homedir();
	if (normalized.startsWith("~/")) return path.join(os.homedir(), normalized.slice(2));
	if (path.isAbsolute(normalized)) return normalized;
	if (normalized === "." || normalized === ".." || normalized.startsWith("./") || normalized.startsWith("../")) {
		return path.resolve(baseDir, normalized);
	}
	return undefined;
}

function settingsPackageIdentity(source: string, baseDir: string): string | undefined {
	const trimmed = source.trim();
	if (trimmed.startsWith("npm:")) {
		const packageName = parseNpmPackageName(trimmed);
		return packageName ? `npm:${packageName}` : undefined;
	}
	if (trimmed.startsWith("git:")) {
		const parsed = parseGitPackagePath(trimmed);
		return parsed ? `git:${parsed.host}/${parsed.repoPath}` : undefined;
	}
	const packageRoot = resolveSettingsPackageRoot(trimmed, baseDir);
	return packageRoot ? `local:${path.resolve(packageRoot)}` : undefined;
}

interface SettingsPackageEntry {
	source: string;
	base: string;
	skillSource: SkillSource;
	identity: string;
	skillPatterns?: string[];
	autoloadDisabled: boolean;
}

function readSettingsPackageEntries(
	file: string,
	base: string,
	skillSource: SkillSource,
): SettingsPackageEntry[] {
	const settings = readOptionalJsonFile(file, "skills settings file");
	if (!settings || typeof settings !== "object" || Array.isArray(settings)) return [];
	const packages = (settings as { packages?: unknown }).packages;
	if (!Array.isArray(packages)) return [];

	const entries: SettingsPackageEntry[] = [];
	for (const entry of packages) {
		const source = typeof entry === "string"
			? entry
			: typeof entry === "object" && entry !== null && typeof (entry as { source?: unknown }).source === "string"
				? (entry as { source: string }).source
				: undefined;
		if (!source) continue;
		const identity = settingsPackageIdentity(source, base);
		if (!identity) continue;
		const packageSkills = typeof entry === "object" && entry !== null
			? (entry as { skills?: unknown }).skills
			: undefined;
		const skillPatterns = Array.isArray(packageSkills)
			? packageSkills.filter((pattern): pattern is string => typeof pattern === "string")
			: undefined;
		entries.push({
			source,
			base,
			skillSource,
			identity,
			skillPatterns,
			autoloadDisabled: typeof entry === "object" && entry !== null && (entry as { autoload?: unknown }).autoload === false,
		});
	}
	return entries;
}

function dedupeSettingsPackageEntries(entries: SettingsPackageEntry[]): SettingsPackageEntry[] {
	const byIdentity = new Map<string, SettingsPackageEntry>();
	for (const entry of entries) byIdentity.set(entry.identity, entry);
	return [...byIdentity.values()];
}

function collectSettingsPackageSkillPaths(cwd: string): SkillSearchPath[] {
	const projectEntries = dedupeSettingsPackageEntries(readSettingsPackageEntries(
		path.join(cwd, CONFIG_DIR, "settings.json"),
		path.join(cwd, CONFIG_DIR),
		"project-package",
	));
	const userEntries = dedupeSettingsPackageEntries(readSettingsPackageEntries(
		path.join(getAgentDir(), "settings.json"),
		getAgentDir(),
		"user-package",
	));
	const userByIdentity = new Map(userEntries.map((entry) => [entry.identity, entry]));
	const projectIdentities = new Set(projectEntries.map((entry) => entry.identity));
	const results: SkillSearchPath[] = [];

	for (const projectEntry of projectEntries) {
		const userEntry = userByIdentity.get(projectEntry.identity);
		if (projectEntry.autoloadDisabled) {
			const baseEntry = userEntry ?? projectEntry;
			const packageRoot = resolveSettingsPackageRoot(baseEntry.source, baseEntry.base);
			if (!packageRoot) continue;
			results.push(...extractSkillPathsFromPackageRoot(
				packageRoot,
				"project-package",
				userEntry?.skillPatterns,
				projectEntry.skillPatterns,
				userEntry === undefined,
			));
			continue;
		}

		const packageRoot = resolveSettingsPackageRoot(projectEntry.source, projectEntry.base);
		if (!packageRoot) continue;
		results.push(...extractSkillPathsFromPackageRoot(
			packageRoot,
			projectEntry.skillSource,
			projectEntry.skillPatterns,
		));
	}

	for (const userEntry of userEntries) {
		if (projectIdentities.has(userEntry.identity)) continue;
		const packageRoot = resolveSettingsPackageRoot(userEntry.source, userEntry.base);
		if (!packageRoot) continue;
		results.push(...extractSkillPathsFromPackageRoot(
			packageRoot,
			userEntry.skillSource,
			userEntry.skillPatterns,
		));
	}

	return results;
}

function buildSkillPaths(cwd: string): SkillSearchPath[] {
	const skillPaths: SkillSearchPath[] = [
		{ path: path.join(cwd, CONFIG_DIR, "skills"), source: "project" },
		{ path: path.join(cwd, ".agents", "skills"), source: "project" },
		{ path: path.join(getAgentDir(), "skills"), source: "user" },
		{ path: path.join(os.homedir(), ".agents", "skills"), source: "user" },
		...collectSettingsPackageSkillPaths(cwd),
		...collectSettingsSkillPaths(cwd),
	];

	const deduped = new Map<string, SkillSearchPath>();
	for (const entry of skillPaths) {
		const resolvedPath = path.resolve(entry.path);
		if (!deduped.has(resolvedPath)) {
			deduped.set(resolvedPath, { path: resolvedPath, source: entry.source });
		}
	}
	return [...deduped.values()];
}

function inferSkillSource(filePath: string, cwd: string, sourceHint?: SkillSource): SkillSource {
	if (sourceHint) return sourceHint;

	const projectConfigRoot = path.resolve(cwd, CONFIG_DIR);
	const projectSkillsRoot = path.resolve(cwd, CONFIG_DIR, "skills");
	const projectPackagesRoot = path.resolve(cwd, CONFIG_DIR, "npm", "node_modules");
	const projectAgentsRoot = path.resolve(cwd, ".agents");
	const agentDir = getAgentDir();
	const userSkillsRoot = path.resolve(agentDir, "skills");
	const userPackagesRoot = path.resolve(agentDir, "npm", "node_modules");
	const userAgentsRoot = path.resolve(os.homedir(), ".agents");

	if (isWithinPath(filePath, projectPackagesRoot)) return "project-package";
	if (isWithinPath(filePath, projectSkillsRoot) || isWithinPath(filePath, projectAgentsRoot)) return "project";
	if (isWithinPath(filePath, projectConfigRoot)) return "project-settings";

	if (isWithinPath(filePath, userPackagesRoot)) return "user-package";
	if (isWithinPath(filePath, userSkillsRoot) || isWithinPath(filePath, userAgentsRoot)) return "user";
	if (isWithinPath(filePath, agentDir)) return "user-settings";

	return "unknown";
}

function chooseHigherPrioritySkill(existing: CachedSkillEntry | undefined, candidate: CachedSkillEntry): CachedSkillEntry {
	if (!existing) return candidate;
	const existingPriority = SOURCE_PRIORITY[existing.source] ?? 0;
	const candidatePriority = SOURCE_PRIORITY[candidate.source] ?? 0;
	if (candidatePriority > existingPriority) return candidate;
	if (candidatePriority < existingPriority) return existing;
	return candidate.order < existing.order ? candidate : existing;
}

interface SkillMetadata {
	description?: string;
	disableModelInvocation: boolean;
	metadataValid: boolean;
}

function parseSkillMetadata(content: string): SkillMetadata {
	try {
		const { frontmatter } = parseFrontmatter<Record<string, unknown>>(content);
		return {
			...(typeof frontmatter.description === "string" ? { description: frontmatter.description } : {}),
			disableModelInvocation: frontmatter["disable-model-invocation"] === true,
			metadataValid: true,
		};
	} catch {
		return { disableModelInvocation: true, metadataValid: false };
	}
}

function maybeReadSkillMetadata(filePath: string): SkillMetadata {
	try {
		return parseSkillMetadata(fs.readFileSync(filePath, "utf-8"));
	} catch {
		return { disableModelInvocation: true, metadataValid: false };
	}
}

function collectFilesystemSkills(cwd: string, skillPaths: SkillSearchPath[]): CachedSkillEntry[] {
	const entries: CachedSkillEntry[] = [];
	const seen = new Set<string>();
	let order = 0;

	const pushEntry = (name: string, filePath: string, sourceHint?: SkillSource) => {
		const resolvedFile = path.resolve(filePath);
		if (seen.has(resolvedFile)) return;
		if (!fs.existsSync(resolvedFile)) return;
		seen.add(resolvedFile);
		const metadata = maybeReadSkillMetadata(resolvedFile);
		entries.push({
			name,
			filePath: resolvedFile,
			source: inferSkillSource(resolvedFile, cwd, sourceHint),
			...metadata,
			order: order++,
		});
	};

	for (const skillPath of skillPaths) {
		if (!fs.existsSync(skillPath.path)) continue;

		let stat: fs.Stats;
		try {
			stat = fs.statSync(skillPath.path);
		} catch {
			continue;
		}

		if (stat.isFile()) {
			const fileName = path.basename(skillPath.path);
			if (!fileName.toLowerCase().endsWith(".md")) continue;
			const skillName = fileName.toLowerCase() === "skill.md"
				? path.basename(path.dirname(skillPath.path))
				: path.basename(fileName, path.extname(fileName));
			pushEntry(skillName, skillPath.path, skillPath.source);
			continue;
		}

		if (!stat.isDirectory()) continue;

		const rootSkillFile = path.join(skillPath.path, "SKILL.md");
		if (fs.existsSync(rootSkillFile)) {
			pushEntry(path.basename(skillPath.path), rootSkillFile, skillPath.source);
		}

		let childEntries: fs.Dirent[];
		try {
			childEntries = fs.readdirSync(skillPath.path, { withFileTypes: true });
		} catch {
			continue;
		}

		for (const child of childEntries) {
			if (child.name.startsWith(".")) continue;
			const childPath = path.join(skillPath.path, child.name);
			if (child.isDirectory() || child.isSymbolicLink()) {
				const nestedSkillPath = path.join(childPath, "SKILL.md");
				if (fs.existsSync(nestedSkillPath)) {
					pushEntry(child.name, nestedSkillPath, skillPath.source);
				}
				continue;
			}
			if (child.isFile() && child.name.toLowerCase().endsWith(".md")) {
				pushEntry(path.basename(child.name, path.extname(child.name)), childPath, skillPath.source);
			}
		}
	}

	return entries;
}

function getCachedSkills(cwd: string): CachedSkillEntry[] {
	const now = Date.now();
	const profileDir = getAgentDir();
	if (loadSkillsCache && loadSkillsCache.cwd === cwd && loadSkillsCache.profileDir === profileDir && now - loadSkillsCache.timestamp < LOAD_SKILLS_CACHE_TTL_MS) {
		return loadSkillsCache.skills;
	}

	const skillPaths = buildSkillPaths(cwd);
	const loaded = collectFilesystemSkills(cwd, skillPaths);
	const dedupedByName = new Map<string, CachedSkillEntry>();

	for (const entry of loaded) {
		const current = dedupedByName.get(entry.name);
		dedupedByName.set(entry.name, chooseHigherPrioritySkill(current, entry));
	}

	const skills = [...dedupedByName.values()].sort((a, b) => a.order - b.order);
	loadSkillsCache = { cwd, profileDir, skills, timestamp: now };
	return skills;
}

export function resolveSkillPath(
	skillName: string,
	cwd: string,
): { path: string; source: SkillSource } | undefined {
	const skills = getCachedSkills(cwd);
	const skill = skills.find((s) => s.name === skillName);
	if (!skill) return undefined;
	return { path: skill.filePath, source: skill.source };
}

export function readSkill(
	skillName: string,
	skillPath: string,
	source: SkillSource,
): ResolvedSkill | undefined {
	try {
		const stat = fs.statSync(skillPath);
		const cached = skillCache.get(skillPath);
		if (cached && cached.mtime === stat.mtimeMs) {
			return cached.skill;
		}

		const raw = fs.readFileSync(skillPath, "utf-8");
		const metadata = parseSkillMetadata(raw);
		const skill: ResolvedSkill = {
			name: skillName,
			path: skillPath,
			content: metadata.metadataValid ? stripFrontmatter(raw).trim() : raw,
			source,
			disableModelInvocation: metadata.disableModelInvocation,
			metadataValid: metadata.metadataValid,
		};

		skillCache.set(skillPath, { mtime: stat.mtimeMs, skill });
		if (skillCache.size > MAX_CACHE_SIZE) {
			const firstKey = skillCache.keys().next().value;
			if (firstKey) skillCache.delete(firstKey);
		}

		return skill;
	} catch {
		// Treat unreadable skill files as unresolved so callers can surface as missing.
		return undefined;
	}
}

export function resolveSkills(
	skillNames: string[],
	cwd: string,
): { resolved: ResolvedSkill[]; missing: string[] } {
	const resolved: ResolvedSkill[] = [];
	const missing: string[] = [];

	for (const name of skillNames) {
		const trimmed = name.trim();
		if (!trimmed) continue;

		const location = resolveSkillPath(trimmed, cwd);
		if (!location) {
			missing.push(trimmed);
			continue;
		}

		const skill = readSkill(trimmed, location.path, location.source);
		if (skill && !skill.metadataValid) {
			throw new Error(`Skill '${trimmed}' has invalid frontmatter and cannot be injected into a subagent`);
		}
		if (skill?.disableModelInvocation) {
			throw new Error(`Skill '${trimmed}' is manual-only and cannot be injected into a subagent`);
		}
		if (skill) {
			resolved.push(skill);
		} else {
			missing.push(trimmed);
		}
	}

	return { resolved, missing };
}

export function resolveSkillsWithFallback(
	skillNames: string[],
	primaryCwd: string,
	fallbackCwd?: string,
): { resolved: ResolvedSkill[]; missing: string[] } {
	const primary = resolveSkills(skillNames, primaryCwd);
	if (!fallbackCwd || primary.missing.length === 0) return primary;
	if (path.resolve(primaryCwd) === path.resolve(fallbackCwd)) return primary;

	const fallback = resolveSkills(primary.missing, fallbackCwd);
	return {
		resolved: [...primary.resolved, ...fallback.resolved],
		missing: fallback.missing,
	};
}

export function buildSkillInjection(skills: ResolvedSkill[]): string {
	if (skills.length === 0) return "";

	return skills
		.map((s) => `<skill name="${s.name}">\n${s.content}\n</skill>`)
		.join("\n\n");
}

export function normalizeSkillInput(
	input: string | string[] | boolean | undefined,
): string[] | false | undefined {
	if (input === false) return false;
	if (input === true || input === undefined) return undefined;
	if (Array.isArray(input)) {
		return [...new Set(input.map((s) => s.trim()).filter((s) => s.length > 0))];
	}
	// Guard against JSON-encoded arrays arriving as strings (e.g. '["a","b"]').
	// Models sometimes serialise the skill parameter as a JSON string instead of
	// a native array, and naively splitting on "," would embed brackets/quotes
	// into the skill names, causing resolution to silently fail.
	const trimmed = input.trim();
	if (trimmed.startsWith("[")) {
		try {
			const parsed = JSON.parse(trimmed);
			if (Array.isArray(parsed)) {
				return normalizeSkillInput(parsed);
			}
		} catch {
			// Not valid JSON – fall through to comma-split
		}
	}
	return [...new Set(input.split(",").map((s) => s.trim()).filter((s) => s.length > 0))];
}

export function discoverAvailableSkills(cwd: string): Array<{
	name: string;
	source: SkillSource;
	description?: string;
}> {
	const skills = getCachedSkills(cwd);
	return skills
		.filter((skill) => skill.metadataValid && !skill.disableModelInvocation)
		.map((s) => ({
			name: s.name,
			source: s.source,
			description: s.description,
		}))
		.sort((a, b) => a.name.localeCompare(b.name));
}

export function clearSkillCache(): void {
	skillCache.clear();
	loadSkillsCache = null;
}
