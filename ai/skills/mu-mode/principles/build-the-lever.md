# Build the Lever

When repetition, risk, or auditability warrants it, build the smallest deterministic tool that does or proves the work.

- Learn the recipe on one unit before automating it.
- Prefer a codemod or script for repeated edits, a generator for repeated artifacts, and a rerunnable check for verification.
- Make the lever safe to rerun and easy for a reviewer to inspect.
- Prefer one deterministic tool over many workers hand-applying the same recipe.
- Keep shared worker contracts outside workers' write scope when delegation is used.
- Preserve the lever when the work will recur; discard one-off scaffolding that has no ongoing value.

Do not automate by reflex. A few obvious, low-risk edits may be clearer by hand. The lever must cost less than the uncertainty or repetition it removes, and it must not become a framework.
