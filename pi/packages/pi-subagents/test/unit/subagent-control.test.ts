import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	buildControlEvent,
	claimControlNotification,
	controlNotificationKey,
	deriveActivityState,
	formatControlIntercomMessage,
	formatControlNoticeMessage,
	resolveControlConfig,
	shouldEmitControlEvent,
	shouldNotifyControlEvent,
} from "../../subagent-control.ts";

const config = resolveControlConfig(undefined, {
	needsAttentionAfterMs: 300,
});

describe("subagent control attention state", () => {
	it("marks a run as needing attention only after the idle threshold", () => {
		assert.equal(deriveActivityState({ config, startedAt: 0, lastActivityAt: 0, now: 50 }), undefined);
		assert.equal(deriveActivityState({ config, startedAt: 0, lastActivityAt: 0, now: 400 }), "needs_attention");
		assert.equal(deriveActivityState({ config, startedAt: 0, now: 400 }), "needs_attention");
	});

	it("emits only needs-attention transitions", () => {
		assert.equal(shouldEmitControlEvent(config, undefined, undefined), false);
		assert.equal(shouldEmitControlEvent(config, undefined, "needs_attention"), true);
		assert.equal(shouldEmitControlEvent(config, "needs_attention", "needs_attention"), false);
		assert.equal(shouldEmitControlEvent(config, "needs_attention", undefined), false);
	});

	it("builds compact needs-attention control events", () => {
		const event = buildControlEvent({
			to: "needs_attention",
			runId: "run-1",
			agent: "worker",
			index: 2,
			ts: 1_000,
			lastActivityAt: 100,
		});
		assert.deepEqual(event, {
			type: "needs_attention",
			from: undefined,
			to: "needs_attention",
			ts: 1_000,
			runId: "run-1",
			agent: "worker",
			index: 2,
			message: "worker needs attention (no observed activity for 0s)",
		});
	});

	it("defaults notifications to needs attention", () => {
		const event = buildControlEvent({ to: "needs_attention", runId: "run-1", agent: "worker" });
		assert.equal(shouldNotifyControlEvent(config, event), true);
		assert.deepEqual(config.notifyOn, ["needs_attention"]);
		assert.deepEqual(config.notifyChannels, ["event", "async", "intercom"]);
	});

	it("resolves custom notification config", () => {
		const custom = resolveControlConfig(undefined, {
			needsAttentionAfterMs: 1234,
			notifyOn: ["needs_attention", "nope" as never],
			notifyChannels: ["event", "intercom", "bad" as never],
		});
		assert.equal(custom.needsAttentionAfterMs, 1234);
		assert.deepEqual(custom.notifyOn, ["needs_attention"]);
		assert.deepEqual(custom.notifyChannels, ["event", "intercom"]);
	});

	it("falls back to defaults for invalid non-empty notification arrays", () => {
		const custom = resolveControlConfig(undefined, {
			notifyOn: ["bogus" as never],
			notifyChannels: ["bogus" as never],
		});
		assert.deepEqual(custom.notifyOn, ["needs_attention"]);
		assert.deepEqual(custom.notifyChannels, ["event", "async", "intercom"]);
	});

	it("allows empty notification arrays to disable notifications", () => {
		const custom = resolveControlConfig(undefined, {
			notifyOn: [],
			notifyChannels: [],
		});
		const event = buildControlEvent({ to: "needs_attention", runId: "run-1", agent: "worker" });
		assert.deepEqual(custom.notifyOn, []);
		assert.deepEqual(custom.notifyChannels, []);
		assert.equal(shouldNotifyControlEvent(custom, event), false);
	});

	it("formats control notices with a proactive hint and concrete commands", () => {
		const event = buildControlEvent({ to: "needs_attention", runId: "78f659a3", agent: "worker" });

		const message = formatControlNoticeMessage(event, "subagent-worker-78f659a3");

		assert.match(message, /Subagent needs attention: worker/);
		assert.match(message, /Hint: Inspect status first unless the run is clearly blocked/);
		assert.match(message, /Nudge: intercom\(\{ action: "send", to: "subagent-worker-78f659a3"/);
		assert.match(message, /Status: subagent\(\{ action: "status", id: "78f659a3" \}\)/);
		assert.match(message, /Interrupt: subagent\(\{ action: "interrupt", id: "78f659a3" \}\)/);
		assert.doesNotMatch(message, /Wait:/);
	});

	it("formats intercom notifications with the same control commands", () => {
		const event = buildControlEvent({ to: "needs_attention", runId: "78f659a3", agent: "worker" });

		const message = formatControlIntercomMessage(event, "subagent-worker-78f659a3");

		assert.match(message, /worker needs attention in run 78f659a3/);
		assert.match(message, /Nudge: intercom\(\{ action: "send", to: "subagent-worker-78f659a3"/);
	});

	it("dedupes notifications once per child target and attention state", () => {
		const event = buildControlEvent({ to: "needs_attention", runId: "run-1", agent: "worker", index: 0 });
		const seen = new Set<string>();

		assert.equal(controlNotificationKey(event, "subagent-worker-run-1-1"), "subagent-worker-run-1-1:needs_attention");
		assert.equal(claimControlNotification(resolveControlConfig(), event, seen, "subagent-worker-run-1-1"), true);
		assert.equal(claimControlNotification(resolveControlConfig(), event, seen, "subagent-worker-run-1-1"), false);
	});
});
