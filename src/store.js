import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";

function storeRoot() {
  return process.env.RUNSHOT_HOME || path.join(os.homedir(), ".runshot");
}

function runsDir() {
  return path.join(storeRoot(), "runs");
}

function latestFile() {
  return path.join(storeRoot(), "latest");
}

function runDir(id) {
  return path.join(runsDir(), id);
}

export async function ensureStore() {
  await fs.mkdir(runsDir(), { recursive: true });
}

export async function createRun(meta) {
  await ensureStore();
  const dir = runDir(meta.id);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "meta.json"), JSON.stringify(meta, null, 2));
  await fs.writeFile(latestFile(), meta.id, "utf8");

  let stream = createWriteStream(path.join(dir, "events.jsonl"), { flags: "a" });

  return {
    dir,
    appendEvent(event) {
      if (!stream) return;
      stream.write(`${JSON.stringify(event)}\n`);
    },
    async closeEvents() {
      if (!stream) return;
      await new Promise((resolve, reject) => {
        stream.end(() => resolve());
        stream.on("error", reject);
      });
      stream = null;
    },
  };
}

export async function updateMeta(id, patch) {
  const file = path.join(runDir(id), "meta.json");
  const current = JSON.parse(await fs.readFile(file, "utf8"));
  const next = { ...current, ...patch };
  await fs.writeFile(file, JSON.stringify(next, null, 2));
  return next;
}

export async function getLatestId() {
  try {
    const id = (await fs.readFile(latestFile(), "utf8")).trim();
    return id || null;
  } catch {
    return null;
  }
}

export async function readMeta(id) {
  const file = path.join(runDir(id), "meta.json");
  return JSON.parse(await fs.readFile(file, "utf8"));
}

export async function readEvents(id) {
  const file = path.join(runDir(id), "events.jsonl");
  try {
    const raw = await fs.readFile(file, "utf8");
    return raw
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}

export async function listRuns(limit = 50) {
  await ensureStore();
  let entries;
  try {
    entries = await fs.readdir(runsDir());
  } catch {
    return [];
  }

  const runs = [];
  for (const id of entries) {
    try {
      const meta = await readMeta(id);
      runs.push({
        id: meta.id,
        command: meta.command,
        startedAt: meta.startedAt,
        endedAt: meta.endedAt,
        durationMs: meta.durationMs,
        exitCode: meta.exitCode,
        status: meta.status,
      });
    } catch {
      // skip corrupt runs
    }
  }

  runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  return runs.slice(0, limit);
}

export function getRunDir(id) {
  return runDir(id);
}
