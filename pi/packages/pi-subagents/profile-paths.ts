import { createHash } from "node:crypto";
import * as os from "node:os";
import * as path from "node:path";

export interface ProfilePathOptions {
	env?: NodeJS.ProcessEnv;
	getuid?: (() => number) | undefined;
	userInfo?: (() => { username?: string | null }) | undefined;
	homedir?: (() => string) | undefined;
	tmpdir?: (() => string) | undefined;
}

function sanitizeScopeSegment(value: string): string {
	const sanitized = value
		.trim()
		.replace(/[^A-Za-z0-9._-]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return sanitized || "unknown";
}

export function resolveActiveProfileDir(options?: ProfilePathOptions): string {
	const env = options?.env ?? process.env;
	if (env.PI_CODING_AGENT_DIR) return env.PI_CODING_AGENT_DIR;

	const homedir = options && Object.hasOwn(options, "homedir")
		? options.homedir
		: os.homedir;
	return path.join(homedir?.() ?? env.HOME ?? env.USERPROFILE ?? "", ".pi", "agent");
}

export function resolveTempScopeId(options?: ProfilePathOptions): string {
	const env = options?.env ?? process.env;
	const getuid = options && Object.hasOwn(options, "getuid")
		? options.getuid
		: process.getuid?.bind(process);
	if (typeof getuid === "function") {
		return `uid-${getuid()}`;
	}

	for (const key of ["USERNAME", "USER", "LOGNAME"] as const) {
		const value = env[key];
		if (value) return `user-${sanitizeScopeSegment(value)}`;
	}

	const userInfo = options && Object.hasOwn(options, "userInfo")
		? options.userInfo
		: os.userInfo;
	try {
		const username = userInfo?.().username;
		if (username) return `user-${sanitizeScopeSegment(username)}`;
	} catch {
		// Fall through to home-directory-based scoping.
	}

	const home = env.USERPROFILE ?? env.HOME;
	if (home) return `home-${sanitizeScopeSegment(home)}`;

	const homedir = options && Object.hasOwn(options, "homedir")
		? options.homedir
		: os.homedir;
	try {
		const fallbackHome = homedir?.();
		if (fallbackHome) return `home-${sanitizeScopeSegment(fallbackHome)}`;
	} catch {
		// Fall through to the last-resort shared scope.
	}

	return "shared";
}

export function resolveProfileTempScopeId(options?: ProfilePathOptions): string {
	const profileDir = path.resolve(resolveActiveProfileDir(options));
	const profileName = sanitizeScopeSegment(path.basename(profileDir));
	const profileHash = createHash("sha256").update(profileDir).digest("hex").slice(0, 12);
	return `${resolveTempScopeId(options)}-${profileName}-${profileHash}`;
}

export function resolveProfileTempRoot(options?: ProfilePathOptions): string {
	const tmpdir = options && Object.hasOwn(options, "tmpdir")
		? options.tmpdir
		: os.tmpdir;
	return path.join(tmpdir?.() ?? os.tmpdir(), `pi-subagents-${resolveProfileTempScopeId(options)}`);
}
