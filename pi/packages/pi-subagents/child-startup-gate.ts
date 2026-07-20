const DEFAULT_STARTUP_TIMEOUT_MS = 30_000;

let startupQueue = Promise.resolve();

/**
 * Serialize only the initialization phase of child Pi processes.
 *
 * Pi's auth store is shared by sibling processes. During OAuth refresh, one
 * child can hold auth.json.lock long enough for another child's initial auth
 * read to time out and continue with an empty credential snapshot. Releasing
 * this permit on the child's first JSONL output keeps model execution parallel
 * while preventing those overlapping cold starts.
 */
export async function acquireChildStartupPermit(timeoutMs = DEFAULT_STARTUP_TIMEOUT_MS): Promise<() => void> {
	let unlock!: () => void;
	const current = new Promise<void>((resolve) => {
		unlock = resolve;
	});
	const previous = startupQueue;
	startupQueue = previous.then(() => current, () => current);
	await previous.catch(() => {});

	let released = false;
	let timer: NodeJS.Timeout | undefined;
	const release = () => {
		if (released) return;
		released = true;
		if (timer) clearTimeout(timer);
		unlock();
	};
	timer = setTimeout(release, timeoutMs);
	timer.unref?.();
	return release;
}
