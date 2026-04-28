import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	buildSubagentResultIntercomPayload,
	formatSubagentResultReceipt,
	resolveSubagentResultStatus,
	stripDetailsOutputsForIntercomReceipt,
} from "../../result-intercom.ts";

describe("result intercom formatter", () => {
	it("builds one grouped intercom payload with status counts and child sections", () => {
		const payload = buildSubagentResultIntercomPayload({
			to: "subagent-chat-main",
			runId: "run-123",
			mode: "chain",
			source: "foreground",
			chainSteps: 4,
			children: [
				{
					agent: "reviewer-a",
					status: "completed",
					summary: "Completed checks",
					artifactPath: "/tmp/a.md",
					sessionPath: "/tmp/a-session.jsonl",
					intercomTarget: "subagent-reviewer-a-run-123-1",
				},
				{
					agent: "reviewer-b",
					status: "failed",
					summary: "Failed checks",
					artifactPath: "/tmp/b.md",
				},
			],
		});

		assert.equal(payload.status, "failed");
		assert.equal(payload.summary, "1 completed, 1 failed");
		assert.equal(payload.children.length, 2);
		assert.match(payload.message, /^subagent results/m);
		assert.match(payload.message, /Run: run-123/);
		assert.match(payload.message, /Mode: chain/);
		assert.match(payload.message, /Status: failed/);
		assert.match(payload.message, /Children: 1 completed, 1 failed/);
		assert.match(payload.message, /Chain steps: 4/);
		assert.match(payload.message, /For clarification, message a listed subagent at its Intercom target\./);
		assert.match(payload.message, /1\. reviewer-a — completed/);
		assert.match(payload.message, /Intercom target: subagent-reviewer-a-run-123-1/);
		assert.match(payload.message, /2\. reviewer-b — failed/);
		assert.match(payload.message, /Output artifact: \/tmp\/a\.md/);
		assert.match(payload.message, /Session: \/tmp\/a-session\.jsonl/);
	});

	it("keeps full child summaries inside grouped payloads", () => {
		const longSummary = `${"x".repeat(2000)}\n${"y".repeat(2000)}`;
		const payload = buildSubagentResultIntercomPayload({
			to: "chat",
			runId: "run-bound",
			mode: "single",
			source: "foreground",
			children: [{ agent: "worker", status: "completed", summary: longSummary }],
		});
		assert.equal(payload.children[0]!.summary, longSummary);
		assert.match(payload.message, new RegExp(`${"x".repeat(2000)}\\n${"y".repeat(2000)}`));
	});

	it("formats compact grouped receipts with artifacts and sessions", () => {
		const payload = buildSubagentResultIntercomPayload({
			to: "chat",
			runId: "run-abc",
			mode: "parallel",
			source: "foreground",
			children: [
				{ agent: "a", status: "completed", summary: "done", artifactPath: "/tmp/a.md", intercomTarget: "subagent-a-run-abc-1" },
				{ agent: "b", status: "failed", summary: "failed", sessionPath: "/tmp/b.jsonl" },
			],
		});
		const receipt = formatSubagentResultReceipt({
			mode: "parallel",
			runId: "run-abc",
			payload,
		});

		assert.match(receipt, /Delivered parallel subagent results via intercom\./);
		assert.match(receipt, /Children: 1 completed, 1 failed/);
		assert.match(receipt, /Artifacts:\n- a \[completed\]: \/tmp\/a\.md/);
		assert.match(receipt, /Intercom targets:\n- a \[completed\]: subagent-a-run-abc-1/);
		assert.match(receipt, /Sessions:\n- b \[failed\]: \/tmp\/b\.jsonl/);
		assert.match(receipt, /Full grouped output was sent over intercom\./);
	});

	it("strips heavy output fields from receipt details", () => {
		const stripped = stripDetailsOutputsForIntercomReceipt({
			mode: "single",
			results: [{
				agent: "worker",
				task: "Task",
				exitCode: 0,
				messages: [{ role: "assistant", content: [{ type: "text", text: "full" }] } as never],
				usage: { input: 1, output: 1, cacheRead: 0, cacheWrite: 0, cost: 0, turns: 1 },
				finalOutput: "full output",
				truncation: { text: "truncated", truncated: true },
			}],
		});
		assert.equal(stripped.results[0]?.messages, undefined);
		assert.equal(stripped.results[0]?.finalOutput, undefined);
		assert.equal(stripped.results[0]?.truncation, undefined);
	});

	it("resolves paused and detached statuses", () => {
		assert.equal(resolveSubagentResultStatus({ interrupted: true }), "paused");
		assert.equal(resolveSubagentResultStatus({ detached: true }), "detached");
		assert.equal(resolveSubagentResultStatus({ success: true }), "completed");
		assert.equal(resolveSubagentResultStatus({ exitCode: 1 }), "failed");
	});
});
