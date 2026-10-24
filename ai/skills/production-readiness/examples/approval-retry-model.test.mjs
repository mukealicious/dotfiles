import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import {
  initialApprovalWorkflow, approvalWorkflowTransitions,
  approvalWorkflowViolations, checkApprovalWorkflow,
} from './approval-retry-model.mjs';

const mutations = [
  ['unsafe-retry', 'AtMostOneEffect'],
  ['unsafe-approval', 'ApprovedPayloadOnly'],
  ['unsafe-success', 'SuccessRequiresEffect'],
];

for (const maxAttempts of [1, 2, 3, 4]) {
  test(`corrected graph satisfies safety with ${maxAttempts} attempts`, () => {
    const result = checkApprovalWorkflow('corrected', maxAttempts);
    assert.deepEqual(result.counterexamples, {});
    for (const witness of ['success-payload-0', 'success-payload-1', 'budget-exhausted',
      'interrupted-before-effect', 'interrupted-after-effect']) {
      assert.ok(result.coverage.includes(witness), witness);
    }
    if (maxAttempts > 1) {
      assert.ok(result.coverage.includes('remote-deduplication'));
      assert.ok(result.coverage.includes('late-delivery-after-success'));
    }
  });
}

for (const [variant, invariant] of mutations) {
  test(`${variant} fails ${invariant} with a replayable counterexample`, () => {
    const result = checkApprovalWorkflow(variant);
    assert.deepEqual(Object.keys(result.counterexamples), [invariant]);
    const trace = result.counterexamples[invariant];
    assert.deepEqual(trace[0].state, initialApprovalWorkflow());
    for (let index = 1; index < trace.length; index++) {
      assert.ok(approvalWorkflowTransitions(trace[index - 1].state, variant, 3)
        .some(step => step.action === trace[index].action &&
          JSON.stringify(step.state) === JSON.stringify(trace[index].state)));
    }
    assert.ok(approvalWorkflowViolations(trace.at(-1).state).includes(invariant));
  });
}

test('late original delivery still occurs after a retry records success', () => {
  const actions = ['Approve current payload', 'Dispatch approved operation',
    'Interrupt local worker', 'Retry interrupted operation', 'Remote commits attempt 2',
    'Record success', 'Remote commits attempt 1'];
  for (const variant of ['corrected', 'unsafe-retry']) {
    let state = initialApprovalWorkflow();
    for (const action of actions) {
      const step = approvalWorkflowTransitions(state, variant, 3)
        .find(item => item.action.startsWith(action));
      assert.ok(step, `${variant}: ${action}`);
      state = step.state;
    }
    assert.equal(state.phase, 'done');
    assert.equal(state.effects, variant === 'corrected' ? 1 : 2);
  }
});

test('lost acknowledgement after a committed effect does not authorize a second effect', () => {
  const actions = ['Approve current payload', 'Dispatch approved operation',
    'Remote commits attempt 1', 'Interrupt local worker', 'Retry interrupted operation',
    'Remote commits attempt 2'];
  for (const variant of ['corrected', 'unsafe-retry']) {
    let state = initialApprovalWorkflow();
    for (const action of actions) {
      const step = approvalWorkflowTransitions(state, variant, 3)
        .find(item => item.action.startsWith(action));
      assert.ok(step, `${variant}: ${action}`);
      state = step.state;
    }
    assert.equal(state.effects, variant === 'corrected' ? 1 : 2);
  }
});

test('editing an approved payload removes current authority', () => {
  let state = initialApprovalWorkflow();
  for (const action of ['Approve current payload', 'Edit payload']) {
    state = approvalWorkflowTransitions(state, 'corrected', 3).find(step => step.action === action).state;
  }
  assert.equal(state.approved, null);
  assert.equal(state.phase, 'draft');
  assert.ok(!approvalWorkflowTransitions(state, 'corrected', 3)
    .some(step => step.action === 'Dispatch approved operation'));
});

test('recorded packet matches the current model and its counterexamples', () => {
  const packet = JSON.parse(readFileSync(new URL('./approval-retry-results.json', import.meta.url), 'utf8'));
  assert.deepEqual(packet.bounds, [1, 2, 3, 4].map(bound => checkApprovalWorkflow('corrected', bound)));
  assert.deepEqual(packet.mutations, mutations.map(([variant]) => checkApprovalWorkflow(variant)));
});

test('invalid variants and bounds fail rather than silently passing', () => {
  assert.throws(() => checkApprovalWorkflow('typo'), /unknown variant/);
  for (const bound of [0, 5, 1.5, NaN]) {
    assert.throws(() => checkApprovalWorkflow('corrected', bound), /maxAttempts/);
  }
});

test('CLI returns nonzero for an unsafe graph and zero for the corrected graph', () => {
  for (const [variant, status] of [['corrected', 0], ['unsafe-retry', 1]]) {
    const process = spawnSync(globalThis.process.execPath,
      [new URL('./approval-retry-model.mjs', import.meta.url).pathname, variant], { encoding: 'utf8' });
    assert.equal(process.status, status, process.stderr);
    assert.equal(JSON.parse(process.stdout).variant, variant);
  }
});
