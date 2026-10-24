import { pathToFileURL } from 'node:url';

const variants = ['corrected', 'unsafe-retry', 'unsafe-approval', 'unsafe-success'];

/** Initial state for one operation, two payload revisions, and a durable approval. */
export function initialApprovalWorkflow() {
  return {
    phase: 'draft', request: 0, approved: null, payload: null,
    attempts: [], acceptedKeys: [], effects: 0, unauthorizedDispatch: false,
  };
}

/** Enumerate atomic steps; remote delivery can continue after local interruption or success. */
export function approvalWorkflowTransitions(state, variant, maxAttempts) {
  const steps = [];
  const add = (action, changes) => steps.push({ action, state: { ...state, ...changes } });
  const keyFor = (index) => variant === 'unsafe-retry' ? `attempt-${index}` : 'operation-1';
  const attempt = (index) => ({ key: keyFor(index), status: 'pending' });

  if (state.phase === 'draft' || state.phase === 'ready') {
    const stale = variant === 'unsafe-approval' && state.phase === 'ready';
    add('Edit payload', {
      request: 1 - state.request,
      phase: stale ? 'ready' : 'draft',
      approved: stale ? state.approved : null,
    });
  }
  if (state.phase === 'draft') {
    add('Approve current payload', { phase: 'ready', approved: state.request });
  }
  if (state.phase === 'ready' && (state.approved === state.request ||
      (variant === 'unsafe-approval' && state.approved !== null))) {
    add('Dispatch approved operation', {
      phase: 'inflight', payload: state.request, attempts: [attempt(1)],
      unauthorizedDispatch: state.approved !== state.request,
    });
  }
  if (state.phase === 'inflight') {
    add('Interrupt local worker', { phase: 'uncertain' });
    const latest = state.attempts.at(-1);
    if (latest.status === 'committed' || variant === 'unsafe-success') {
      add('Record success', { phase: 'done' });
    }
    if (latest.status === 'dropped') {
      add('Observe transport failure', { phase: 'uncertain' });
    }
  }
  if (state.phase === 'uncertain') {
    if (state.attempts.length < maxAttempts) {
      add('Retry interrupted operation', {
        phase: 'inflight', attempts: [...state.attempts, attempt(state.attempts.length + 1)],
      });
    } else {
      add('Stop with unresolved outcome', { phase: 'unresolved' });
    }
  }
  for (const [index, entry] of state.attempts.entries()) {
    if (entry.status !== 'pending') continue;
    const updated = (status) => state.attempts.map((item, i) => i === index ? { ...item, status } : item);
    // Atomic remote contract: record the key and apply the effect together.
    // No local completion flag substitutes for this provider-side contract.
    const seen = state.acceptedKeys.includes(entry.key);
    add(`Remote commits attempt ${index + 1}${seen ? ' (deduplicated)' : ''}`, {
      attempts: updated('committed'), effects: state.effects + (seen ? 0 : 1),
      acceptedKeys: seen ? state.acceptedKeys : [...state.acceptedKeys, entry.key].sort(),
    });
    add(`Remote drops attempt ${index + 1}`, { attempts: updated('dropped') });
  }
  return steps;
}

/** Safety predicates, including an observer for approval at dispatch time. */
export function approvalWorkflowViolations(state) {
  const failures = [];
  if (state.effects > 1) failures.push('AtMostOneEffect');
  if (state.unauthorizedDispatch) failures.push('ApprovedPayloadOnly');
  if (state.phase === 'done' && state.effects === 0) failures.push('SuccessRequiresEffect');
  return failures;
}

/** Exhaust the finite reachable graph with BFS; retain a shortest trace per violated predicate. */
export function checkApprovalWorkflow(variant = 'corrected', maxAttempts = 3) {
  if (!variants.includes(variant)) throw new Error(`Approval model unknown variant: ${variant}`);
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 4) {
    throw new Error('Approval model maxAttempts must be an integer from 1 to 4');
  }
  const initial = initialApprovalWorkflow();
  const nodes = [{ state: initial, parent: -1, action: 'Initial' }];
  const visited = new Map([[JSON.stringify(initial), 0]]);
  const counterexamples = {};
  const coverage = new Set();
  let transitions = 0;
  const traceTo = (index) => {
    const trace = [];
    while (index !== -1) {
      const node = nodes[index];
      trace.push({ action: node.action, state: node.state });
      index = node.parent;
    }
    return trace.reverse();
  };
  for (let index = 0; index < nodes.length; index++) {
    const state = nodes[index].state;
    if (state.phase === 'done') coverage.add(`success-payload-${state.payload}`);
    if (state.phase === 'unresolved') coverage.add('budget-exhausted');
    if (state.phase === 'uncertain' && state.effects > 0) coverage.add('interrupted-after-effect');
    if (state.phase === 'uncertain' && state.effects === 0) coverage.add('interrupted-before-effect');
    for (const name of approvalWorkflowViolations(state)) {
      if (!counterexamples[name]) counterexamples[name] = traceTo(index);
    }
    for (const step of approvalWorkflowTransitions(state, variant, maxAttempts)) {
      transitions++;
      if (step.action.endsWith('(deduplicated)')) coverage.add('remote-deduplication');
      if (step.action.startsWith('Remote commits') && state.phase === 'done') coverage.add('late-delivery-after-success');
      const key = JSON.stringify(step.state);
      if (!visited.has(key)) {
        visited.set(key, nodes.length);
        nodes.push({ ...step, parent: index });
      }
    }
  }
  return {
    variant, maxAttempts, states: nodes.length, transitions,
    coverage: [...coverage].sort(), counterexamples,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (args.length > 2) throw new Error('Approval model usage: node approval-retry-model.mjs [variant] [maxAttempts]');
  const result = checkApprovalWorkflow(args[0] ?? 'corrected', args[1] === undefined ? 3 : Number(args[1]));
  console.log(JSON.stringify(result, null, 2));
  if (Object.keys(result.counterexamples).length) process.exitCode = 1;
}
