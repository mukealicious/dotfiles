import { readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

export const VALID_KINDS = new Set(["skill", "repo", "docs", "topic", "package", "other"]);
export const DEFAULT_REVIEW_MODE = "semantic-diff";

export type WatchOptions = {
  json: boolean;
  sourceId: string | null;
  kind: string | null;
};

export type ManifestSource = {
  id: string;
  repo: string;
  path: string;
  branch: string;
  kind: string;
  review: string;
  notes: string;
};

export type WatchLocator = {
  locator: string;
  repo: string;
  path: string;
  ref: string;
};

export type Artifact = {
  artifact: string;
  watchSources: WatchLocator[];
};

export type CommitInfo = {
  sha: string;
  title: string;
  committedAt: string;
};

export type LocalMatch = {
  artifact: string;
  watchSource: string;
  pinnedRef: string;
};

export type Comparison = {
  artifact: string;
  mode: string;
  fromRef: string;
  toRef: string;
  changedFiles: string[];
};

export type WatchReportSource = ManifestSource & {
  description: string;
  htmlUrl: string;
  head: CommitInfo;
  latestRelevant: CommitInfo | null;
  localMatches: LocalMatch[];
  comparison: Comparison | null;
  comparisons: Comparison[];
};

export type WatchReport = {
  generatedAt: string;
  manifest: string;
  sources: WatchReportSource[];
};

export type GitHubClient = {
  getRepoMetadata(source: ManifestSource): { description: string; htmlUrl: string };
  getHeadCommit(source: ManifestSource): CommitInfo;
  getLatestRelevantCommit(source: ManifestSource, head: CommitInfo): CommitInfo | null;
  compareRefs(source: ManifestSource, fromRef: string, toRef: string): { changedFiles: string[] };
};

const scriptPath = fileURLToPath(import.meta.url);
export const defaultDotfilesRoot = dirname(dirname(scriptPath));
export const defaultManifestPath = join(defaultDotfilesRoot, "ai", "watchlist.toml");

export function normalizePath(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/^\/+|\/+$/g, "");
}

function stripQuotes(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function leadingIndent(line: string) {
  const match = line.match(/^[ \t]*/);
  return match ? match[0].length : 0;
}

export function parseWatchLocator(value: string, artifactPath: string): WatchLocator {
  const atIndex = value.lastIndexOf("@");
  if (atIndex <= 0 || atIndex === value.length - 1) {
    throw new Error(`${artifactPath}: malformed watch source locator: ${value}`);
  }

  const location = value.slice(0, atIndex).trim();
  const ref = value.slice(atIndex + 1).trim();
  const segments = location.split("/").filter(Boolean);

  if (segments.length < 2) {
    throw new Error(`${artifactPath}: watch source must start with owner/repo: ${value}`);
  }

  const repo = `${segments[0]}/${segments[1]}`;
  const path = normalizePath(segments.slice(2).join("/"));

  if (!/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(repo)) {
    throw new Error(`${artifactPath}: invalid repo in watch source locator: ${value}`);
  }

  if (!ref) {
    throw new Error(`${artifactPath}: watch source ref is required: ${value}`);
  }

  return {
    locator: value,
    repo,
    path,
    ref,
  };
}

export function extractFrontmatter(text: string) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  return match ? match[1] : null;
}

export function parseWatchSourcesFromFrontmatter(frontmatter: string, artifactPath: string) {
  const lines = frontmatter.split(/\r?\n/);
  let inMetadata = false;
  let metadataIndent = -1;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    const indent = leadingIndent(line);

    if (!inMetadata) {
      if (trimmed === "metadata:") {
        inMetadata = true;
        metadataIndent = indent;
      }
      continue;
    }

    if (trimmed !== "" && indent <= metadataIndent) {
      inMetadata = false;
      index -= 1;
      continue;
    }

    const watchMatch = line.match(/^(\s*)watch-sources:\s*(.*)$/);
    if (!watchMatch) {
      continue;
    }

    const keyIndent = watchMatch[1].length;
    const rawValue = watchMatch[2].trim();

    if (!rawValue) {
      throw new Error(`${artifactPath}: metadata.watch-sources must be a string or block scalar`);
    }

    if (rawValue === "|") {
      const values: string[] = [];

      for (let blockIndex = index + 1; blockIndex < lines.length; blockIndex += 1) {
        const blockLine = lines[blockIndex];
        const blockTrimmed = blockLine.trim();
        const blockIndent = leadingIndent(blockLine);

        if (blockTrimmed !== "" && blockIndent <= keyIndent) {
          index = blockIndex - 1;
          break;
        }

        if (blockTrimmed === "") {
          continue;
        }

        values.push(blockLine.slice(Math.min(blockIndent, keyIndent + 2)).trim());

        if (blockIndex === lines.length - 1) {
          index = blockIndex;
        }
      }

      if (values.length === 0) {
        throw new Error(`${artifactPath}: metadata.watch-sources block must contain at least one locator`);
      }

      return values.map((value) => parseWatchLocator(value, artifactPath));
    }

    return [parseWatchLocator(stripQuotes(rawValue), artifactPath)];
  }

  return [];
}

export function parseManifestText(text: string) {
  let parsed: Record<string, unknown>;
  try {
    parsed = Bun.TOML.parse(text) as Record<string, unknown>;
  } catch (error) {
    throw new Error(`invalid manifest TOML: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (parsed.version !== 1) {
    throw new Error(`unsupported manifest version: ${String(parsed.version)}`);
  }

  if (!Array.isArray(parsed.sources)) {
    throw new Error("manifest must contain a sources array");
  }

  const seenIds = new Set<string>();
  return parsed.sources.map((rawSource, index) => {
    if (!rawSource || typeof rawSource !== "object") {
      throw new Error(`manifest source #${index + 1} must be a table`);
    }

    const source = rawSource as Record<string, unknown>;
    const rawPath = source.path;
    const normalized: ManifestSource = {
      id: typeof source.id === "string" ? source.id.trim() : "",
      repo: typeof source.repo === "string" ? source.repo.trim() : "",
      path: typeof rawPath === "string" ? normalizePath(rawPath) : "",
      branch: typeof source.branch === "string" ? source.branch.trim() : "",
      kind: typeof source.kind === "string" ? source.kind.trim() : "",
      review: typeof source.review === "string" ? source.review.trim() : DEFAULT_REVIEW_MODE,
      notes: typeof source.notes === "string" ? source.notes.trim() : "",
    };

    if (!normalized.id) {
      throw new Error(`manifest source #${index + 1} is missing id`);
    }

    if (seenIds.has(normalized.id)) {
      throw new Error(`duplicate manifest source id: ${normalized.id}`);
    }
    seenIds.add(normalized.id);

    if (!/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(normalized.repo)) {
      throw new Error(`manifest source ${normalized.id} has invalid repo: ${normalized.repo}`);
    }

    if (typeof rawPath !== "string") {
      throw new Error(`manifest source ${normalized.id} is missing path`);
    }

    if (!normalized.branch) {
      throw new Error(`manifest source ${normalized.id} is missing branch`);
    }

    if (!VALID_KINDS.has(normalized.kind)) {
      throw new Error(`manifest source ${normalized.id} has invalid kind: ${normalized.kind}`);
    }

    return normalized;
  });
}

function walkSkillFiles(rootDir: string) {
  const skillFiles: string[] = [];

  function walk(currentDir: string) {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      const absolutePath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(absolutePath);
        continue;
      }

      if (entry.isFile() && entry.name === "SKILL.md") {
        skillFiles.push(absolutePath);
      }
    }
  }

  walk(rootDir);
  return skillFiles.sort();
}

export async function loadLocalArtifacts(dotfilesRoot: string, directories?: string[]) {
  const artifactFiles: string[] = [];
  const searchDirectories = directories || [join(dotfilesRoot, "ai", "skills"), join(dotfilesRoot, "claude", "skills")];

  for (const directory of searchDirectories) {
    try {
      artifactFiles.push(...walkSkillFiles(directory));
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  const artifacts: Artifact[] = [];
  for (const artifactFile of artifactFiles) {
    const text = await Bun.file(artifactFile).text();
    const frontmatter = extractFrontmatter(text);
    if (!frontmatter) {
      continue;
    }

    const artifactPath = relative(dotfilesRoot, artifactFile);
    const watchSources = parseWatchSourcesFromFrontmatter(frontmatter, artifactPath);
    if (watchSources.length > 0) {
      artifacts.push({ artifact: artifactPath, watchSources });
    }
  }

  return artifacts;
}

function trimCommitTitle(message: string | undefined) {
  return (message || "").split(/\r?\n/, 1)[0].trim();
}

function sourceUrl(source: ManifestSource) {
  if (!source.path) {
    return `https://github.com/${source.repo}/tree/${source.branch}`;
  }

  return `https://github.com/${source.repo}/tree/${source.branch}/${source.path}`;
}

export function filterChangedFilesForSource(files: Array<{ filename: string }>, source: ManifestSource) {
  const prefix = source.path ? `${source.path}/` : "";

  return files
    .map((file) => file.filename)
    .filter((filename) => !prefix || filename === source.path || filename.startsWith(prefix))
    .map((filename) => (prefix && filename.startsWith(prefix) ? filename.slice(prefix.length) : filename))
    .sort();
}

export function findLocalMatches(source: ManifestSource, artifacts: Artifact[]) {
  const matches: LocalMatch[] = [];

  for (const artifact of artifacts) {
    for (const watchSource of artifact.watchSources) {
      if (watchSource.repo === source.repo && watchSource.path === source.path) {
        matches.push({
          artifact: artifact.artifact,
          watchSource: watchSource.locator,
          pinnedRef: watchSource.ref,
        });
      }
    }
  }

  return matches;
}

function runJsonCommand(dotfilesRoot: string, args: string[], context: string) {
  const proc = Bun.spawnSync(args, {
    cwd: dotfilesRoot,
    stdout: "pipe",
    stderr: "pipe",
  });

  if (proc.exitCode !== 0) {
    const stderr = proc.stderr.toString().trim();
    throw new Error(`${context}: ${stderr || `command exited with ${proc.exitCode}`}`);
  }

  return JSON.parse(proc.stdout.toString());
}

export function createGitHubClient(dotfilesRoot: string): GitHubClient {
  return {
    getRepoMetadata(source) {
      const repoData = runJsonCommand(
        dotfilesRoot,
        ["gh", "api", `repos/${source.repo}`],
        `${source.id}: failed to fetch repo metadata`,
      );

      if (source.path) {
        runJsonCommand(
          dotfilesRoot,
          ["gh", "api", `repos/${source.repo}/contents/${source.path}?ref=${encodeURIComponent(source.branch)}`],
          `${source.id}: failed to fetch watched path metadata`,
        );
      }

      return {
        description: repoData.description || "",
        htmlUrl: sourceUrl(source),
      };
    },

    getHeadCommit(source) {
      const commit = runJsonCommand(
        dotfilesRoot,
        ["gh", "api", `repos/${source.repo}/commits/${source.branch}`],
        `${source.id}: failed to fetch branch head`,
      );

      return {
        sha: commit.sha,
        title: trimCommitTitle(commit.commit?.message),
        committedAt: commit.commit?.committer?.date || "",
      };
    },

    getLatestRelevantCommit(source, head) {
      if (!source.path) {
        return head;
      }

      const commits = runJsonCommand(
        dotfilesRoot,
        ["gh", "api", `repos/${source.repo}/commits?sha=${encodeURIComponent(source.branch)}&path=${source.path}&per_page=1`],
        `${source.id}: failed to fetch latest relevant commit`,
      );

      const latest = Array.isArray(commits) ? commits[0] : null;
      if (!latest) {
        return null;
      }

      return {
        sha: latest.sha,
        title: trimCommitTitle(latest.commit?.message),
        committedAt: latest.commit?.committer?.date || "",
      };
    },

    compareRefs(source, fromRef, toRef) {
      const compare = runJsonCommand(
        dotfilesRoot,
        ["gh", "api", `repos/${source.repo}/compare/${fromRef}...${toRef}`],
        `${source.id}: failed to compare ${fromRef}...${toRef}`,
      );

      return {
        changedFiles: filterChangedFilesForSource(Array.isArray(compare.files) ? compare.files : [], source),
      };
    },
  };
}

export function parseArgs(argv: string[]): WatchOptions {
  const options: WatchOptions = {
    json: false,
    sourceId: null,
    kind: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case "--json":
        options.json = true;
        break;
      case "--source": {
        const value = argv[index + 1];
        if (!value) {
          throw new Error("--source requires an id");
        }
        options.sourceId = value;
        index += 1;
        break;
      }
      case "--kind": {
        const value = argv[index + 1];
        if (!value) {
          throw new Error("--kind requires a kind");
        }
        options.kind = value;
        index += 1;
        break;
      }
      case "-h":
      case "--help":
        console.log("Usage: bin/ai-watch [--json] [--source <id>] [--kind <kind>]");
        process.exit(0);
      default:
        throw new Error(`unknown argument: ${arg}`);
    }
  }

  if (options.kind && !VALID_KINDS.has(options.kind)) {
    throw new Error(`invalid kind: ${options.kind}`);
  }

  return options;
}

export function createWatchReport({
  manifestSources,
  artifacts,
  client,
  options,
  manifest,
  generatedAt,
}: {
  manifestSources: ManifestSource[];
  artifacts: Artifact[];
  client: GitHubClient;
  options: WatchOptions;
  manifest: string;
  generatedAt?: string;
}): WatchReport {
  let filteredSources = manifestSources;

  if (options.sourceId) {
    filteredSources = filteredSources.filter((source) => source.id === options.sourceId);
    if (filteredSources.length === 0) {
      throw new Error(`source not found: ${options.sourceId}`);
    }
  }

  if (options.kind) {
    filteredSources = filteredSources.filter((source) => source.kind === options.kind);
  }

  return {
    generatedAt: generatedAt || new Date().toISOString(),
    manifest,
    sources: filteredSources.map((source) => {
      const metadata = client.getRepoMetadata(source);
      const head = client.getHeadCommit(source);
      const latestRelevant = client.getLatestRelevantCommit(source, head);
      const localMatches = findLocalMatches(source, artifacts);
      const comparisons = localMatches.map((match) => ({
        artifact: match.artifact,
        mode: source.review || DEFAULT_REVIEW_MODE,
        fromRef: match.pinnedRef,
        toRef: head.sha,
        changedFiles: client.compareRefs(source, match.pinnedRef, head.sha).changedFiles,
      }));

      return {
        ...source,
        description: metadata.description,
        htmlUrl: metadata.htmlUrl,
        head,
        latestRelevant,
        localMatches,
        comparison: comparisons[0] || null,
        comparisons,
      };
    }),
  };
}

export function renderMarkdown(report: WatchReport) {
  const lines = [
    "# Watch Report",
    "",
    `Generated: ${report.generatedAt}`,
    `Manifest: \`${report.manifest}\``,
  ];

  if (report.sources.length === 0) {
    lines.push("", "No sources matched the requested filters.");
    return lines.join("\n");
  }

  for (const source of report.sources) {
    lines.push("", `## ${source.id}`, "");
    lines.push(`- Source: \`${source.repo}${source.path ? `/${source.path}` : ""}\``);
    lines.push(`- Kind: \`${source.kind}\``);
    lines.push(`- Review: \`${source.review}\``);
    lines.push(`- Head: \`${source.head.sha.slice(0, 7)}\` ${source.head.title}`);

    if (source.latestRelevant && source.latestRelevant.sha !== source.head.sha) {
      lines.push(`- Latest relevant: \`${source.latestRelevant.sha.slice(0, 7)}\` ${source.latestRelevant.title}`);
    }

    lines.push(`- URL: ${source.htmlUrl}`);

    if (source.notes) {
      lines.push(`- Notes: ${source.notes}`);
    }

    if (source.localMatches.length === 0) {
      lines.push("- Local matches: none");
      continue;
    }

    lines.push(`- Local matches: ${source.localMatches.length}`);

    for (const comparison of source.comparisons) {
      const changedFiles = comparison.changedFiles.length > 0 ? comparison.changedFiles.join(", ") : "none";
      lines.push(`- ${comparison.artifact} pinned to \`${comparison.fromRef}\`; relevant changed files: ${changedFiles}`);
    }
  }

  return lines.join("\n");
}

export async function runAiWatch({
  argv,
  dotfilesRoot = defaultDotfilesRoot,
  manifestPath = defaultManifestPath,
}: {
  argv: string[];
  dotfilesRoot?: string;
  manifestPath?: string;
}) {
  try {
    const options = parseArgs(argv);
    const manifestFile = Bun.file(manifestPath);

    if (!(await manifestFile.exists())) {
      throw new Error(`missing manifest: ${relative(dotfilesRoot, manifestPath)}`);
    }

    const manifestSources = parseManifestText(await manifestFile.text());
    const artifacts = await loadLocalArtifacts(dotfilesRoot);
    const report = createWatchReport({
      manifestSources,
      artifacts,
      client: createGitHubClient(dotfilesRoot),
      options,
      manifest: relative(dotfilesRoot, manifestPath),
    });

    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    console.log(renderMarkdown(report));
  } catch (error) {
    console.error(`ai-watch: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
