import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { acceptConnection, createConnection, focusEndpoint, readConnection, readDestination } from "../../lib/handoff-connections.ts";

test("connections retain immutable origins and idempotent destination acknowledgements", () => {
	const dir = mkdtempSync(join(tmpdir(), "handoff-links-"));
	try {
		const source = { sessionFile: join(dir, "source.jsonl"), entryId: "source-branch", name: "Design work", pane: "w1:p1" };
		writeFileSync(source.sessionFile, "source must remain unchanged");
		const path = createConnection(source, "Extension check");
		const before = readFileSync(path, "utf8");
		assert.deepEqual(readConnection(path).source, source);
		assert.equal(readDestination(path), undefined);
		assert.throws(() => acceptConnection(path, source), /Local handoffs use \/tree/);
		assert.equal(readDestination(path), undefined);
		const destination = { sessionFile: join(dir, "destination.jsonl"), entryId: "first-turn", name: "Extension check" };
		acceptConnection(path, destination);
		acceptConnection(path, { ...destination, entryId: "later-turn" });
		assert.deepEqual(readDestination(path), destination, "repeat acceptance retains the original destination anchor");
		assert.equal(readFileSync(path, "utf8"), before);
		assert.equal(readFileSync(source.sessionFile, "utf8"), "source must remain unchanged");
		assert.throws(() => acceptConnection(path, { ...destination, sessionFile: join(dir, "different.jsonl") }), /another session/);
		const retry = createConnection(source, "Extension check (retry)");
		assert.notEqual(readConnection(path).id, readConnection(retry).id);
		const secondOrigin = createConnection({ ...source, entryId: "another-origin" }, "Combined work");
		acceptConnection(secondOrigin, destination);
		assert.equal(readDestination(secondOrigin)?.sessionFile, destination.sessionFile);
	} finally { rmSync(dir, { recursive: true, force: true }); }
});

test("Herdr navigation focuses only a verified Pi session and never launches or submits text", async () => {
	const target = { sessionFile: "/tmp/source.jsonl", entryId: "branch-a", name: "Source", pane: "w1:p1" };
	for (const scenario of ["matching", "reused", "closed", "focus-failed"]) {
		const calls: string[][] = [];
		const pi = { exec: async (command: string, args: string[]) => {
			calls.push([command, ...args]);
			const code = scenario === "closed" || (scenario === "focus-failed" && args[1] === "focus") ? 1 : 0;
			return { code, killed: false, stderr: "", stdout: JSON.stringify({ result: { agent: { agent: "pi", agent_session: { value: scenario === "reused" ? "/tmp/other.jsonl" : target.sessionFile } } } }) };
		} };
		if (scenario === "matching") await focusEndpoint(pi, target);
		else await assert.rejects(() => focusEndpoint(pi, target), /unavailable|different session|could not focus/);
		assert.deepEqual(calls[0], ["herdr", "agent", "get", "w1:p1"]);
		assert.equal(calls.length, ["matching", "focus-failed"].includes(scenario) ? 2 : 1);
		if (calls[1]) assert.deepEqual(calls[1], ["herdr", "agent", "focus", "w1:p1"]);
	}
});

test("missing, invalid and corrupted connection records fail explicitly", () => {
	const dir = mkdtempSync(join(tmpdir(), "handoff-links-"));
	try {
		assert.throws(() => readConnection("relative.json"), /absolute/);
		const path = join(dir, "invalid.json");
		writeFileSync(path, "{}");
		assert.throws(() => readConnection(path), /Invalid/);
		assert.throws(() => readConnection(join(dir, "missing.json")), /ENOENT/);
		const valid = createConnection({ sessionFile: join(dir, "source.jsonl"), entryId: "a", name: "Source" }, "Test");
		writeFileSync(`${valid}.accepted.json`, "{}");
		assert.throws(() => readDestination(valid), /Invalid/);
		assert.throws(() => acceptConnection(valid, { sessionFile: join(dir, "target.jsonl"), entryId: "b", name: "Target" }), /Invalid/);
	} finally { rmSync(dir, { recursive: true, force: true }); }
});
