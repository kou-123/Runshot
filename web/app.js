function parseHash() {
  const m = location.hash.match(/#\/runs\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

function formatMs(ms) {
  if (ms === undefined) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function statusClass(status) {
  if (status === "passed") return "ok";
  if (status === "running") return "run";
  return "fail";
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const state = {
  runs: [],
  selectedId: parseHash(),
  meta: null,
  events: [],
  filter: "all",
};

const el = {
  list: document.getElementById("run-list"),
  empty: document.getElementById("empty"),
  detail: document.getElementById("detail"),
  cmd: document.getElementById("cmd"),
  pills: document.getElementById("pills"),
  toolbar: document.getElementById("toolbar"),
  feed: document.getElementById("feed"),
};

function renderList() {
  if (state.runs.length === 0) {
    el.list.innerHTML = `<p class="empty" style="margin:0.5rem">No runs yet.</p>`;
    return;
  }
  el.list.innerHTML = state.runs
    .map((r) => {
      const active = state.selectedId === r.id ? "active" : "";
      return `<button type="button" class="run-item ${active}" data-id="${escapeHtml(r.id)}">
        <div class="cmd">${escapeHtml(r.command.join(" "))}</div>
        <div class="sub"><span class="${statusClass(r.status)}">${escapeHtml(r.status)}</span><span>${formatMs(r.durationMs)}</span></div>
      </button>`;
    })
    .join("");

  el.list.querySelectorAll("button[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      location.hash = `#/runs/${encodeURIComponent(btn.dataset.id)}`;
    });
  });
}

function renderDetail() {
  if (!state.meta) {
    el.empty.hidden = false;
    el.detail.hidden = true;
    return;
  }
  el.empty.hidden = true;
  el.detail.hidden = false;
  el.cmd.textContent = state.meta.command.join(" ");
  el.pills.innerHTML = `
    <span class="pill ${statusClass(state.meta.status)}">${escapeHtml(state.meta.status)}</span>
    <span class="pill">exit ${state.meta.exitCode ?? "—"}</span>
    <span class="pill">${formatMs(state.meta.durationMs)}</span>
    <span class="pill">${state.events.length} events</span>
    <span class="pill">${escapeHtml(state.meta.cwd)}</span>
  `;

  const filters = ["all", "stdout", "stderr", "system"];
  el.toolbar.innerHTML = filters
    .map(
      (f) =>
        `<button type="button" class="${state.filter === f ? "active" : ""}" data-filter="${f}">${f}</button>`,
    )
    .join("");
  el.toolbar.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.filter = btn.dataset.filter;
      renderDetail();
    });
  });

  const visible =
    state.filter === "all"
      ? state.events
      : state.events.filter((e) => e.kind === state.filter);

  if (visible.length === 0) {
    el.feed.innerHTML = `<p class="empty" style="padding:1rem">No events for this filter.</p>`;
    return;
  }

  el.feed.innerHTML = visible
    .map(
      (e) => `<div class="line ${e.kind}">
        <span class="t">+${(e.t / 1000).toFixed(3)}s</span>
        <span class="k">${e.kind}</span>
        <pre>${escapeHtml(e.text)}</pre>
      </div>`,
    )
    .join("");
}

async function loadRuns() {
  const res = await fetch("/api/runs");
  state.runs = await res.json();
  if (!state.selectedId && state.runs[0]) {
    location.hash = `#/runs/${encodeURIComponent(state.runs[0].id)}`;
  }
  renderList();
}

async function loadRun(id) {
  if (!id) {
    state.meta = null;
    state.events = [];
    renderDetail();
    return;
  }
  const res = await fetch(`/api/runs/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  state.meta = data.meta;
  state.events = data.events;
  renderList();
  renderDetail();
}

window.addEventListener("hashchange", () => {
  state.selectedId = parseHash();
  loadRun(state.selectedId).catch((err) => {
    el.empty.hidden = false;
    el.detail.hidden = true;
    el.empty.textContent = `Error: ${err.message || err}`;
  });
});

loadRuns()
  .then(() => loadRun(state.selectedId))
  .catch((err) => {
    el.empty.textContent = `Error: ${err.message || err}`;
  });
