import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

describe("published package surface", () => {
	it("does not expose removed prompt shortcuts", () => {
		const manifest = JSON.parse(fs.readFileSync(path.join(packageDir, "package.json"), "utf-8")) as {
			files?: string[];
			pi?: { prompts?: unknown };
		};
		assert.equal(manifest.pi?.prompts, undefined);
		assert.ok(!manifest.files?.some((entry) => entry.includes("prompts")));
		assert.equal(fs.existsSync(path.join(packageDir, "prompts")), false);
	});
});
