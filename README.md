# Runshot

**Snapshot what your command really did.**

Runshot is a **zero-dependency Node.js CLI** for **local command observability**: wrap any shell command, capture **stdout / stderr / exit code / duration**, open a **local timeline UI**, and export a **shareable single-file HTML report**.

```bash
npx runshot -- npm test
```

Useful when you need a lightweight alternative to scrolling terminal buffers, digging through noisy CI logs, or setting up heavy SaaS tracing just to debug a failed script.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)
[![Zero dependencies](https://img.shields.io/badge/deps-0-blue)](package.json)

**Languages:** English · [简体中文](./README.zh-CN.md)

---

## Features

- **Wrap any command** — tests, builds, Python scripts, Make targets, one-liners
- **Local timeline UI** — filter by stdout / stderr / system events in the browser
- **HTML report export** — drop into GitHub Issues, PRs, or READMEs
- **Headless / CI mode** — `--no-open --no-server` for pipelines
- **Privacy-minded** — redacts common token / secret patterns from captured streams
- **Zero npm dependencies** — only Node.js 20+

Keywords: `cli`, `command runner`, `log viewer`, `devtools`, `debugging`, `observability`, `timeline`, `stdout`, `stderr`, `html report`, `local-first`, `nodejs`

---

## Why Runshot?

| Problem | What Runshot does |
|--------|-------------------|
| Terminal scrollback is gone | Persists timestamped stdout/stderr locally |
| CI logs are huge and hard to share | Exports one HTML file you can attach or open |
| Full APM / SaaS tracing is overkill | Local-first, no account, one command |
| `tee` / redirect only saves text | Adds timing, status, and a visual timeline |

---

## Install

```bash
# one-shot (no install)
npx runshot -- <command>

# or install globally
npm i -g runshot
```

Requires **Node.js 20+**.

---

## Quick start

```bash
# Capture a command and open the UI
runshot -- npm test
runshot -- python train.py
runshot -- make build
runshot -- node scripts/migrate.js

# Re-open the latest run
runshot open

# Export a shareable HTML report
runshot report
runshot report -o ./run-report.html

# List recent runs
runshot list

# Headless (CI-friendly)
runshot --no-open --no-server -- npm test
```

Runs are stored under `~/.runshot/runs/` (override with `RUNSHOT_HOME`).

---

## Demo (headless)

```bash
runshot --no-open --no-server -- node -e "console.log('hello'); console.error('oops'); process.exit(1)"
runshot report -o ./demo-report.html
open ./demo-report.html   # macOS; use xdg-open on Linux
```

---

## CLI reference

```text
runshot [--no-open] [--no-server] [--port <n>] -- <command...>
runshot open [id] [--port <n>] [--no-open]
runshot report [id] [-o|--out <path>]
runshot list
runshot help
runshot version
```

| Flag | Meaning |
|------|---------|
| `--no-open` | Do not open the browser |
| `--no-server` | Do not start the local UI server |
| `--port <n>` | Bind UI server to a fixed port |
| `-o, --out` | Output path for HTML report |

---

## How it works

1. Spawns your command and streams stdout/stderr with relative timestamps  
2. Writes run metadata + events under `~/.runshot/`  
3. Serves a small local web UI (filterable event feed)  
4. Can render the same data as a portable HTML report  

No cloud, no signup, no telemetry.

---

## Use cases

- Debug flaky `npm test` / `pytest` / `cargo test` runs locally  
- Share a failed build with teammates as one HTML file  
- Keep a short history of important CLI runs on your machine  
- Attach run reports to GitHub Issues or internal docs  
- Light local observability without OpenTelemetry / Datadog / LangSmith  

---

## Development

```bash
git clone https://github.com/kou-123/Runshot.git
cd Runshot
npm run test:smoke
node src/cli.js -- echo hello
node src/cli.js open --no-open --port 3920
```

Project layout:

```text
src/     CLI, runner, store, local server, HTML report
web/     Local timeline UI (vanilla HTML/CSS/JS)
```

---

## Roadmap

- [ ] Python / Node span SDK for function-level traces  
- [ ] GitHub Action that uploads HTML reports as CI artifacts  
- [ ] Optional “why did this fail?” hints on top of captured timelines  

---

## Contributing

Issues and PRs are welcome. For bugs, include the command you ran and (if possible) a `runshot report` HTML snippet with secrets removed.

---

## License

MIT © [kou-123](https://github.com/kou-123)