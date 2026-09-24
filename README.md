# Runshot

**Snapshot what your command really did.**

Wrap any command. Capture stdout, stderr, timing, and exit code. Open a local timeline UI — or export a single-file HTML report you can drop into an issue or README.

```bash
npx runshot -- npm test
```

Zero npm dependencies. Node.js 20+ only.

## Why

Terminal scrollback disappears. CI logs are noisy. SaaS tracing is heavy for a script that just failed on your laptop.

Runshot is **local-first**, zero accounts, one command.

## Install

```bash
npm i -g runshot
# or without installing:
npx runshot -- <command>
```

## Usage

```bash
# Capture a command and open the UI
runshot -- npm test
runshot -- python train.py
runshot -- make build

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

Runs are stored under `~/.runshot/runs/` (override with `RUNSHOT_HOME`). Sensitive-looking env names and common token patterns are redacted from captured streams when possible.

## What you get

- Timestamped stdout / stderr / system events
- Exit code, duration, cwd
- Local web timeline (filter by stream)
- Single-file HTML report for sharing

## Demo (headless)

```bash
runshot --no-open --no-server -- node -e "console.log('hello'); console.error('oops'); process.exit(1)"
runshot report -o ./demo-report.html
open ./demo-report.html   # macOS
```

## Development

```bash
git clone <your-repo-url>
cd runshot
npm run test:smoke
node src/cli.js -- echo hello          # opens UI
node src/cli.js open --no-open --port 3920
```

## Launch checklist (for stars)

1. Create the GitHub repo and push this code
2. Add Topics: `cli`, `developer-tools`, `observability`, `nodejs`, `zero-dependency`
3. Record a 10–15s GIF: terminal command → browser timeline
4. Post Show HN / Reddit r/commandline / V2EX with the GIF
5. Follow up with a GitHub Action that uploads `runshot report` as a CI artifact

## Roadmap

- Python / Node span SDK
- GitHub Action for HTML report artifacts
- Optional “why did this fail?” on top of the captured timeline

## License

MIT
