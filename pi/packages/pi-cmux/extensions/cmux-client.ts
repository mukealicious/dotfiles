/**
 * cmux socket client — persistent connection to the cmux Unix domain socket.
 * Speaks v2 newline-delimited JSON protocol.
 *
 * Gracefully degrades: if CMUX_SOCKET_PATH is unset or the socket is
 * unreachable, v2 requests return null. Structured cmux API failures are
 * preserved as `{ ok: false, error }` responses instead of being flattened.
 */

import * as net from "node:net";
import * as crypto from "node:crypto";

export interface CmuxErrorPayload {
  code: string;
  message: string;
  data?: any;
}

export type CmuxRequestResult<T = any> =
  | { ok: true; result: T }
  | { ok: false; error: CmuxErrorPayload };

interface RequestOptions {
  timeoutMs?: number;
}

interface PendingRequest {
  resolve: (value: CmuxRequestResult | null) => void;
  timer: ReturnType<typeof setTimeout>;
}

interface PendingV1 {
  resolve: (value: string | null) => void;
  timer: ReturnType<typeof setTimeout>;
}

function normalizeCmuxError(error: any): CmuxErrorPayload {
  if (typeof error === "string") {
    return { code: "cmux_error", message: error };
  }

  const code = typeof error?.code === "string" && error.code.trim()
    ? error.code
    : "cmux_error";
  const message = typeof error?.message === "string" && error.message.trim()
    ? error.message
    : "unknown error";

  const normalized: CmuxErrorPayload = { code, message };
  if (error && typeof error === "object" && "data" in error && error.data !== undefined) {
    normalized.data = error.data;
  }
  return normalized;
}

export class CmuxClient {
  private socket: net.Socket | null = null;
  private pending = new Map<string, PendingRequest>();
  private pendingV1: PendingV1[] = [];
  private buffer = "";
  private socketPath: string | undefined;
  private connecting = false;
  private verbose: boolean;

  constructor() {
    this.socketPath = process.env.CMUX_SOCKET_PATH;
    this.verbose = process.env.PI_CMUX_VERBOSE === "1";
  }

  /** True if CMUX_SOCKET_PATH is set (cmux might be available). */
  get available(): boolean {
    return !!this.socketPath && process.env.PI_CMUX_DISABLE !== "1";
  }

  /** True if we have an active socket connection. */
  isConnected(): boolean {
    return this.socket !== null && !this.socket.destroyed;
  }

  /** Connect to the cmux socket. Returns true on success. */
  async connect(): Promise<boolean> {
    if (!this.available) return false;
    if (this.isConnected()) return true;
    if (this.connecting) return false;

    this.connecting = true;

    try {
      return await new Promise<boolean>((resolve) => {
        const sock = net.createConnection(this.socketPath!, () => {
          this.socket = sock;
          // The timeout below is only for the initial connect. Once connected,
          // keep the socket alive between prompts.
          sock.setTimeout(0);
          this.connecting = false;
          if (this.verbose) console.error("[pi-cmux] connected");
          resolve(true);
        });

        sock.on("data", (data) => this.onData(data));

        sock.on("error", (err) => {
          if (this.verbose) console.error("[pi-cmux] socket error:", err.message);
          this.connecting = false;
          this.cleanup();
          resolve(false);
        });

        sock.on("close", () => {
          if (this.verbose) console.error("[pi-cmux] socket closed");
          this.cleanup();
        });

        // Connection timeout (disabled after connect)
        sock.setTimeout(3000, () => {
          if (this.verbose) console.error("[pi-cmux] connection timeout");
          sock.destroy();
          this.connecting = false;
          resolve(false);
        });
      });
    } catch {
      this.connecting = false;
      return false;
    }
  }

  /** Send a v2 JSON request. Returns a structured response or null on transport failure. */
  async request(
    method: string,
    params?: Record<string, any>,
    options?: RequestOptions,
  ): Promise<CmuxRequestResult | null> {
    // Auto-reconnect
    if (!this.isConnected()) {
      const ok = await this.connect();
      if (!ok) return null;
    }

    const id = crypto.randomUUID();
    const payload = JSON.stringify({ id, method, params: params ?? {} });

    if (this.verbose) console.error("[pi-cmux] ->", payload);

    return new Promise<CmuxRequestResult | null>((resolve) => {
      const timeoutMs = Math.max(1, options?.timeoutMs ?? 5000);
      const timer = setTimeout(() => {
        this.pending.delete(id);
        if (this.verbose) console.error("[pi-cmux] request timeout:", method);
        resolve(null);
      }, timeoutMs);

      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          this.pending.delete(id);
          resolve(value);
        },
        timer,
      });

      try {
        this.socket!.write(payload + "\n");
      } catch {
        this.pending.delete(id);
        clearTimeout(timer);
        resolve(null);
      }
    });
  }

  /**
   * Send a v1 raw text command (e.g. set_status, clear_status).
   * V1 commands are plain text lines that return "OK\n" or an error.
   * Returns the response string or null on failure.
   *
   * V1 responses are queued FIFO — non-JSON lines from the socket are
   * resolved in order against pending v1 commands.
   */
  async v1(command: string): Promise<string | null> {
    // Auto-reconnect
    if (!this.isConnected()) {
      const ok = await this.connect();
      if (!ok) return null;
    }

    if (this.verbose) console.error("[pi-cmux] v1 ->", command);

    return new Promise<string | null>((resolve) => {
      const timer = setTimeout(() => {
        // Remove from queue
        const idx = this.pendingV1.findIndex((p) => p.resolve === resolve);
        if (idx !== -1) this.pendingV1.splice(idx, 1);
        if (this.verbose) console.error("[pi-cmux] v1 timeout:", command);
        resolve(null);
      }, 5000);

      this.pendingV1.push({ resolve, timer });

      try {
        this.socket!.write(command + "\n");
      } catch {
        const idx = this.pendingV1.findIndex((p) => p.resolve === resolve);
        if (idx !== -1) this.pendingV1.splice(idx, 1);
        clearTimeout(timer);
        resolve(null);
      }
    });
  }

  /** Close the connection. */
  close(): void {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
    this.cleanup();
  }

  // --- internals ---

  private onData(data: Buffer): void {
    this.buffer += data.toString();
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;

      // Try JSON first (v2 response)
      if (line.trimStart().startsWith("{")) {
        try {
          const msg = JSON.parse(line);
          if (this.verbose) console.error("[pi-cmux] <-", line);

          const pending = this.pending.get(msg.id);
          if (pending) {
            if (msg.ok === false) {
              const error = normalizeCmuxError(msg.error);
              if (this.verbose) console.error("[pi-cmux] request error:", error);
              pending.resolve({ ok: false, error });
            } else {
              pending.resolve({ ok: true, result: msg.result ?? null });
            }
          }
          continue;
        } catch {
          // Fall through to v1 handling
        }
      }

      // Non-JSON line — v1 response. Resolve the oldest pending v1 command.
      if (this.verbose) console.error("[pi-cmux] v1 <-", line);
      const v1 = this.pendingV1.shift();
      if (v1) {
        clearTimeout(v1.timer);
        v1.resolve(line.trim());
      }
    }
  }

  private cleanup(): void {
    for (const [, req] of this.pending) {
      clearTimeout(req.timer);
      req.resolve(null);
    }
    this.pending.clear();
    for (const v1 of this.pendingV1) {
      clearTimeout(v1.timer);
      v1.resolve(null);
    }
    this.pendingV1 = [];
    this.buffer = "";
    this.socket = null;
  }
}
