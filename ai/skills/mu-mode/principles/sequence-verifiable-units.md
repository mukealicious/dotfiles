# Sequence Work into Verifiable Units

Order work so each small coherent unit ends in a state you can check before building on it.

- Capture the known-good baseline or expected failure where it improves the proof.
- Choose the smallest unit that produces meaningful evidence, not merely the fewest changed lines.
- Make one change, run its check, and resolve failure before advancing.
- For repeated edits, verify representative and boundary cases during the run rather than only after the final batch.
- When commits or PRs are authorized, order them so each is coherent and the sequence explains the change to a reviewer.

Red-then-green tests, subtraction before reshape, baseline before treatment, and scaffold before feature are useful story shapes, not mandatory rituals. Commit and PR mechanics remain conditional on repository policy and user authority.
