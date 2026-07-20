import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { acquireChildStartupPermit } from "../../child-startup-gate.ts";

describe("child startup gate", () => {
	it("queues sibling startups until the active child reports readiness", async () => {
		const releaseFirst = await acquireChildStartupPermit();
		let secondAcquired = false;
		const second = acquireChildStartupPermit().then((release) => {
			secondAcquired = true;
			return release;
		});

		await new Promise((resolve) => setTimeout(resolve, 20));
		assert.equal(secondAcquired, false);

		releaseFirst();
		const releaseSecond = await second;
		assert.equal(secondAcquired, true);
		releaseSecond();
	});

	it("automatically releases a child that never reports readiness", async () => {
		await acquireChildStartupPermit(20);
		const releaseSecond = await acquireChildStartupPermit();
		releaseSecond();
	});
});
