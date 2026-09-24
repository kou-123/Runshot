#!/usr/bin/env node
import { spawn } from "node:child_process";
import { runCommand } from "./runner.js";
import { writeReport } from "./report.js";
import { startServer } from "./server.js";
import { getLatestId, listRuns, readMeta } from "./store.js";

const VERSION = "0.1.0";

function printHelp() {
  console.log(`runshot v${VERSION}

Snapshot what your command really did.

Usage:
  runshot [--no-open] [--no-server] [--port <n>] -- <command...>
  runshot open [id] [--port <n>] [--no-open]
  runshot report [id] [-o|--out <path>]
  runshot list
  runshot help
  runshot version

Examples:
  runshot -- npm test
  runshot --no-open --no-server -- node script.js
  runshot open
  runshot report -o ./run.html
`);
}

function parseArgs(argv) {
  const flags = {
    open: true,
    server: true,
    port: 0,
    out: null,
  };
  const positionals = [];
  let i = 0;
  while (i < argv.length) {
    const a = argv[i];
    if (a === "--") {
      positionals.push(...argv.slice(i + 1));
      break;
    }
    if (a === "--no-open") {
      flags.open = false;
      i += 1;
      continue;
    }
    if (a === "--no-server") {
      flags.server = false;
      i += 1;
      continue;
    }
    if (a === "--port") {
      flags.port = Number(argv[i + 1] || 0);
      i += 2;
      continue;
    }
    if (a === "-o" || a === "--out") {
      flags.out = argv[i + 1] || null;
      i += 2;
      continue;
    }
    if (a === "--help" || a === "-h") {
      flags.help = true;
      i += 1;
      continue;
    }
    if (a === "--version" || a === "-v") {
      flags.version = true;
      i += 1;
      continue;
    }
    positionals.push(a);
    i += 1;
  }
  return { flags, positionals };
}

async function openUrl(url) {
  const platform = process.platform;
  const cmd =
    platform === "darwin"
      ? ["open", url]
      : platform === "win32"
        ? ["cmd", "/c", "start", "", url]
        : ["xdg-open", url];
  spawn(cmd[0], cmd.slice(1), {
    stdio: "ignore",
    detached: true,
    shell: platform === "win32",
  }).unref();
}

function hang() {
  return new Promise(() => {});
}

async function serveAndOpen(runId, flags) {
  const server = await startServer(Number(flags.port) || 0);
  const url = `${server.url}/#/runs/${encodeURIComponent(runId)}`;
  console.error(`[runshot] UI ${url}`);
  if (flags.open) await openUrl(url);
  console.error("[runshot] Press Ctrl+C to stop the UI server.");
  return server;
}

async function main() {
  const { flags, positionals } = parseArgs(process.argv.slice(2));

  if (flags.help || positionals[0] === "help") {
    printHelp();
    return;
  }
  if (flags.version || positionals[0] === "version") {
    console.log(VERSION);
    return;
  }

  const sub = positionals[0];

  if (sub === "list") {
    const runs = await listRuns(30);
    if (runs.length === 0) {
      console.log("No runs yet.");
      return;
    }
    for (const r of runs) {
      const cmd = r.command.join(" ");
      console.log(
        `${r.id}  ${r.status.padEnd(7)}  exit=${String(r.exitCode ?? "-").padStart(3)}  ${String(r.durationMs ?? 0).padStart(6)}ms  ${cmd}`,
      );
    }
    return;
  }

  if (sub === "report") {
    const runId = positionals[1] || (await getLatestId());
    if (!runId) {
      console.error("[runshot] No runs found.");
      process.exitCode = 1;
      return;
    }
    const out = await writeReport(runId, flags.out);
    console.log(out);
    return;
  }

  if (sub === "open") {
    const runId = positionals[1] || (await getLatestId());
    if (!runId) {
      console.error("[runshot] No runs found. Try: runshot -- echo hello");
      process.exitCode = 1;
      return;
    }
    await readMeta(runId);
    const server = await serveAndOpen(runId, flags);
    const stop = async (code = 0) => {
      await server.close().catch(() => {});
      process.exit(code);
    };
    process.once("SIGINT", () => void stop(0));
    process.once("SIGTERM", () => void stop(0));
    await hang();
    return;
  }

  // Default: run a command
  const command = positionals;
  if (command.length === 0) {
    printHelp();
    process.exitCode = 1;
    return;
  }

  const meta = await runCommand({ command });
  console.error(
    `\n[runshot] ${meta.status} · exit ${meta.exitCode ?? "—"} · ${meta.durationMs ?? 0}ms · id ${meta.id}`,
  );
  const code = meta.exitCode ?? (meta.status === "passed" ? 0 : 1);

  if (flags.server) {
    const server = await serveAndOpen(meta.id, flags);
    const stop = async () => {
      await server.close().catch(() => {});
      process.exit(code);
    };
    process.once("SIGINT", () => void stop());
    process.once("SIGTERM", () => void stop());
    await hang();
  } else {
    process.exitCode = code;
  }
}

main().catch((err) => {
  console.error("[runshot]", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
