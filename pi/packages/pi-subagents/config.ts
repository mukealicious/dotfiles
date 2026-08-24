import * as fs from "node:fs";
import * as path from "node:path";
import { resolveActiveProfileDir } from "./profile-paths.ts";
import type { ExtensionConfig } from "./types.ts";

export function getSubagentConfigPath(): string {
	return path.join(resolveActiveProfileDir(), "extensions", "subagent", "config.json");
}

export function loadConfig(): ExtensionConfig {
	const configPath = getSubagentConfigPath();
	try {
		if (fs.existsSync(configPath)) {
			return JSON.parse(fs.readFileSync(configPath, "utf-8")) as ExtensionConfig;
		}
	} catch (error) {
		console.error(`Failed to load subagent config from '${configPath}':`, error);
	}
	return {};
}
