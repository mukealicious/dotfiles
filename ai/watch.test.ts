import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createGitHubClient,
  createWatchReport,
  filterChangedFilesForSource,
  loadLocalArtifacts,
  parseArgs,
  parseManifestText,
  parseWatchSourcesFromFrontmatter,
  type GitHubClient,
  type ManifestSource,
} from "./watch";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));

describe("parseManifestText", () => {
  test("parses the checked-in watchlist manifest", async () => {
    const sources = parseManifestText(await Bun.file(join(repoRoot, "ai", "watchlist.toml")).text());

    expect(sources.map((source) => source.id)).toContain("pi-subagents");
    expect(sources.map((source) => source.id)).toContain("pi-openai-fast");
  });

  test("rejects a source missing path", () => {
    const text = `version = 1

[[sources]]
id = "missing-path"
repo = "owner/repo"
branch = "main"
kind = "skill"
`;

    expect(() => parseManifestText(text)).toThrow("manifest source missing-path is missing path");
  });
});

describe("parseArgs", () => {
  test("rejects option-looking source values", () => {
    expect(() => parseArgs(["--source", "--json"])).toThrow("--source requires an id");
  });

  test("rejects option-looking kind values", () => {
    expect(() => parseArgs(["--kind", "--json"])).toThrow("--kind requires a kind");
  });
});

describe("parseWatchSourcesFromFrontmatter", () => {
  test("parses a single-line watch source", () => {
    const frontmatter = `name: test-skill
description: Example skill description long enough to be realistic.
metadata:
  watch-sources: walterra/agent-tools/packages/post-mortem@abc1234
`;

    expect(parseWatchSourcesFromFrontmatter(frontmatter, "ai/skills/test-skill/SKILL.md")).toEqual([
      {
        locator: "walterra/agent-tools/packages/post-mortem@abc1234",
        repo: "walterra/agent-tools",
        path: "packages/post-mortem",
        ref: "abc1234",
      },
    ]);
  });

  test("parses a multiline watch source block", () => {
    const frontmatter = `name: test-skill
description: Example skill description long enough to be realistic.
metadata:
  watch-sources: |
    walterra/agent-tools/packages/post-mortem@abc1234
    openai/skills@main
`;

    expect(parseWatchSourcesFromFrontmatter(frontmatter, "ai/skills/test-skill/SKILL.md")).toEqual([
      {
        locator: "walterra/agent-tools/packages/post-mortem@abc1234",
        repo: "walterra/agent-tools",
        path: "packages/post-mortem",
        ref: "abc1234",
      },
      {
        locator: "openai/skills@main",
        repo: "openai/skills",
        path: "",
        ref: "main",
      },
    ]);
  });
});

describe("loadLocalArtifacts", () => {
  test("loads VENDORED_FROM sidecars as package artifacts", async () => {
    const root = mkdtempSync(join(tmpdir(), "ai-watch-"));

    try {
      mkdirSync(join(root, "pi", "packages", "pi-subagents"), { recursive: true });
      writeFileSync(
        join(root, "pi", "packages", "pi-subagents", "VENDORED_FROM.md"),
        `---
metadata:
  watch-sources: nicobailon/pi-subagents@abc1234
---

# Vendored from upstream
`,
      );

      await expect(loadLocalArtifacts(root)).resolves.toEqual([
        {
          artifact: "pi/packages/pi-subagents",
          watchSources: [
            {
              locator: "nicobailon/pi-subagents@abc1234",
              repo: "nicobailon/pi-subagents",
              path: "",
              ref: "abc1234",
            },
          ],
        },
      ]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("createWatchReport", () => {
  const manifestSources: ManifestSource[] = [
    {
      id: "post-mortem",
      repo: "walterra/agent-tools",
      path: "packages/post-mortem",
      branch: "main",
      kind: "skill",
      review: "semantic-diff",
      notes: "Shared retrospective skill source",
    },
    {
      id: "openai-skills",
      repo: "openai/skills",
      path: "",
      branch: "main",
      kind: "repo",
      review: "pattern-scan",
      notes: "General inspiration source",
    },
  ];

  const client: GitHubClient = {
    getRepoMetadata(source) {
      return {
        description: `${source.id} description`,
        htmlUrl: `https://github.com/${source.repo}`,
      };
    },
    getHeadCommit(source) {
      return {
        sha: source.id === "post-mortem" ? "head1234" : "repohead1",
        title: `${source.id} head`,
        committedAt: "2026-04-01T00:00:00Z",
      };
    },
    getLatestRelevantCommit(source, head) {
      if (!source.path) {
        return head;
      }

      return {
        sha: "path5678",
        title: `${source.id} latest relevant`,
        committedAt: "2026-03-31T00:00:00Z",
      };
    },
    compareRefs(source, fromRef, toRef) {
      expect(fromRef).toBe("pin1234");
      expect(toRef).toBe("head1234");

      return {
        changedFiles: filterChangedFilesForSource(
          [
            { filename: "packages/post-mortem/SKILL.md" },
            { filename: "packages/post-mortem/README.md" },
            { filename: "packages/other/ignore.md" },
          ],
          source,
        ),
      };
    },
  };

  test("links local artifacts and includes filtered changed files", () => {
    const report = createWatchReport({
      manifestSources,
      artifacts: [
        {
          artifact: "ai/skills/post-mortem/SKILL.md",
          watchSources: [
            {
              locator: "walterra/agent-tools/packages/post-mortem@pin1234",
              repo: "walterra/agent-tools",
              path: "packages/post-mortem",
              ref: "pin1234",
            },
          ],
        },
      ],
      client,
      options: { json: true, sourceId: null, kind: null },
      manifest: "ai/watchlist.toml",
      generatedAt: "2026-04-01T00:00:00Z",
    });

    expect(report.sources[0]?.localMatches).toEqual([
      {
        artifact: "ai/skills/post-mortem/SKILL.md",
        watchSource: "walterra/agent-tools/packages/post-mortem@pin1234",
        pinnedRef: "pin1234",
      },
    ]);

    expect(report.sources[0]?.comparison).toEqual({
      artifact: "ai/skills/post-mortem/SKILL.md",
      mode: "semantic-diff",
      fromRef: "pin1234",
      toRef: "head1234",
      changedFiles: ["README.md", "SKILL.md"],
    });
  });

  test("includes upstream context for unlinked sources", () => {
    const report = createWatchReport({
      manifestSources,
      artifacts: [],
      client,
      options: { json: true, sourceId: "openai-skills", kind: null },
      manifest: "ai/watchlist.toml",
      generatedAt: "2026-04-01T00:00:00Z",
    });

    expect(report.sources).toHaveLength(1);
    expect(report.sources[0]).toMatchObject({
      id: "openai-skills",
      description: "openai-skills description",
      htmlUrl: "https://github.com/openai/skills",
      localMatches: [],
      comparison: null,
    });
  });
});

describe("createGitHubClient", () => {
  test("encodes branch-like refs in compare URLs", () => {
    const mutableBun = Bun as typeof Bun & { spawnSync: typeof Bun.spawnSync };
    const originalSpawnSync = mutableBun.spawnSync;
    const calls: string[][] = [];

    mutableBun.spawnSync = ((args: string[]) => {
      calls.push(args);
      return {
        exitCode: 0,
        stdout: Buffer.from(JSON.stringify({ files: [] })),
        stderr: Buffer.from(""),
      };
    }) as typeof Bun.spawnSync;

    try {
      createGitHubClient(".").compareRefs(
        {
          id: "example",
          repo: "owner/repo",
          path: "",
          branch: "main",
          kind: "repo",
          review: "semantic-diff",
          notes: "Example",
        },
        "feature/foo",
        "release/bar",
      );
    } finally {
      mutableBun.spawnSync = originalSpawnSync;
    }

    expect(calls[0]?.[2]).toBe("repos/owner/repo/compare/feature%2Ffoo...release%2Fbar");
  });
});

describe("upstream-review skill", () => {
  test("documents the required rubric and read-only workflow", async () => {
    const text = await Bun.file(new URL("./skills/upstream-review/SKILL.md", import.meta.url)).text();

    expect(text).toContain("bin/ai-watch --json");
    expect(text).toContain("Adopt now");
    expect(text).toContain("Worth adapting");
    expect(text).toContain("Interesting, not now");
    expect(text).toContain("Skip");
    expect(text).toContain("Risk notes");
    expect(text).toContain("Do not edit files");
  });
});
