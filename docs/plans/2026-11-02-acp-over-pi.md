# 用 ACP 取代 pi-ai 作为 agent loop

- 日期：2026-11-02
- 相关：[引擎能力描述符](2026-10-29-engine-capabilities.md)、[OpenBot 运行时对比](../research/openbot-runtime.md)、[dsh-superagent 原型评估](../research/2026-11-02-dsh-superagent-evaluation.md)
- 结论：**主流 agent 通过 ACP 接入；不再往 pi-ai 里注入插件和工具来维持它。自建模型端点仍只走 OpenAI 兼容一条路。**

## 为什么不再用 pi-ai

自用下来的问题，按严重程度：

1. **失败不可观测。** 实测：出站请求体合规（我单独驱动 `streamSimple` 抓到的 body 完全正确）、
   上游网关对同样请求返回 200、把 baseURL 指向一个永远返回成功的假服务器——Moon Bot 依然
   只显示一句 `Invalid params`，且假服务器一个请求都没收到。错误在库内部被压平，
   我们无法定位，用户无法自救。
2. **要靠注入才能用。** 为了让它正常工作，要往里塞插件、补工具、对齐 schema。
   每加一个 provider 就多一层补丁，补丁之间互相影响。
3. **上游差异落在我们这边。** `max_tokens` → `max_completion_tokens` 这类改写、
   reasoning 开关、工具调用编码，都由库替我们决定且不可见。

继续加插件是在给一个不可观测的黑盒打补丁，收益递减。

## 已定的方向

### 主线：主流 agent 走 ACP

ACP（Agent Client Protocol）是 JSON-RPC over stdio/relay 的统一协议，被多家 agent 采用。
Moon Bot 已有完整实现：

| 文件 | 行数 | 作用 |
|---|---|---|
| `engine/acp/runtime.ts` | 350 | `AgentRuntime` 接缝的 ACP 实现 |
| `engine/acp/transport.ts` | 187 | stdio 与 relay 两种传输 |
| `engine/acp/discovery.ts` | 149 | 发现本机 ACP 适配器 |
| `engine/acp/doctor.ts` | 133 | 握手诊断 |
| `engine/acp/permission.ts` | 99 | 审批映射 |
| `engine/acp/protocol.ts` | 72 | 行协议 |
| `engine/acp/runtime-types.ts` | 97 | 类型与事件映射 |

11 个 ACP 测试通过。接缝是现成的，不需要新建架构。

已确认可安装的适配器：

```
@agentclientprotocol/claude-agent-acp   0.99.1
@agentclientprotocol/codex-acp          2.5.0
opencode-ai                             1.19.5
```

`discovery.ts` 的 `ON_DEMAND_CANDIDATES` 已支持用 `npx` 直接拉起，不必全局安装。

### ACP 带来的变化

- **协议、鉴权、模型目录由 agent 负责**，我们不注入插件、不补工具；
- **错误可读**：ACP 把 agent 的失败原样返回，不再压成一句话；
- **模型跟随该 agent 自己的能力**：Claude 适配器用 Anthropic 模型，Codex 适配器用 OpenAI 模型。

### 代价（必须承认）

- ACP agent 用**它自己**的模型与计费，不会走我们的 magpie 网关；
- 我们设置页里那些自定义端点（`settings.json` 的 magpie 模型）**在 ACP 引擎上用不了**；
- 用户需要自己有对应订阅或 key。

### 自建模型端点仍走 OpenAI 兼容

不想用 ACP agent、只想接自定义端点的，仍走 `POST {baseURL}/chat/completions`。
这条路只保证一种协议：上游若是 `responses` 或 `anthropic-messages`，由**网关**翻译，
不由 Moon Bot 翻译。

## Moon Bot 因此不做

- 不再为 pi-ai 增加插件、工具补齐或 provider 特例；
- 不为某个 provider 在 host 里写 `if provider === …`；
- 不实现 `responses` / `anthropic-messages` 的上游转换；
- 不内置、不打包厂商 CLI（用户自己装或按需 `npx`）。

## 分阶段

1. **装一个 ACP 适配器，用真实 Bot 跑通一次回合。** 目的不是发布，是证明接缝在真机上成立。
2. **把引擎选择暴露到界面**（`list_engines` 已有数据），让用户按 Bot 选内置或 ACP。
3. **内置 pi-ai 的定位收缩**：只保留给「自定义 OpenAI 兼容端点」用，不再作为主推路径。
4. 视情况决定内置引擎是否最终退役——需要单独方案，不在本文范围。

## 不做什么

- 不改审批、预算、默认放行（与本文无关）；
- 不引入 OpenBot 式的多 CLI 客户端群（8400 行自研适配）；
- 不在本文决定 pi-ai 的去留，只决定不再往它上面堆东西。

## 变更

- 2026-11-02：定下用 ACP 取代 pi-ai 作为主要 agent 接入；自建端点走 OpenAI 兼容 + 网关转换。
- 2026-11-02：用户选择完整 provider 覆盖（方案 B）。OpenBot 是 PolyForm Noncommercial，
  行为照它做、代码原创。

## 当前实际落地（截至本轮）

| 能力 | 状态 | 证据 |
|---|---|---|
| ACP 会话配置读取（模型选项） | 完成 | `session-config.ts`，`test/acp-session-config.test.ts` |
| 模型切换与「被拒绝」回执 | 完成 | `session-settings.ts`，`setConfig` 返回 `rejected` |
| 启动环境覆盖层（不写用户配置） | 完成 | `endpointEnv()`，`OPENCODE_CONFIG_CONTENT` + 私有目录 |
| Codex 模型列表（app-server） | 完成 | `model-list.ts`，本机实拉 11 个模型 |
| Codex 回合序列（假进程） | 仅脚本验证 | `app-server-turn.ts`，`test/app-server-turn.test.ts` |
| Codex 事件映射 | 仅脚本验证 | `app-server-events.ts` |
| Codex 审批默认拒绝 | 仅脚本验证 | `app-server-approval.ts` |
| provider 能力表 | 完成 | `provider-capability.ts`，引擎列表已带 `provider` |

**明确未完成，不得标为可用：**

- Codex app-server 未接入 `AgentRuntime`；`capabilityOf('codex').runsTurns === false`。
  真 CLI 的登录态、工具结果、审批桥都没接。
- Claude、Grok、Cursor 没有原生客户端。`claude --help` 没有列模型命令，
  所以能力表里它们是 `listsModels: false`，只能走 `claude-agent-acp`。
- 设置页没有新的模型选择器；只有既有目录会显示 Codex 条目（`runnable: false`，不可选）。

**真实 Codex 探测（本轮实测，未通过）：**

`AppServerRuntime` 已接进 `LocalRunner`（引擎配置 `kind: 'app-server'`），
并在真 CLI 上跑通了协议：`initialize` → `thread/start` → `turn/start` → `turn/completed`。

但**回合是空转的**：`turn/completed` 的 `items` 为空，没有任何 `item/agentMessage/delta`。
原因是私有 `CODEX_HOME` 里没有登录凭据，本机也从未登录过 Codex
（`ls ~/.codex/auth.json` 不存在）。所以：

- `capabilityOf('codex').runsTurns` 保持 `false`，不改；
- 一次真回合能跑通，需要用户先 `codex login`，或把已有凭据复制到私有目录。

**验证状态：** `pnpm test` 全绿（connect 18 / core 1356 / desktop 66），
`pnpm run check:static` 通过（core 19 warnings 0 errors，均为既有债）。

## 与 OpenBot 的差距（如实记录）

方案 B 的目标是「跟 OpenBot 一样」。当前只完成了协议地基：

| OpenBot 有的 | 我们有的 |
|---|---|
| 12 个 provider，每个一套客户端 | ACP 家族 + Codex 目录/回合协议 |
| Claude SDK 客户端（2397 行） | 无。且 `claude` CLI 没有列模型命令 |
| Codex app-server（581 行） | 协议跑通，回合空转（无登录凭据） |
| 各 agent 配置文件注入 | 环境覆盖层（更干净，不写用户文件） |
| 模型目录 + 推理档位 | 完成 |
| 设置页模型选择器 | 未做 |

**结论：按 B 的完整覆盖没有达成。** 已交付的是可测的协议层，
未实现的 provider 在 `provider-capability.ts` 里全部标成 `runsTurns: false`，没有冒充。

## 引擎依赖策略（2026-11-02 修订硬规则 1 后）

原规则「运行时必须是我们自己的」要求 kernel 只能是我们自己的代码。修订后接缝后面的实现可以用厂商 SDK。
本节是硬规则 1 要求的「理由与版本策略」。

### 允许的条件

1. 实现藏在 `AgentRuntime` 的五个方法后面（`start`/`stop`/`runTurn`/`steer`/`cancelTurn`），
   host 不 import 它；
2. 能力在 `provider-capability.ts` 里如实登记，没验证过的写 `runsTurns: false`；
3. 用户数据和密钥不因引入 SDK 而改变存放位置。

### 各依赖的定位

| 依赖 | 用途 | 版本策略 |
|---|---|---|
| `@earendil-works/pi-agent-core` + `pi-ai` | 内置引擎 loop | 锁定次版本；升级要跑 `test/pi-proto.test.ts` 五项 |
| `@anthropic-ai/claude-agent-sdk`（未引入） | Claude 专用客户端 | 引入前需评估：它自带 MCP 与工具层，与本仓 policy 的关系要写清 |
| `codex app-server`（协议，非依赖） | Codex 模型目录与回合 | 跟随用户本机 CLI 版本；协议字段以 `codex app-server generate-json-schema` 为准 |
| ACP 适配器（`claude-agent-acp` 等） | ACP 家族 | 用户自己装或 `npx`，本仓不打包 |

### 代价（接受）

- 厂商改协议，我们跟着改；这些客户端不是我们可以控制的。
- 引入 SDK 会扩大依赖树和攻击面，每个都要单独评审。
- 因此**不是所有 provider 都值得写专用客户端**：能走 ACP 的优先走 ACP，
  OpenBot 也是这么做的（12 个 provider 里 9 个共用 `AcpAgentClient`）。
