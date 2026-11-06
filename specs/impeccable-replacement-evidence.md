# Impeccable replacement evidence register

Prepared on 2026-11-05 for the [implementation plan](impeccable-replacement-plan.md). This register records evidence, not permission to implement.

## Source conversation and later reports

Pocket session `68484` was read through read-only SQLite records. The database was not changed. Entry IDs identify the original messages in that session.

The full user/assistant discussion contains the initial investigation, 2 early security reports, the upstream discussion, the Emil comparison, and the later pstack discussion. The source session ends with assistant entry `70192` at this inspection.

| Entry | Report | Provenance and scope |
|---|---|---|
| `68812` | `audit-architecture` | Independent source review. Confirms source-level security concerns and preserves runtime uncertainty. |
| `68933` | `upstream-comparison` | Contains an initial and repeated completed report. Recommends narrow backports under the earlier repair framing. |
| `69334` | `design-coverage` | Local design capability inventory. Emil coverage was explicitly unverified by this reviewer. |
| `69648` | `emil-safety-fit` | Reviews supplied Emil snapshot `c8a79627b59d72d764d6ab6f2c87c09a48169833`. Reports source-based safety and portability limits. |
| `70170` | `pstack-simplification` | Reviews selected pstack cache at `2776ddd2355d6d6c8747d3964600f28daf62f049`. Rejects its operating layer; adapts prototype and evaluation methods. |

The 3 later reports are not files under the initial Impeccable cache. Their canonical locations are these Pocket entries. Their SHA-256 values cover the exact UTF-8 message content, including the subagent delivery prefix:

```text
69334  0ad75b4450217f5cc8daa5c6ffd8b993f7bfa60ef90726564155020b39be9165
69648  9807dbe8a9b6c63e3b75649de82abbd23fea945820e2819f7be52bc196bf939b
70170  7fe8b5abadb52cdffb55f60dd927107c5f99f6145a4b123521751b89d4dc7afc
```

### Later report conclusions retained

**Design coverage:** preserve critique vocabulary, proportional context, and demonstrated product-UX gaps. Existing specialists do not replace general design judgment. Remove incorrect accessibility claims and universal taste rules. Do not preserve aliases or live tooling as design requirements.

**Emil safety/fit:** the snapshot has 33 files, including 17 skills. It ships no standalone executable, package manifest, lockfile, installer, server, or symlink. Markdown still contains executable examples. The picker uses local DOM events and a URL parameter, not a filesystem bridge. Its invalid-selection fallback and modifier handling need correction. Prototype routes do not enforce deployment exclusion or prevent live mutations. Instructions can still cause installation, LAN exposure, or unsafe generated code. The report is not a safety certification.

**pstack simplification:** bounded experiments produce decisions, not necessarily production code. Evaluation separates ordinary tasks, judging criteria, and approach identity. Review transcripts and artifacts rather than self-reports. Do not adopt its mode, model rules, external-action authority, PR requirements, or duplicate principles. Its selected cache omits declared dependencies and is not a complete installable package.

## Impeccable source evidence

Cache: `~/.cache/impeccable-review-20261105/`.

Read `REVIEW.md`, `file-inventory.tsv`, `file-inventory.json`, complete local comparison diffs, and selected `security-*.diff` files when implementing a separately approved repair.

Use only `pin-verified/` and `current-verified/` for snapshot comparison. The original `opensrc 0.7.3` acquisition returned incorrect revision content. `pin-cache/` and `current-cache/` were rejected.

| Identity | Revision |
|---|---|
| Local source baseline | `0cb399a46a338c303212662afa9b1f6c56b599b3` |
| Earlier audit HEAD | `c27c238d286319d1ff450935024b13e5809df2b2` |
| Pinned Impeccable | `39bec7c08c8cb5d694221e2c2e4386140dde8759` |
| Reviewed upstream main | `8c7b98c0ae139611ffb757b1cb61d7e151a156b8` |
| Reviewed skill/CLI release 4.8.0 | `414603bf14c7a344edb466bb1f85690c77ce8b7d` |

The release date is 2026-10-26. The reviewed main date is 2026-11-05. These are recorded revisions, not floating claims about future latest versions.

Local comparison covered 54 files. Against pinned authoring source, 46 match, 7 differ, and 1 is local-only. The local-only file is `reference/critique-lenses.md`.

The 7 modified files are `SKILL.md`, `reference/critique.md`, `reference/polish.md`, `reference/teach.md`, `reference/live.md`, `scripts/cleanup-deprecated.mjs`, and `scripts/pin.mjs`.

The extra 13 differences against generated upstream are placeholder projection, not substantive customization. All live helpers match the vulnerable pin. Root `LICENSE` and `NOTICE.md` match the pinned upstream notices.

### Verification performed for this plan

The downloaded archive hashes match `archive-sha256.txt`:

```text
pin.tar.gz      237cace612b4e0c448bf30a6d821bbb06ad9837168106fe77f93841afba884eb
current.tar.gz  b3e1640a9ecf9a62c99caaee77ce5205a51787b731e99cf0d9df0f35440c57b4
```

A read-only archive comparison found no content mismatch across 1,196 pinned files and 4,467 current files. No archive code ran.

### Audit qualifications

The retained audit is `~/security-audit-skill/portfolio/run-1/REPORT.md`. Its status is partial source review with incomplete audit workflow gates.

`~/security-audit-skill/portfolio/run-1/impeccable-independent-review.md` retains `needs_validation` for command injection, file disclosure, and availability candidates.

The source session reported 14 passing JavaScript syntax checks, passing installer fixtures, identical server/poller bytes across 4 installed projections, and network-free boundary checks. Those are historical results. This planning session did not rerun them or inspect live services.

Current upstream fixes several boundaries but retains automatic CSP changes and literal-path exclusion bypasses. It adds a Rust engine, binary acquisition, changed projection input, hooks, and an Apply path that can bypass agent approvals and sandbox checks. The reviewed release lacks the launcher-cache repair on reviewed main. These facts explain why latest upstream is outside this plan.

## Emil source evidence

Repository: [emilkowalski/skills](https://github.com/emilkowalski/skills/tree/c8a79627b59d72d764d6ab6f2c87c09a48169833).

Revision: `c8a79627b59d72d764d6ab6f2c87c09a48169833`, dated 2026-11-04 in the source investigation. No GitHub releases were published at that inspection.

Cache: `~/.cache/emil-skills-review-c8a79627/skills-c8a79627b59d72d764d6ab6f2c87c09a48169833/`.

Cached archive SHA-256:

```text
4fadd7fdcecf58ebab4e6d9a4a99b870fa4f30d234a9f2dab3e1edc66849651f
```

All 33 extracted files matched this archive during planning. This confirms cache consistency. The original acquisition record supplies the upstream revision identity.

Relevant paths include `skills/emil-design-eng/SKILL.md`, `skills/animate/SKILL.md`, `skills/review-animations/SKILL.md`, and `skills/prototype/{SKILL.md,PICKER.md}`. Preserve the root MIT license when copying approved material.

Motion recommendations must be applied to the actual interaction. Reduced motion, interruption, frequency, input method, project conventions, and observed performance take precedence over mechanical timing or easing rules. Do not change a dependency merely to match an example.

## pstack source evidence

Repository and scope: [cursor/plugins, pstack](https://github.com/cursor/plugins/tree/2776ddd2355d6d6c8747d3964600f28daf62f049/pstack).

Revision: `2776ddd2355d6d6c8747d3964600f28daf62f049`.

Cache: `~/.cache/pstack-design-review-2776ddd2/`. This is a selected-file cache, not an archive-verified full repository. Its revision attribution comes from the source-session fetch records. Do not call it a verified complete snapshot.

| File under `skills/poteto-mode/playbooks/` | Cached SHA-256 |
|---|---|
| `prototype.md` | `7aa1f52c691c3d46d5afc527b23f90977fce869ce33573c73c81a4c7f0cde962` |
| `eval.md` | `a93d449a908236afa6645179651844094b1547dbab4e484cffcdda630e4b90bf` |
| `visual-parity.md` | `950ca51999a6454c98eee6bcbc3d1bbe501a4e3a5d5439b6f6ddc378991b256c` |
| `authoring-a-skill.md` | `f6a13a445c360b48d6cd72780ac01955f45b82826476efe0e67c7559329407aa` |

Before copying pstack text, verify selected bytes and the applicable license at this exact revision. Preserve notices. The existing `technical-writing` skill remains at its separate recorded revision `d1453c11d1dde9714d4c313c97d3a68432265c7f`.

## Evidence limits

This plan is a source-based synthesis, not a head-to-head output benchmark. No live helper, upstream runtime, dependency installer, browser UI test, exploit test, or service probe ran here.

The later outcome comparison and actual-browser checks are implementation gates. Missing evidence must remain visible; source coverage and installer tests do not prove design quality.
