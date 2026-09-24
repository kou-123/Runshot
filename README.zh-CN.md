# Runshot

**把一次命令运行拍成可回看的快照。**

Runshot 是一个**零依赖**的 Node.js 命令行工具，用来做**本地命令可观测**：包裹任意命令，捕获 **stdout / stderr / 退出码 / 耗时**，打开**本地面板时间线**，或导出可分享的**单文件 HTML 报告**。

```bash
npx runshot -- npm test
```

适合这些场景：终端滚动记录丢了、CI 日志又长又难分享、不想为了调试一个脚本去接一整套云端 APM / Tracing。

[英文 README](./README.md) · [License MIT](./LICENSE)

---

## 能做什么

- **包裹任意命令**：测试、构建、Python 脚本、Make、一行临时命令
- **本地时间线 UI**：在浏览器里按 stdout / stderr / system 过滤查看
- **导出 HTML 报告**：丢进 Issue、PR、文档，对方打开即看
- **无头 / CI 模式**：`--no-open --no-server`，适合流水线
- **更注重隐私**：尽量脱敏常见 token / secret 模式
- **零 npm 依赖**：只要 Node.js 20+

**便于搜索的关键词：** 命令行工具、本地调试、日志查看、stdout、stderr、测试失败排查、构建日志、HTML 报告、可观测性、开发者工具、零依赖、Node.js CLI、命令运行历史、时间线

---

## 为什么用 Runshot？

| 痛点 | Runshot 怎么解决 |
|------|------------------|
| 终端往上翻就没了 | 本地持久化带时间戳的输出 |
| CI 日志巨大难分享 | 导出一个 HTML 文件即可 |
| 上完整可观测平台太重 | 本地优先、免注册、一条命令 |
| `tee` / 重定向只有纯文本 | 额外提供状态、耗时和可视化时间线 |

---

## 安装

```bash
# 不安装，直接跑
npx runshot -- <command>

# 或全局安装
npm i -g runshot
```

需要 **Node.js 20+**。

---

## 快速开始

```bash
# 捕获命令并打开面板
runshot -- npm test
runshot -- python train.py
runshot -- make build
runshot -- node scripts/migrate.js

# 重新打开最近一次运行
runshot open

# 导出可分享的 HTML 报告
runshot report
runshot report -o ./run-report.html

# 列出最近运行
runshot list

# 无头模式（适合 CI）
runshot --no-open --no-server -- npm test
```

数据默认保存在 `~/.runshot/runs/`（可用环境变量 `RUNSHOT_HOME` 覆盖）。

---

## 演示（无头）

```bash
runshot --no-open --no-server -- node -e "console.log('hello'); console.error('oops'); process.exit(1)"
runshot report -o ./demo-report.html
open ./demo-report.html   # macOS；Linux 可用 xdg-open
```

---

## 命令说明

```text
runshot [--no-open] [--no-server] [--port <n>] -- <command...>
runshot open [id] [--port <n>] [--no-open]
runshot report [id] [-o|--out <path>]
runshot list
runshot help
runshot version
```

| 参数 | 含义 |
|------|------|
| `--no-open` | 不自动打开浏览器 |
| `--no-server` | 不启动本地 UI 服务 |
| `--port <n>` | 指定 UI 端口 |
| `-o, --out` | HTML 报告输出路径 |

---

## 工作原理

1. 启动子进程，按相对时间戳采集 stdout / stderr  
2. 把元数据与事件写入 `~/.runshot/`  
3. 本地起一个轻量 Web UI（可过滤事件流）  
4. 同一份数据可渲染成独立 HTML 报告  

无云端、无账号、无遥测。

---

## 典型用法

- 本地排查不稳定的 `npm test` / `pytest` / `cargo test`  
- 把失败的构建结果用一个 HTML 发给同事  
- 在本机保留重要命令运行的短历史  
- 把报告附到 GitHub Issue 或内部文档  
- 不想上 OpenTelemetry / Datadog 时，先用轻量本地可观测  

---

## 本地开发

```bash
git clone https://github.com/kou-123/Runshot.git
cd Runshot
npm run test:smoke
node src/cli.js -- echo hello
node src/cli.js open --no-open --port 3920
```

```text
src/     CLI、进程采集、存储、本地服务、HTML 报告
web/     本地面板（原生 HTML/CSS/JS）
```

---

## 路线图

- [ ] Python / Node 函数级 span SDK  
- [ ] 把 HTML 报告上传为 CI Artifact 的 GitHub Action  
- [ ] 基于已捕获时间线的可选失败原因提示  

---

## 参与贡献

欢迎提 Issue / PR。反馈 bug 时，请尽量附上你运行的命令，以及脱敏后的 `runshot report` 内容。

---

## 许可证

MIT © [kou-123](https://github.com/kou-123)
