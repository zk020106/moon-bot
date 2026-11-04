<p align="center">
  <img src="docs/images/moon/logo.png" alt="Moon Bot" width="120">
</p>

<h1 align="center">Moon Bot</h1>

<p align="center">一支长期在线的 Bot 小队：你建 Bot，不是建对话。<br>基于 <a href="https://github.com/Fei2411/DeepSeek-Bot">DS Bot</a> 修改，自带运行时（Fastify 服务 + 内置引擎 + Electron 窗口），不依赖 DeepSeek Harness。</p>

<p align="center">中文 | <a href="#english">English</a></p>

![Moon 主题（浅色）](docs/images/moon/moon-light.png)

## 这是什么

- **以 Bot 为中心**：左侧是你的 Bot，不是聊天记录。Chief（月亮小精灵）是主 Bot，负责建新 Bot、分派任务、收结果；每个 Bot 有自己的名字、角色、指令、模型和长期记忆。
- **Bot 之间能派活**：对 Chief 说「新建一个叫诗人的 Bot，把这件事交给它」，它会建好 Bot、把任务派过去，等结果回来再告诉你。派出去的 Bot 在侧栏里显示「工作中」。
- **过程默认收起**：思考和工具调用不铺满屏幕，回复上方一行「已工作 12s · 5 步 ›」，点开是完整过程面板。
- **卡片消息**：表格、待办、选项、确认、表单用 OpenUI 卡片渲染（说「用表格对比 A 和 B」「帮我做个待办清单」即可）。
- **模型自己配**：设置里填 API Key 或接任何 OpenAI 兼容服务，「获取可用模型」一键拉列表；每个 Bot 可选不同模型。

## 功能一览

### 四套主题 × 浅色 / 深色

默认 **Moon**：来自月亮小精灵的通透淡紫色，淡紫侧栏、带光泽的白色回复气泡、紫色渐变的用户气泡。另有 **DeepSeek**（白底蓝调、扁平灰气泡）、**Claude**（米色纸张、回复为无气泡衬线正文）、**Grok**（纯黑白、无气泡、大圆角输入框）。在 设置 → 通用 → 主题 中切换，跟随系统浅色/深色。

![四套主题，上排浅色，下排深色](docs/images/moon/themes.png)

### 发送后立刻有反馈

消息一发出，最后一条消息下方就出现 Bot 头像和一行轮换的状态文字（「正在琢磨」「正在权衡」「正在完成」……，调用工具时显示它正在做什么），带计时，直到回复开始出现；侧栏里这个 Bot 的头像外有转动的圈，名字下显示「工作中」。

![状态行](docs/images/moon/status-row.png)

### 工作区文件：预览 + 下载

右侧栏「工作区文件」里每个文件、每个文件夹悬停都有下载按钮（文件夹打包成 .zip），预览页工具栏也有下载。网页版通过同一个登录后的通道下载，不需要额外端口。单个文件或文件夹最大 64 MB。

| 类型 | 扩展名 | 效果 |
|---|---|---|
| 图片 | png, jpg, gif, webp, svg, bmp | 直接预览 |
| PDF | pdf | 直接预览 |
| Word / PPT | docx, doc, pptx, ppt, odt, rtf | 内置 Office 引擎渲染 |
| 表格 | xlsx, xls, csv, tsv | 表格视图 |
| Markdown | md | 渲染后的文档 |
| 代码和文本 | txt, json, js, ts, py, html, css, yaml, xml, sh … | 语法高亮 |
| 音频 | mp3, wav, ogg, m4a, flac, aac | 卡片内直接播放 |
| 视频 | mp4, webm, mov, m4v, ogv | 卡片内直接播放 |
| 其他（zip、bin 等） | — | 文件卡片：图标、名称、大小、类型和「下载」按钮 |

<p>
  <img src="docs/images/moon/files-video.png" alt="视频在卡片里播放" width="49%">
  <img src="docs/images/moon/files-fallback.png" alt="不能预览的文件显示文件卡片" width="49%">
</p>

## 源码来源与致谢

Moon Bot 的客户端界面、部分桌面端代码和交互实现参考并改造自 [DSH Bot](https://github.com/MoLi-MoChou/dsh-bot)。DSH Bot 基于 [DS Bot](https://github.com/Fei2411/DeepSeek-Bot)，相关代码按 Apache-2.0 许可证使用和修改。Moon Bot 的运行时、服务端、存储和 Agent 引擎由本项目自行实现；完整的来源、修改说明和许可证见 [NOTICE](NOTICE)。

## 部署网页版（推荐）

一条命令安装（需要 Docker；镜像 `ghcr.io/zk020106/moon-bot`，可匿名拉取）：

```sh
curl -fsSL https://raw.githubusercontent.com/zk020106/moon-bot/main/deploy/install.sh | sh
```

脚本会生成访问密码（只打印一次）、拉镜像、在 8290 起服务并等到 `/healthz`。打开 `http://服务器IP:8290`，输入密码。

### 第一次配置模型（OpenAI 兼容）

1. 准备任意 OpenAI 兼容服务的 **API Key**（以及 Base URL，若不是官方 OpenAI）。
2. 打开网页 → **设置** → 模型 / 供应商，填入 Key（和 Base URL）。
3. 点 **获取可用模型**，给 Chief（或你的 Bot）选一个模型。
4. 回到聊天发一句「你好」。

也可用环境变量在 `.env` 里预置 Key（见 [deploy/.env.example](deploy/.env.example)）；界面里仍可改。

更新：`./update.sh`（或 `curl …/install.sh | sh` 再跑一次）。回滚：`./rollback.sh`。细节见 [deploy/README.md](deploy/README.md)。

### 其它安装方式

自己构建镜像：

```sh
git clone https://github.com/zk020106/moon-bot.git && cd moon-bot
docker build -t moon-bot .
docker run -d --name moon-bot -p 8290:8290 \
  -e MOON_BOT_PASSWORD=换成你的访问密码 \
  -v moon-bot-data:/data moon-bot
```

本机开发（**Node.js ≥ 22.18**，**pnpm ≥ 10.18.3**，用 Corepack）：

```sh
corepack enable && corepack prepare pnpm@10.18.3 --activate
pnpm install && pnpm --filter moon-bot run web   # http://127.0.0.1:8290，本机可不设密码
```

### 环境变量

| 变量 | 默认 | 说明 |
|---|---|---|
| `MOON_BOT_PASSWORD` | — | 访问密码；监听非本机地址时必填 |
| `MOON_BOT_WEB_HOST` | `127.0.0.1`（镜像里是 `0.0.0.0`） | 监听地址 |
| `MOON_BOT_WEB_PORT` | `8290` | 端口 |
| `MOON_BOT_DATA` | `~/.moon-bot`（镜像里是 `/data`） | 数据目录 |
| `MOON_BOT_WORKSPACE` | 数据目录下 | Bot 的默认工作区 |

旧名字 `MOCHOU_*`、`DSH_BOT_*` 仍然有效。

## 桌面版（暂缓）

当前优先网页版 Docker。Windows / Linux 桌面安装包的发布与 CI 打包先搁置；仓库里仍有 `apps/desktop` 源码，开发者可自行 `pnpm --filter moon-bot run dist`。旧的 GitHub Releases 可能过时，请以网页镜像为准。

## 开发

```sh
pnpm install                # 根一次装齐三个 workspace；postinstall 构建产物
pnpm run build              # src/client → client.js（生成物不提交，见 AGENTS.md）
pnpm test                   # 单元测试（Node ≥ 22.18，直接用 .ts 源码）
pnpm run typecheck          # tsc --noEmit，全 workspace
pnpm run lint               # oxlint + 架构/行数/浮空 Promise 门禁
pnpm run eval               # 五项能力评测集
pnpm --filter moon-bot run web   # 独立服务（密码页 + 同源 UI）
pnpm --filter moon-bot test
```

## 许可和致谢

Apache-2.0，见 [LICENSE](LICENSE)。Moon Bot 基于 Fei2411 的 [DS Bot（DeepSeek-Bot）](https://github.com/Fei2411/DeepSeek-Bot)（Apache-2.0）修改，DS Bot 的代码直接放在本仓库里并做了改动，改动清单和第三方声明（framer-motion、open-claude-ui 等）见 [NOTICE](NOTICE)。运行时是本仓库自己的：Fastify 服务、内置引擎（[@earendil-works/pi-agent-core](https://www.npmjs.com/package/@earendil-works/pi-agent-core) + `pi-ai`，MIT）、SQLite 存储与 Electron 窗口，不依赖 DeepSeek Harness。

---

## English

## Source and attribution

Moon Bot's client UI, parts of the desktop app, and interaction code are adapted from [DSH Bot](https://github.com/MoLi-MoChou/dsh-bot). DSH Bot is based on [DS Bot](https://github.com/Fei2411/DeepSeek-Bot); the relevant code is used and modified under the Apache-2.0 license. Moon Bot's runtime, service, storage, and agent engines are implemented in this project. See [NOTICE](NOTICE) for the full source, modification, and license notices.


Moon Bot is a team of long-lived Bots: you create Bots, not chats. Chief, the lilac moon sprite, is the Main Bot: it creates Bots, hands them tasks and brings their results back to you. It was forked from [DS Bot](https://github.com/Fei2411/DeepSeek-Bot) and now ships its own runtime: a Fastify service, a built-in agent engine (pi-agent-core + pi-ai) over SQLite, and an Electron window — no DeepSeek Harness install.

- **Themes:** Moon (default, luminous lilac), DeepSeek, Claude (serif prose, no reply bubbles) and Grok (monochrome), each light and dark. Settings → General → Theme.
- **Live status:** right after you send, the Bot's avatar and a rotating status line ("Mulling it over", "Getting it done", or the tool it is running) show until the reply streams; the Bot's sidebar tile shows a spinning ring and "Working".
- **Workspace files:** preview images, PDF, Word/PowerPoint, Excel/CSV, Markdown, code/text, audio and video; download any file, or a folder as .zip (up to 64 MB), also in the web build behind its password. Other types get a file card with a Download button.
- **Work steps hidden by default**, one line opens the full process panel; OpenUI cards for tables, to-dos, options and forms.

**Install the web app (recommended):**

```sh
curl -fsSL https://raw.githubusercontent.com/zk020106/moon-bot/main/deploy/install.sh | sh
```

Public image: `ghcr.io/zk020106/moon-bot` (anonymous pull). Then open `http://HOST:8290`, enter the printed password, and in **Settings** add an OpenAI-compatible API Key → fetch models → chat.

Local try: Node ≥ 22.18, pnpm ≥ 10.18.3 — `pnpm install && pnpm --filter moon-bot run web`.

Desktop releases are deferred; use the Docker web image. License: Apache-2.0; see [NOTICE](NOTICE).
