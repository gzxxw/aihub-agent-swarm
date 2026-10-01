# AIHub 多Agent协作台 (com.agent.swarm)

> Operit ToolPkg 插件 —— 把 Operit 原生多个模型包装为独立 agent，支持智能任务编排、计划模式、单问、广播、状态与配额监控。

## ✨ 功能

- **智能任务编排（核心）**：说一个任务 → 编排 agent 自动拆解 → 分派给合适的 agent → 各 agent 在**独立新会话**并行执行 → 汇总成**一份最终结果**
- **计划模式**：先由编排 agent 生成分配计划（谁做什么、为什么），你确认后再派发执行
- **5 个原生模型当独立 agent**（零 API Key，全部走 Operit 原生模型配置）：

| agent | 模型 | 人设 |
|---|---|---|
| deepseek_v4_flash | deepseek-v4-flash | 快枪手：快速简洁可执行 |
| deepseek_v41_flash | deepseek-v4.1-flash | 深度思考者（编排/汇总） |
| glm_5_2 | glm-5.2 | 稳重长文 |
| kimi_k3 | kimi-k3 | 创意灵感 |
| sensenova_lite | sensenova-6.8-flash-lite | 轻快闲聊 |

- 单问（aihub_ask）、广播（aihub_broadcast）、状态（aihub_status）、配额（aihub_quota）
- **侧边栏入口**：「AIHub 协作台」+ 工具箱入口
- 各 agent 会话均为独立 chat（AIHub/xxx），**绝不污染当前会话**

## 📦 安装（开发烧录）

```bash
# 项目结构
com.agent.swarm/
├── manifest.json            # ToolPkg 清单
├── package.json
└── dist/
    ├── main.js              # 注册壳（UI 路由 + 侧边栏 + toolbox 入口）
    ├── packages/
    │   └── agent_swarm.js   # 后端 7 个工具实现
    └── ui/aihub/
        └── index.ui.js      # Compose DSL UI

# 在 Operit 中烧录（需要 operit_editor 包）
# debug_install_toolpkg(source_path=/sdcard/Download/Operit/dev_package/com.agent.swarm)

# 重启 Operit → 侧边栏「AIHub 协作台」→ 先点「一键设置」（自动建 5 张角色卡）
```

## 🛠 工具清单

| 工具 | 说明 |
|---|---|
| aihub_setup | 自动扫描模型配置，为 5 个 agent 创建/校验角色卡 |
| aihub_task | 【核心】智能任务编排（mode=auto/plan/execute） |
| aihub_ask | 单 agent 独立会话提问 |
| aihub_broadcast | 多 agent 广播同一问题 |
| aihub_status | agent 就绪状态/人设/角色卡 |
| aihub_quota | 模型配置配额信息 |
| aihub_advice | 使用建议 |

### aihub_task 三种模式

```js
// auto：一步到位（默认）
aihub_task({ task: "写一个Python爬虫..." })

// plan：只生成分配计划，不执行
aihub_task({ task: "...", mode: "plan" })
// → 返回 plan: [{agent, subtask, reason}, ...]

// execute：按传入计划执行
aihub_task({ task: "...", mode: "execute", plan: [...] })
```

## 🧠 技术要点（踩坑沉淀）

- **角色卡绑定**：chat_model_binding_mode=FIXED_CONFIG + chat_model_config_id（日月新聚合配置）+ 不同 chat_model_index → 5 个独立 agent
- **独立会话**：Tools.Chat.startService() → createNew("AIHub子任务", false, cardId) → updateTitle("AIHub/显示名") → sendMessage(msg, chatId, cardId, displayName, {timeout_ms, persist_turn, hide_user_message, notify_reply:false})
- **回复字段**：sendResult.aiResponse
- **METADATA 铁律**：工具数必须与 exports 一致
- **main.js 注册**：UI 路由必须用官方 __importDefault(require(...)) 模式，否则 screen 不可序列化
- **编排降级**：编排 agent 输出占位符 JSON 时自动检测（hasPlaceholderPlan）并规则降级分配（buildFallbackPlan）
- **并行提速**：不同 agent 子任务并行、同一 agent 串行；单子任务跳过汇总直接交付

## 📄 许可证

MIT
