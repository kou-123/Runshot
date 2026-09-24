import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { redactEnv, redactText } from "./redact.js";
import { createRun, updateMeta } from "./store.js";

export async function runCommand(options) {
  const {
    command,
    cwd = process.cwd(),
    env = process.env,
    inheritStdio = true,
  } = options;

  if (!command || command.length === 0) {
    throw new Error("No command provided. Usage: runshot -- <command...>");
  }

  const startedAt = new Date();
  const id = `${startedAt.toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
  const { keys } = redactEnv(env);

  const meta = {
    id,
    command,
    cwd,
    startedAt: startedAt.toISOString(),
    status: "running",
    envKeys: keys,
  };

  const handle = await createRun(meta);
  const t0 = Date.now();

  handle.appendEvent({
    t: 0,
    kind: "system",
    text: `Starting: ${command.map(shellQuote).join(" ")}`,
  });
  handle.appendEvent({
    t: 0,
    kind: "system",
    text: `cwd: ${cwd}`,
  });

  const child = spawn(command[0], command.slice(1), {
    cwd,
    env,
    shell: false,
    stdio: ["inherit", "pipe", "pipe"],
  });

  meta.pid = child.pid;
  await updateMeta(id, { pid: child.pid });

  const pipe = (kind, stream) => {
    if (!stream) return;
    stream.setEncoding("utf8");
    stream.on("data", (chunk) => {
      const text = redactText(chunk);
      handle.appendEvent({ t: Date.now() - t0, kind, text });
      if (inheritStdio) {
        const out = kind === "stdout" ? process.stdout : process.stderr;
        out.write(chunk);
      }
    });
  };

  pipe("stdout", child.stdout);
  pipe("stderr", child.stderr);

  return new Promise((resolve) => {
    child.on("error", async (err) => {
      const endedAt = new Date();
      handle.appendEvent({
        t: Date.now() - t0,
        kind: "system",
        text: `Failed to spawn: ${err.message}`,
      });
      await handle.closeEvents();
      const final = await updateMeta(id, {
        endedAt: endedAt.toISOString(),
        durationMs: endedAt.getTime() - startedAt.getTime(),
        exitCode: 1,
        status: "failed",
      });
      resolve(final);
    });

    child.on("close", async (code, signal) => {
      const endedAt = new Date();
      const status = signal ? "killed" : code === 0 ? "passed" : "failed";
      handle.appendEvent({
        t: Date.now() - t0,
        kind: "system",
        text: signal
          ? `Process killed by signal ${signal}`
          : `Process exited with code ${code}`,
      });
      await handle.closeEvents();
      const final = await updateMeta(id, {
        endedAt: endedAt.toISOString(),
        durationMs: endedAt.getTime() - startedAt.getTime(),
        exitCode: code,
        signal,
        status,
      });
      resolve(final);
    });
  });
}

function shellQuote(arg) {
  if (/^[A-Za-z0-9_./:@=-]+$/.test(arg)) return arg;
  return `'${arg.replace(/'/g, `'\\''`)}'`;
}
