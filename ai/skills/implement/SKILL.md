---
name: implement
description: Implement an approved piece of work from a spec or ticket in the current session. Use when the user explicitly invokes implementation after approving the work.
disable-model-invocation: true
user-invocable: true
metadata:
  watch-sources: dmmulroy/.dotfiles/home/.agents/skills/implement@f9f7aa1a3638d6bfb6fa0b94fd110185534a2895
---

# Implement

This skill is manual-only. Run it in the current session after the user has
approved the governing spec or ticket.

1. Validate the approved spec or ticket against the current checkout before
   editing. Surface missing approval, contradictory requirements, or scope drift.
2. Implement small checked slices at agreed behavioral seams. Use the `tdd`
   skill where useful; run focused tests and typechecks throughout, then the
   relevant full validation at the end.
3. Stay in this session. Do not automatically delegate, create a generic plan,
   or write progress/context/plan artifacts unless the approved work explicitly
   requires one. Invoke the `code-review` skill only when proportional review
   would help; review remains advisory and read-only.
4. Never commit, push, or create a PR unless the user separately requests that
   exact action. Report changed paths, validation, and remaining risks honestly.
