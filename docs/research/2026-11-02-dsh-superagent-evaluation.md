# dsh-superagent 原型评估：能不能用，要不要移除 pi

- 日期：2026-11-02
- 对象：[deepseek-ai/dsh-superagent-prototype](https://github.com/deepseek-ai/dsh-superagent-prototype)
- 相关：[产品补全、连接器重构与全功能验收](2026-10-31-product-hardening-and-qa.md)、[独立个人 Agent](2026-10-24-standalone-personal-agent.md)、[会话队列](2026-10-29-session-queue.md)
- 结论：**不引入。借鉴三条设计思想，不搬代码。**

## 这是什么

一个 **DSH（DeepSeek Harness）插件包**，不是 agent kernel：

- 包名 `dsh-superagent`，`package.json` 的 `dsh.bundle.patch` 指向 `cordis.patch.yml`；
- 全部依赖是 `@deepseek-ai/dsh-*` 系列（peerDependencies，约 20 个）；
- **完全不依赖 pi**：在 `package.json`、`src/` 里搜 `pi-agent`、`pi-ai`、`@earendil` 均无命中；
- 许可证 MIT，与 Moon Bot 的 Apache-2.0 兼容；
- README 自述：「研究原型，仅供参照，非官方产品」「可能有 bug，编码风格和工程实践不一致」。

功能定位：监听 GitHub（可选飞书）→ 评估请求 → 建 Ticket → 派给独立 Executor Session 执行 → 面板显示谁需要人处理。

## 为什么不能直接用

### 1. 架构前提冲突

这个原型**只能**作为 DSH bundle 运行，靠 `cordis.patch.yml` 挂在 DSH 进程里，消费
`@deepseek-ai/dsh-session`、`dsh-agent`、`dsh-tools`、`dsh-workspace` 等。

而 Moon Bot 的根 `AGENTS.md` 红线写着：

> 引擎在接缝后面，接缝本身是我们的。Bot 功能走 host 服务和 `AgentRuntime` 接缝。
> （规则已于 2026-11-02 修订：接缝后面允许 ACP 适配器与厂商 SDK 客户端。）

引入它等于把 DSH 运行时重新装回来，与既定架构直接冲突。

### 2. 领域模型是另一套

原型的概念：Source、Trigger、Thread、Correlation、Channel、Policy、Eval、Mandate、Ticket、Assignment、Subscription。

Moon Bot 的概念：Bot、群聊、回合、派活、审批、能力。

两套模型没有交集。硬接的结果是两套状态机并存，用户面对两个「任务」概念。

### 3. 它是研究代码

README 明确说明是研究原型，部分设计「是未来方向，原型里没实现」。把它当生产依赖违反我们的
「行为必须可靠」原则。

## 值得借鉴的三条

许可证兼容（MIT → Apache-2.0），所以**思路可以学，代码要重写**。若最终复制了任何片段，
必须写明出处并加进 `NOTICE`。

### 3.1 长命令转后台，让回合尽快结束

出处：`docs/003-execution.md:27`

> Executor Sessions ... moves foreground shell commands to background jobs after 5 seconds.
> This lets a worker receive new messages at the next step instead of waiting for a long command to finish.

配套的 `noWait` 守卫（`docs/007-architecture.md:513`）更进一步，拒绝：

- 命令位置上的 `sleep`；
- `timeoutMs` 超过 30 秒的 shell 调用；
- `job_output` 等待超过 5 秒。

理由（`docs/004-prompts.md:78`）：回合被阻塞会推迟新消息进入。

**这正好对应 Moon Bot 的排队问题。** 用户看到「排队 1 条」，根因是上一个回合还占着唯一的槽；
而回合之所以长，常常是因为里面有一个长时间的 shell 命令在等。

### 3.2 区分三种投递语义

出处：`src/executor/dsh.ts`

```ts
sessions.prompt(sessionId, requestId, text, 'steer', live)   // 插进正在跑的回合
sessions.prompt(sessionId, requestId, text, 'queue', ...)    // 排队
sessions.prompt(agent.id, id, note, { inject: '...' })       // 后台结束唤醒
```

Moon Bot 目前只有「排队」一种默认行为（`bridge.ts:140` 的 `if (running) place(message, 'back')`）。
把「插话」「排队」「系统唤醒」分开，用户的下一条不必总是等。

### 3.3 显式 stage，界面说真话

出处：`docs/003-execution.md:9-20`

按优先级列出：`person/answer`、`person/review`、`person/blocked`、`working/queued`、`idle`、`working`。
第一匹配行胜出，每个 stage 有明确的面板标签。

Moon Bot 现在只有「排队 N 条」一个数字，用户看不出是「在等当前这一轮」还是「真的卡住了」。

## 关于「要不要移除 pi」

**不需要，而且不该因此移除。**

pi 和这个原型没有关系：

- 原型是 DSH 生态的插件，运行在 DSH 之上；
- pi（`@earendil-works/pi-agent-core`、`pi-ai`）是 Moon Bot **内置引擎的 agent loop**。

核对结果：

- `packages/core/src/engine/builtin/adapter.ts:181-190`：`buildAgent` 用 pi 的 `Agent` 和 `streamSimple`；
- **工具不来自 pi**：`services.toolsFor(sessionId)` → `runtime.toolRegistry.names()`，
  全部由 Moon Bot 的 host 自己注册（`host/tools/`、`host/tools.ts`）；
- pi 只负责消息循环、工具调用编排、事件流。

也就是说，pi 是**接缝后面的一层薄实现**。移除它意味着自己写 agent loop，与「用不用这个原型」无关，
且会打破 `AgentRuntime` 接缝背后「内置引擎」这个既有设计。

## 决定

1. **不引入 dsh-superagent**：架构冲突、模型不同、研究代码。
2. **不移除 pi**：它是内置引擎的 loop，与原型无关。
3. **借鉴三条**：长命令转后台、三种投递语义、显式 stage。
4. 优先级：先做 3.1（直接减少排队），3.2/3.3 另立方案。

## 变更

- 2026-11-02：评估 dsh-superagent 原型；决定不引入、不移除 pi，借鉴三条设计思想。
