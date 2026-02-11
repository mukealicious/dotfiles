/**
 * UV Extension — Redirects Python tooling to uv equivalents.
 *
 * Wraps the bash tool to prepend intercepted-commands/ to PATH, which
 * contains shims that intercept pip, pip3, poetry, python, and python3.
 *
 * Intercepted commands:
 * - pip/pip3: Blocked with uv add / uv run --with suggestions
 * - poetry: Blocked with uv equivalents
 * - python/python3: Redirected to uv run python (blocks -m pip and -m venv)
 *
 * Based on mitsuhiko/agent-stuff.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { createBashTool } from "@mariozechner/pi-coding-agent";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const interceptedCommandsPath = join(__dirname, "..", "intercepted-commands");

export default function (pi: ExtensionAPI) {
  const cwd = process.cwd();
  const bashTool = createBashTool(cwd, {
    commandPrefix: `export PATH="${interceptedCommandsPath}:$PATH"`,
  });

  pi.on("session_start", (_event, ctx) => {
    ctx.ui.notify("UV interceptor loaded", "info");
  });

  pi.registerTool(bashTool);
}
