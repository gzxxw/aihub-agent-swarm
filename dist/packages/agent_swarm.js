/* METADATA
{
  "name": "agent_swarm",
  "display_name": {
    "zh": "AIHub 多Agent协作台",
    "en": "AIHub Multi-Agent Hub"
  },
  "description": {
    "zh": "把 Operit 原生多个模型包装为独立 agent，支持单人设、单问、广播、状态与配额监控。",
    "en": "Wrap Operit built-in models as independent agents with per-persona, single ask, broadcast, status and quota monitoring."
  },
  "enabledByDefault": true,
  "category": "AI",
  "env": [
    {
      "name": "AIHUB_AGENT_CONFIG_ID",
      "description": { "zh": "承载多 agent 的模型配置 ID（默认自动发现日月新聚合配置）", "en": "Model config id that hosts the agents (auto-discovered by default)" },
      "required": false
    }
  ],
  "tools": [
    {
      "name": "aihub_advice",
      "description": {
        "zh": "AIHub 使用建议：\\n- 用 aihub_ask 让单个 agent 回答；用 aihub_broadcast 让多个 agent 同时回答。\\n- agent 可选：deepseek_v4_flash / deepseek_v41_flash / glm_5_2 / kimi_k3 / sensenova_lite。\\n- 每个 agent 有独立人设（快枪手/深度思考/稳重长文/创意灵感/轻快闲聊）。\\n- 首次使用前先 aihub_setup 自动建角色卡。",
        "en": "AIHub usage advice:\\n- Use aihub_ask for a single agent; use aihub_broadcast for multiple agents.\\n- Agents: deepseek_v4_flash / deepseek_v41_flash / glm_5_2 / kimi_k3 / sensenova_lite.\\n- Each agent has its own persona (fast / deep / steady / creative / light).\\n- Run aihub_setup once to auto-create character cards."
      },
      "parameters": [],
      "advice": true
    },
    {
      "name": "aihub_setup",
      "description": {
        "zh": "扫描 Operit 模型配置，自动为 5 个 agent 创建/校验角色卡（FIXED_CONFIG 绑定对应模型），并返回每个 agent 的就绪状态。首次使用 AIHub 前调用一次。",
        "en": "Scan Operit model configs, auto-create/verify character cards for 5 agents (FIXED_CONFIG bound), and return readiness of each agent. Call once before using AIHub."
      },
      "parameters": []
    },
    {
      "name": "aihub_ask",
      "description": {
        "zh": "向单个 agent 提问。返回该 agent 的回答、人设、耗时、模型名与配额快照。",
        "en": "Ask a single agent. Returns the agent's reply, persona, elapsed ms, model name and quota snapshot."
      },
      "parameters": [
        {
          "name": "agent",
          "description": { "zh": "agent 标识：deepseek_v4_flash / deepseek_v41_flash / glm_5_2 / kimi_k3 / sensenova_lite", "en": "Agent id: deepseek_v4_flash / deepseek_v41_flash / glm_5_2 / kimi_k3 / sensenova_lite" },
          "type": "string",
          "required": true
        },
        {
          "name": "prompt",
          "description": { "zh": "要提问的内容", "en": "The prompt to ask" },
          "type": "string",
          "required": true
        },
        {
          "name": "context",
          "description": { "zh": "可选上下文/人设增强，会附加到角色卡人设之后", "en": "Optional extra context appended after the card persona" },
          "type": "string",
          "required": false
        }
      ]
    },
    {
      "name": "aihub_broadcast",
      "description": {
        "zh": "向多个 agent 广播同一问题，汇总每个 agent 的回答、耗时与状态；自动跳过未就绪 agent。",
        "en": "Broadcast one question to multiple agents, aggregate each reply, elapsed and status; skip unready agents."
      },
      "parameters": [
        {
          "name": "prompt",
          "description": { "zh": "要广播的问题", "en": "The question to broadcast" },
          "type": "string",
          "required": true
        },
        {
          "name": "agents",
          "description": { "zh": "agent 标识数组（不传则使用全部可用 agent）", "en": "Array of agent ids (defaults to all ready agents)" },
          "type": "array",
          "required": false
        },
        {
          "name": "context",
          "description": { "zh": "可选共享上下文", "en": "Optional shared context" },
          "type": "string",
          "required": false
        }
      ]
    },
    {
      "name": "aihub_status",
      "description": {
        "zh": "查看全部 agent 状态：就绪/缺失/人设/模型名/角色卡ID，以及承载配置信息。",
        "en": "Show status of all agents: ready/missing/persona/model/role-card id, plus hosting config info."
      },
      "parameters": []
    },
    {
      "name": "aihub_quota",
      "description": {
        "zh": "查看 Operit 模型配置中与 agent 相关的模型配额信息（配置名、模型列表、限额设置）。",
        "en": "Show quota-related info of the hosting model config (config name, model list, limits)."
      },
      "parameters": []
    },
    {
      "name": "aihub_task",
      "description": {
        "zh": "【核心】智能任务编排：提交一个总任务，自动分配/拆解给合适的 agent 各自在独立会话中执行，最后汇总成一份结果。支持计划模式：mode=plan 只生成分配计划（不执行）；mode=execute 传入 plan 后按计划执行；默认 auto 一步到位。用法：aihub_task({task: \"写一个Python爬虫...\", mode: \"plan\"})。",
        "en": "[CORE] Smart task orchestration: submit a task, auto-decompose and assign to fitting agents in isolated chats, then aggregate into one final result. Plan mode: mode=plan returns the plan only; mode=execute runs a given plan; default auto runs end-to-end. Usage: aihub_task({task: \"...\", mode: \"plan\"})."
      },
      "parameters": [
        {
          "name": "task",
          "description": { "zh": "要完成的总任务描述", "en": "The overall task description" },
          "type": "string",
          "required": true
        },
        {
          "name": "agents",
          "description": { "zh": "可选，限定参与分配的 agent 列表（不传则自动从全部 5 个 agent 中分配）", "en": "Optional; restrict participating agents (defaults to auto from all 5)" },
          "type": "array",
          "required": false
        },
        {
          "name": "mode",
          "description": { "zh": "可选，plan=只生成分配计划不执行；execute=按传入 plan 执行；auto=一步到位（默认）", "en": "Optional; plan=plan only, execute=run given plan, auto=end-to-end (default)" },
          "type": "string",
          "required": false
        },
        {
          "name": "plan",
          "description": { "zh": "可选，mode=execute 时传入的分配计划数组（元素含 agent/subtask/reason）", "en": "Optional; the plan array to execute when mode=execute (items with agent/subtask/reason)" },
          "type": "array",
          "required": false
        }
      ]
    },
    {
      "name": "aihub_weblogin",
      "description": {
        "zh": "网页版 agent 登录管理：aihub_weblogin({}) 打开 DeepSeek 网页浏览器浮窗供手动登录；aihub_weblogin({account, password}) 自动填账号密码走密码登录；aihub_weblogin({save: true}) 保存当前浏览器会话的登录 cookie，之后网页版 DeepSeek agent（deepseek_web）即可自动使用。",
        "en": "Web-agent login manager: aihub_weblogin({}) opens the DeepSeek web page in a browser floating window for manual login; aihub_weblogin({account, password}) auto-fills account/password for password login; aihub_weblogin({save: true}) saves the browser session cookies so the web DeepSeek agent (deepseek_web) can be used automatically."
      },
      "parameters": [
        {
          "name": "agent",
          "description": { "zh": "可选，网页版 agent id（默认 deepseek_web）", "en": "Optional; web agent id (default deepseek_web)" },
          "type": "string",
          "required": false
        },
        {
          "name": "account",
          "description": { "zh": "可选，DeepSeek 登录账号（邮箱/手机号），与 password 一起走密码登录", "en": "Optional; DeepSeek account (email/phone) for password login, used with password" },
          "type": "string",
          "required": false
        },
        {
          "name": "password",
          "description": { "zh": "可选，DeepSeek 登录密码，与 account 一起走密码登录", "en": "Optional; DeepSeek password for password login, used with account" },
          "type": "string",
          "required": false
        },
        {
          "name": "save",
          "description": { "zh": "可选，true 时保存当前浏览器会话 cookie 到本地（登录完成后调用）", "en": "Optional; when true, save current browser session cookies locally (call after login)" },
          "type": "boolean",
          "required": false
        }
      ]
    }
  ]
}
*/

"use strict";

// ---------------------------------------------------------------------------
// AIHub 多Agent协作台 - 后端工具实现
// ---------------------------------------------------------------------------

var AGENTS = [
  {
    id: "deepseek_v4_flash",
    modelName: "deepseek-v4-flash",
    displayName: "DeepSeek V4 Flash",
    persona: "你是『快枪手』，擅长快速给出简洁、准确、可执行的回答。语言精炼，不废话，直接给结论、步骤或代码。",
    color: "#4FC3F7",
    description: "快速通用助手"
  },
  {
    id: "deepseek_v41_flash",
    modelName: "deepseek-flash",
    displayName: "DeepSeek V4.1 Flash",
    persona: "你是『深度思考者』，擅长拆解复杂问题、多角度分析、给出推理过程和严谨结论。回答结构清晰，先分析后结论。",
    color: "#B39DDB",
    description: "深度推理助手"
  },
  {
    id: "glm_5_2",
    modelName: "glm-5.2",
    displayName: "GLM 5.2",
    persona: "你是『稳重的智者』，擅长长文写作、方案规划、知识讲解。表达稳重、条理分明、考虑周全，适合需要完整输出的任务。",
    color: "#FFB74D",
    description: "稳重长文助手"
  },
  {
    id: "kimi_k3",
    modelName: "kimi-k3",
    displayName: "Kimi K3",
    persona: "你是『创意灵感家』，擅长头脑风暴、创意点子、发散思维、故事创作。回答有想象力，敢于给出新颖的视角。",
    color: "#F06292",
    description: "创意灵感助手"
  },
  {
    id: "sensenova_lite",
    modelName: "sensenova-6.8-flash-lite",
    displayName: "商量 6.8 Flash Lite",
    persona: "你是『轻快的伙伴』，擅长日常闲聊、轻松问答、简洁回复。语气亲切自然，回答简短有温度。",
    color: "#81C784",
    description: "轻快闲聊助手"
  },
  {
    id: "deepseek_web",
    modelName: "",
    displayName: "DeepSeek 网页版",
    persona: "你是 DeepSeek 网页版智能助手，直接给出高质量、完整的回答。",
    color: "#90A4AE",
    description: "网页版 DeepSeek（浏览器自动化）",
    web: true,
    webUrl: "https://chat.deepseek.com",
    webDomain: "chat.deepseek.com",
    webSession: "aihub_ds_web"
  }
];

var CARD_PREFIX = "aihub_agent_";
var AIHUB_GROUP = "AIHub";

function asText(value) {
  return String(value == null ? "" : value);
}

function firstNonBlank() {
  for (var i = 0; i < arguments.length; i++) {
    var value = asText(arguments[i]).trim();
    if (value) {
      return value;
    }
  }
  return "";
}

function jsonParseSafe(raw) {
  if (typeof raw === "object" && raw !== null) {
    return raw;
  }
  try {
    var text = asText(raw).trim();
    if (!text) {
      return null;
    }
    var parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : null;
  }
  catch (error) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 模型配置发现：找到承载 5 个 agent 的配置
// ---------------------------------------------------------------------------

async function discoverHostConfig() {
  var envConfigId = null;
  try {
    envConfigId = asText(await Tools.SoftwareSettings.readEnvironmentVariable("AIHUB_AGENT_CONFIG_ID")).trim();
  }
  catch (error) {
    envConfigId = null;
  }

  var configsResult = await Tools.SoftwareSettings.listModelConfigs();
  var configs = (configsResult && configsResult.configs) || [];

  // 1. env 指定优先
  if (envConfigId) {
    var byEnv = configs.filter(function (config) {
      return config.id === envConfigId;
    });
    if (byEnv.length > 0) {
      return { config: byEnv[0], source: "env" };
    }
  }

  // 2. 自动发现：包含最多 agent 模型名的配置
  var best = null;
  var bestCount = -1;
  configs.forEach(function (config) {
    var modelList = (config && config.modelList) || [];
    var count = 0;
    AGENTS.forEach(function (agent) {
      if (modelList.indexOf(agent.modelName) >= 0) {
        count += 1;
      }
    });
    if (count > bestCount) {
      bestCount = count;
      best = config;
    }
  });

  if (best && bestCount > 0) {
    return { config: best, source: "auto", matchedCount: bestCount };
  }

  // 3. 兜底：默认配置
  var fallback = configs.filter(function (config) {
    return config.id === "default";
  });
  if (fallback.length > 0) {
    return { config: fallback[0], source: "default", matchedCount: 0 };
  }

  return { config: null, source: "none", matchedCount: 0 };
}

function modelIndexOf(config, modelName) {
  if (!config) {
    return -1;
  }
  var modelList = (config && config.modelList) || [];
  var idx = modelList.indexOf(modelName);
  if (idx >= 0) {
    return idx;
  }
  // 兼容 modelName 逗号分隔
  var modelNameField = asText(config.modelName).split(",").map(function (item) {
    return item.trim();
  });
  idx = modelNameField.indexOf(modelName);
  return idx;
}

// ---------------------------------------------------------------------------
// 角色卡：为每个 agent 建卡（FIXED_CONFIG 绑定）
// ---------------------------------------------------------------------------

async function listCharacterCards() {
  try {
    var result = await Tools.SoftwareSettings.listCharacterCards();
    return (result && result.cards) || [];
  }
  catch (error) {
    return [];
  }
}

async function findAgentCard(cards, agentId) {
  var wantName = CARD_PREFIX + agentId;
  for (var i = 0; i < cards.length; i++) {
    if (asText(cards[i].id) === wantName || asText(cards[i].name) === wantName) {
      return cards[i];
    }
  }
  return null;
}

async function createAgentCard(agent, configId, modelIndex) {
  var cardName = CARD_PREFIX + agent.id;
  var createResult = await Tools.SoftwareSettings.createCharacterCard({
    name: cardName,
    description: agent.description + "（AIHub 自动生成）",
    character_setting: agent.persona,
    chat_model_binding_mode: "FIXED_CONFIG",
    chat_model_config_id: configId,
    chat_model_index: modelIndex,
    tool_access_enabled: false,
    advanced_custom_prompt: agent.persona
  });
  var card = (createResult && createResult.card) || null;
  return {
    cardId: card ? asText(card.id) : "",
    created: !!(createResult && createResult.created)
  };
}

async function setupAllAgents() {
  var host = await discoverHostConfig();
  if (!host.config) {
    return {
      success: false,
      error: "未找到承载 agent 的模型配置",
      agents: []
    };
  }

  var cards = await listCharacterCards();
  var results = [];
  var createdCount = 0;
  var readyCount = 0;

  for (var i = 0; i < AGENTS.length; i++) {
    var agent = AGENTS[i];

    // 网页版 agent：无需模型配置/角色卡，检查 cookie 是否已保存
    if (agent.web) {
      var webReady = false;
      try {
        var savedCookieVal2 = await Tools.SoftwareSettings.readEnvironmentVariable(WEB_COOKIE_ENV);
        webReady = !!asText(savedCookieVal2).trim();
      }
      catch (error) {
        webReady = false;
      }
      results.push({
        agent: agent.id,
        displayName: agent.displayName,
        modelName: "deepseek-web（浏览器）",
        modelIndex: -1,
        persona: agent.persona,
        ready: webReady,
        cardId: "",
        created: false,
        configId: "",
        configName: "",
        web: true,
        webUrl: agent.webUrl,
        reason: webReady ? "" : "未保存网页登录 cookie，请运行 aihub_weblogin 登录后保存"
      });
      if (webReady) {
        readyCount += 1;
      }
      continue;
    }

    var modelIndex = modelIndexOf(host.config, agent.modelName);
    if (modelIndex < 0) {
      results.push({
        agent: agent.id,
        modelName: agent.modelName,
        ready: false,
        reason: "模型不在当前配置中",
        modelIndex: -1
      });
      continue;
    }

    var card = await findAgentCard(cards, agent.id);
    var cardId = "";
    var created = false;
    if (card) {
      cardId = asText(card.id);
    }
    else {
      var createResult = await createAgentCard(agent, host.config.id, modelIndex);
      cardId = createResult.cardId;
      created = createResult.created;
      if (created) {
        createdCount += 1;
      }
    }

    readyCount += 1;
    results.push({
      agent: agent.id,
      displayName: agent.displayName,
      modelName: agent.modelName,
      modelIndex: modelIndex,
      persona: agent.persona,
      ready: true,
      cardId: cardId,
      created: created,
      configId: host.config.id,
      configName: host.config.name
    });
  }

  return {
    success: true,
    hostConfigId: host.config.id,
    hostConfigName: host.config.name,
    source: host.source,
    matchedModelCount: host.matchedCount || 0,
    createdCount: createdCount,
    readyCount: readyCount,
    agents: results
  };
}

// ---------------------------------------------------------------------------
// 发送提问：为 agent 建/复用专属 chat，绑定角色卡，sendMessage
// 改造：sendMessage 发出后立即返回（不阻塞等待模型回复），回复由 collectReply 轮询取回
// 这样即使 UI 切走/销毁，模型也会在独立 chat 继续回复，任务不中断

async function ensureAgentChat(agent, cardId) {
  // 查找已有 AIHub 专属 chat（标题含 agent id + AIHub），有则复用
  var chats = [];
  try {
    var listResult = await Tools.Chat.listChats({ limit: 50, sort_by: "updatedAt", sort_order: "desc" });
    chats = (listResult && listResult.chats) || [];
  }
  catch (error) {
    chats = [];
  }
  for (var i = 0; i < chats.length; i++) {
    var title = asText(chats[i].title);
    if (title.indexOf(agent.id) >= 0 && title.indexOf("AIHub") >= 0) {
      return chats[i].id;
    }
  }

  // 没有专属 chat：启动服务后创建独立会话（不切换当前会话）
  try {
    await Tools.Chat.startService();
  }
  catch (error) {
    // 忽略 startService 错误，继续尝试
  }
  var createResult = await Tools.Chat.createNew("AIHub子任务", false, cardId);
  var chatId = (createResult && createResult.chatId) || "";
  if (chatId) {
    try {
      await Tools.Chat.updateTitle(chatId, "AIHub/" + agent.displayName);
    }
    catch (error) {
      // 忽略
    }
  }
  return chatId;
}

// 发送消息并等待回复（带超时保护：发出即算成功，回复可稍后取回）
async function sendAndCollect(agent, chatId, cardId, prompt, waitMs) {
  var waitLimit = waitMs || 30000; // 默认最多等 30s 拿回复
  var startedAt = Date.now();
  var sent = false;
  var sendError = "";
  try {
    // sendMessage(message, chatId, roleCardId, senderName, options)
    // 注意：不设 timeout_ms 或设大值，避免调用层超时取消；notify_reply 让系统在回复完成时通知
    var sendPromise = Tools.Chat.sendMessage(prompt, chatId, cardId, agent.displayName, {
      timeout_ms: 600000,
      persist_turn: true,
      hide_user_message: true,
      notify_reply: true
    });
    // 用 race 兜底：即使 sendMessage 长时间不 resolve，也不阻塞编排
    var timeoutPromise = new Promise(function (resolve) {
      setTimeout(function () { resolve(null); }, 15000);
    });
    var sendResult = await Promise.race([sendPromise, timeoutPromise]);
    sent = true;
  }
  catch (error) {
    sendError = error && error.message ? error.message : String(error);
    sent = false;
  }

  // 轮询取回复（最多 waitLimit）
  var reply = "";
  var pollDeadline = Date.now() + waitLimit;
  while (Date.now() < pollDeadline) {
    try {
      var msgs = await Tools.Chat.getMessages(chatId, { order: "desc", limit: 1 });
      var list = (msgs && msgs.messages) || [];
      if (list.length > 0) {
        var last = list[0];
        var text = firstNonBlank(last.content, last.text, last.message, last.aiResponse, last.role);
        // 只取 AI 回复且非空
        var role = asText(last.role || "").toLowerCase();
        if ((role === "ai" || role === "assistant" || !role) && asText(text).trim() && asText(text).indexOf(agent.displayName) < 0) {
          reply = asText(text);
          break;
        }
      }
    }
    catch (error) {
      // 轮询失败继续重试
    }
    await sleepMs(3000);
  }

  return {
    sent: sent,
    sendError: sendError,
    reply: reply,
    elapsedMs: Date.now() - startedAt,
    chatId: chatId
  };
}

function sleepMs(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

// ---------------------------------------------------------------------------
// 网页版 agent（DeepSeek 网页）：浏览器会话 + cookie 登录 + DOM 自动化
// 复用 Tools.Net.browser* 全家桶（注意：命名空间是 Tools.Net，不是 Tools.Network！
// 且运行时没有 startBrowser，浏览器会话是系统内置常驻的，直接 browserNavigate 即可）
// cookie 持久化到软件设置变量
// ---------------------------------------------------------------------------

var WEB_COOKIE_ENV = "AIHUB_WEB_DS_COOKIE"; // 存储 DeepSeek 网页登录 cookie（JSON 字符串）

// 解析浏览器 API 返回的 JSON 字符串（有些返回 {ok, data}，有些直接是对象）
function parseBrowserResult(raw) {
  if (typeof raw === "object" && raw !== null) {
    return raw;
  }
  try {
    var parsed = JSON.parse(asText(raw));
    return parsed && typeof parsed === "object" ? parsed : {};
  }
  catch (error) {
    return {};
  }
}

function browserOk(raw) {
  var parsed = parseBrowserResult(raw);
  // 兼容 {ok:true} / {success:true} / {error:""} 等
  return !!parsed.ok || !!parsed.success || !parsed.error;
}

// 打开（或复用）DeepSeek 网页浏览器会话：系统内置常驻会话，直接导航即可
async function ensureWebSession(agent) {
  var sessionName = agent.webSession || "aihub_ds_web";
  try {
    var navRaw = await Tools.Net.browserNavigate({ url: agent.webUrl });
    var nav = parseBrowserResult(navRaw);
    if (browserOk(navRaw) || nav.url || nav.title || (typeof navRaw === "string" && navRaw.indexOf("Navigated") >= 0)) {
      return { ok: true, session: sessionName };
    }
    return { ok: false, error: asText(nav.error || navRaw || "导航失败") };
  }
  catch (error) {
    return { ok: false, error: "浏览器会话不可用: " + (error && error.message ? error.message : String(error)) };
  }
}

// 读取已保存的 cookie 并注入浏览器
async function applyWebCookies(agent) {
  try {
    var saved = asText(await Tools.SoftwareSettings.readEnvironmentVariable(WEB_COOKIE_ENV)).trim();
    if (!saved) {
      return { ok: false, error: "未保存登录 cookie，请先运行 aihub_weblogin 登录 DeepSeek 网页版" };
    }
    var cookies = jsonParseSafe(saved);
    if (!cookies) {
      return { ok: false, error: "cookie 数据格式错误，请重新 aihub_weblogin" };
    }
    // 注入到浏览器（cookies.set 支持 domain + 字符串/对象）
    var setRaw = await Tools.Net.cookies.set(agent.webDomain, cookies);
    if (!browserOk(setRaw)) {
      return { ok: false, error: "注入 cookie 失败，请重新 aihub_weblogin" };
    }
    return { ok: true };
  }
  catch (error) {
    return { ok: false, error: "读取 cookie 失败: " + (error && error.message ? error.message : String(error)) };
  }
}

// 检查当前是否已登录（页面出现输入框 = 已登录）
async function checkWebLogin(agent) {
  try {
    var snapRaw = await Tools.Net.browserSnapshot({});
    var snap = parseBrowserResult(snapRaw);
    var text = asText(snap.text || snap.content || snap.snapshot || "");
    // DeepSeek 聊天页有输入框 placeholder 或 textarea；登录页会出现"登录/手机号/验证码"
    var loginWords = ["登录", "手机号", "验证码", "注册", "密码"];
    var hasLogin = false;
    for (var i = 0; i < loginWords.length; i++) {
      if (text.indexOf(loginWords[i]) >= 0) {
        hasLogin = true;
        break;
      }
    }
    // 有 textarea/输入框 = 已登录；只有登录词但没有输入框 = 未登录
    var hasInput = text.indexOf("textarea") >= 0 || text.indexOf("输入消息") >= 0 || text.indexOf("给 DeepSeek 发送消息") >= 0 || text.indexOf("placeholder") >= 0;
    var loggedIn = hasInput || (text.length > 0 && !hasLogin);
    return { loggedIn: loggedIn, snapshot: text };
  }
  catch (error) {
    return { loggedIn: false, error: "快照失败: " + (error && error.message ? error.message : String(error)) };
  }
}

// 等待回复生成完成：DeepSeek 网页生成时底部有"停止生成"按钮，消失即完成
async function waitReplyDone(agent, waitMs) {
  var deadline = Date.now() + waitMs;
  while (Date.now() < deadline) {
    try {
      var snapRaw = await Tools.Net.browserSnapshot({});
      var snap = parseBrowserResult(snapRaw);
      var text = asText(snap.text || snap.content || snap.snapshot || "");
      // 停止生成按钮消失 = 回复完成
      if (text.indexOf("停止生成") < 0 && text.indexOf("Stop generating") < 0) {
        return { done: true, snapshot: text };
      }
    }
    catch (error) {
      // 忽略
    }
    await sleepMs(3000);
  }
  return { done: false, snapshot: "" };
}

// 抓取最后一条 AI 回复（消息区最后一条非用户消息文本）
function extractLastReply(snapshotText) {
  // 快照文本是结构化列表。简单启发式：找"assistant/AI/DeepSeek"标记后的文本
  // 若快照含完整消息列表，取最后一段
  var text = asText(snapshotText);
  if (!text.trim()) {
    return "";
  }
  // 快照可能是 JSON 数组/对象字符串，尝试解析消息
  try {
    var parsed = jsonParseSafe(text);
    if (Array.isArray(parsed)) {
      // 找最后一个 role=assistant 的消息
      for (var i = parsed.length - 1; i >= 0; i--) {
        var m = parsed[i];
        var role = asText(m.role || "").toLowerCase();
        if (role === "assistant" || role === "ai") {
          return asText(m.content || m.text || m.message || "");
        }
      }
    }
  }
  catch (error) {
    // 非 JSON，走文本启发式
  }
  // 文本启发式：去掉最后一段"用户消息"后的部分。这里简化：返回去掉最前面用户输入后的整段
  return text.length > 500 ? text.slice(-500) : text;
}

// 网页 agent 提问：浏览器发消息 + 等回复完成 + 抓取回复
async function askWebAgent(agent, prompt) {
  var startedAt = Date.now();
  try {
    // 1. 确保会话
    var sess = await ensureWebSession(agent);
    if (!sess.ok) {
      return { success: false, agent: agent.id, error: sess.error };
    }
    // 2. 注入 cookie
    var ck = await applyWebCookies(agent);
    if (!ck.ok) {
      return { success: false, agent: agent.id, error: ck.error };
    }
    // 3. 刷新页面（cookie 注入后刷新生效）
    try {
      await Tools.Net.browserNavigate({ url: agent.webUrl });
    }
    catch (error) {
      // 忽略
    }
    await sleepMs(4000);
    // 4. 检查登录态
    var login = await checkWebLogin(agent);
    if (!login.loggedIn) {
      return { success: false, agent: agent.id, error: "DeepSeek 网页未登录或登录已过期，请重新运行 aihub_weblogin" };
    }
    // 5. 找到输入框并输入（textarea / 输入框）
    var typed = false;
    try {
      // 用 browserType 需要 ref；尝试 snapshot 拿 ref
      var snapRaw = await Tools.Net.browserSnapshot({});
      var snap = parseBrowserResult(snapRaw);
      var ref = snap.ref || (snap.elements && snap.elements[0] && snap.elements[0].ref) || "";
      if (ref) {
        await Tools.Net.browserType({ ref: ref, text: prompt, submit: true });
        typed = true;
      }
    }
    catch (error) {
      typed = false;
    }
    if (!typed) {
      // 退路：browserRunCode 执行 DOM 输入 + 回车
      var code = "(()=>{const ta=document.querySelector('textarea')||document.querySelector('[contenteditable=\"true\"]')||document.querySelector('input[type=\"text\"]');if(!ta)return 'NO_INPUT';ta.focus();const setter=Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value');if(setter&&setter.set)setter.set.call(ta," + JSON.stringify(prompt) + ");else ta.value=" + JSON.stringify(prompt) + ";ta.dispatchEvent(new Event('input',{bubbles:true}));ta.dispatchEvent(new Event('change',{bubbles:true}));const ev=new KeyboardEvent('keydown',{key:'Enter',code:'Enter',keyCode:13,bubbles:true});ta.dispatchEvent(ev);return 'SENT';})()";
      var runRaw = await Tools.Net.browserRunCode({ code: code });
      var run = parseBrowserResult(runRaw);
      var runResult = asText(run.result || run.output || run.data || runRaw);
      if (runResult.indexOf("NO_INPUT") >= 0) {
        return { success: false, agent: agent.id, error: "未找到 DeepSeek 输入框（页面结构可能变化）" };
      }
      typed = true;
    }
    // 6. 等回复完成（最多 90s）
    var done = await waitReplyDone(agent, 90000);
    if (!done.done) {
      return {
        success: true, // 已发送，回复可能还在生成，标记为"后台生成中"
        agent: agent.id,
        reply: "",
        sent: true,
        elapsedMs: Date.now() - startedAt,
        note: "消息已发送到 DeepSeek 网页，回复生成较慢，可在浏览器会话中查看"
      };
    }
    // 7. 抓取回复
    var reply = extractLastReply(done.snapshot);
    if (!reply) {
      // 再等几秒重抓一次
      await sleepMs(5000);
      var snapRaw2 = await Tools.Net.browserSnapshot({});
      var snap2 = parseBrowserResult(snapRaw2);
      reply = extractLastReply(asText(snap2.text || snap2.content || snap2.snapshot || ""));
    }
    return {
      success: !!reply,
      agent: agent.id,
      reply: reply,
      sent: !!reply || true,
      elapsedMs: Date.now() - startedAt
    };
  }
  catch (error) {
    return {
      success: false,
      agent: agent.id,
      error: "DeepSeek 网页自动化失败: " + (error && error.message ? error.message : String(error))
    };
  }
}

// aihub_weblogin：打开 DeepSeek 网页让用户手动登录，并把 cookie 存起来
// 支持三种模式：
//  1) webLogin(agentId) — 只打开登录页，用户手动登录
//  2) webLogin(agentId, account, password) — 自动填账号密码走"密码登录"
//  3) saveWebCookies(agentId) — 登录成功后保存 cookie
async function webLogin(agentId, account, password) {
  var agent = null;
  for (var i = 0; i < AGENTS.length; i++) {
    if (AGENTS[i].id === agentId || (AGENTS[i].web && !agentId)) {
      agent = AGENTS[i];
      break;
    }
  }
  if (!agent || !agent.web) {
    return { success: false, error: "该 agent 不是网页版，无需登录" };
  }
  var sess = await ensureWebSession(agent);
  if (!sess.ok) {
    return { success: false, error: sess.error };
  }
  // 打开登录页
  try {
    await Tools.Net.browserNavigate({ url: agent.webUrl });
  }
  catch (error) {
    // 忽略
  }
  await sleepMs(2000);

  // 若提供了账号密码：自动走"密码登录"
  if (account && password) {
    try {
      // 1. 点"密码登录"切换表单
      var snapRaw = await Tools.Net.browserSnapshot({});
      var snap = parseBrowserResult(snapRaw);
      var text = asText(snap.text || snap.content || snap.snapshot || "");
      var pwdBtnRef = "";
      // 找"密码登录"按钮 ref（e9 是探测值，实际可能变化，从快照里找）
      var m = text.match(/button "密码登录" \[ref=([^\]]+)\]/);
      if (m) {
        pwdBtnRef = m[1];
        await Tools.Net.browserClick({ ref: pwdBtnRef });
        await sleepMs(1500);
      }
      // 2. 重新快照，找账号/密码输入框
      var snapRaw2 = await Tools.Net.browserSnapshot({});
      var snap2 = parseBrowserResult(snapRaw2);
      var text2 = asText(snap2.text || snap2.content || snap2.snapshot || "");
      // 找账号输入框（"邮箱/手机号"或"账号"）和密码框（"密码"）
      var accountRef = "";
      var pwdRef = "";
      var accM = text2.match(/textbox "([^"]*账号[^"]*)" \[ref=([^\]]+)\]/) || text2.match(/textbox "([^"]*邮箱[^"]*)" \[ref=([^\]]+)\]/) || text2.match(/textbox "([^"]*手机号[^"]*)" \[ref=([^\]]+)\]/);
      if (accM) {
        accountRef = accM[2];
      }
      var pwdM = text2.match(/textbox "([^"]*密码[^"]*)" \[ref=([^\]]+)\]/);
      if (pwdM) {
        pwdRef = pwdM[2];
      }
      if (accountRef) {
        await Tools.Net.browserType({ ref: accountRef, text: account });
        await sleepMs(500);
      }
      if (pwdRef) {
        await Tools.Net.browserType({ ref: pwdRef, text: password });
        await sleepMs(500);
      }
      // 3. 点"登录"按钮
      var snapRaw3 = await Tools.Net.browserSnapshot({});
      var snap3 = parseBrowserResult(snapRaw3);
      var text3 = asText(snap3.text || snap3.content || snap3.snapshot || "");
      var loginM = text3.match(/button "登录" \[ref=([^\]]+)\]/);
      if (loginM) {
        await Tools.Net.browserClick({ ref: loginM[1] });
      }
      await sleepMs(4000);
      return {
        success: true,
        agent: agent.id,
        displayName: agent.displayName,
        webUrl: agent.webUrl,
        autoLogin: true,
        message: "已自动填入账号密码并点击登录。若登录成功，请在浏览器浮窗确认后点「保存登录」；若出现验证码/滑块，请在浏览器浮窗中手动完成。",
        session: agent.webSession
      };
    }
    catch (error) {
      return {
        success: false,
        agent: agent.id,
        error: "自动登录失败: " + (error && error.message ? error.message : String(error)) + "。可手动在浏览器浮窗中登录，然后点「保存登录」。"
      };
    }
  }

  // 无账号密码：纯手动模式
  return {
    success: true,
    agent: agent.id,
    displayName: agent.displayName,
    webUrl: agent.webUrl,
    message: "已打开 " + agent.webUrl + "。请在浏览器浮窗中登录 DeepSeek（扫码或手机号+验证码，或点「密码登录」用账号密码）。登录完成后，到 AIHub 协作台点「保存登录」保存 cookie。",
    session: agent.webSession
  };
}

// 保存当前浏览器会话的 cookie（登录后调用）
async function saveWebCookies(agentId) {
  var agent = null;
  for (var i = 0; i < AGENTS.length; i++) {
    if (AGENTS[i].id === agentId || (AGENTS[i].web && !agentId)) {
      agent = AGENTS[i];
      break;
    }
  }
  if (!agent || !agent.web) {
    return { success: false, error: "该 agent 不是网页版" };
  }
  try {
    var ckRaw = await Tools.Net.cookies.get(agent.webDomain);
    var ck = parseBrowserResult(ckRaw);
    // cookies.get 返回可能是 {cookies:[...]} 或 {data:[...]} 或直接数组
    var cookies = ck.cookies || ck.data || ck.result || ck;
    if (Array.isArray(cookies)) {
      await Tools.SoftwareSettings.writeEnvironmentVariable(WEB_COOKIE_ENV, JSON.stringify(cookies));
      return { success: true, agent: agent.id, cookieCount: cookies.length, message: "已保存 " + cookies.length + " 条 cookie，DeepSeek 网页 agent 可用了" };
    }
    // 可能是对象形式
    await Tools.SoftwareSettings.writeEnvironmentVariable(WEB_COOKIE_ENV, JSON.stringify(cookies));
    return { success: true, agent: agent.id, cookieCount: Object.keys(cookies).length, message: "已保存 cookie，DeepSeek 网页 agent 可用了" };
  }
  catch (error) {
    return { success: false, error: "保存 cookie 失败: " + (error && error.message ? error.message : String(error)) };
  }
}

async function askAgent(agentId, prompt, context) {
  var agent = null;
  for (var i = 0; i < AGENTS.length; i++) {
    if (AGENTS[i].id === agentId) {
      agent = AGENTS[i];
      break;
    }
  }
  if (!agent) {
    return {
      success: false,
      error: "未知 agent: " + agentId + "，可选: " + AGENTS.map(function (a) { return a.id; }).join(", ")
    };
  }

  // 网页版 agent：走浏览器自动化（不经过 Operit 模型配置）
  if (agent.web) {
    var webResult = await askWebAgent(agent, (context && asText(context).trim() ? "【附加上下文】\n" + asText(context).trim() + "\n\n【任务】\n" : "") + asText(prompt).trim());
    webResult.displayName = agent.displayName;
    webResult.persona = agent.persona;
    webResult.modelName = "deepseek-web（浏览器）";
    return webResult;
  }

  var host = await discoverHostConfig();
  if (!host.config) {
    return { success: false, agent: agentId, error: "未找到承载模型配置，请先 aihub_setup" };
  }

  var cards = await listCharacterCards();
  var card = await findAgentCard(cards, agentId);
  var cardId = card ? asText(card.id) : "";

  if (!cardId) {
    var modelIndex = modelIndexOf(host.config, agent.modelName);
    if (modelIndex < 0) {
      return {
        success: false,
        agent: agentId,
        error: "模型 " + agent.modelName + " 不在配置 " + host.config.name + " 中，请先 aihub_setup"
      };
    }
    var createResult = await createAgentCard(agent, host.config.id, modelIndex);
    cardId = createResult.cardId;
  }

  // 每个 agent 独立会话（创建/复用专属 chat），绝不污染当前会话
  var chatId = await ensureAgentChat(agent, cardId);
  if (!chatId) {
    return { success: false, agent: agentId, error: "创建 agent 独立会话失败（chat service 不可用）" };
  }

  var finalPrompt = prompt;
  if (context && asText(context).trim()) {
    finalPrompt = "【附加上下文】\n" + asText(context).trim() + "\n\n【任务】\n" + asText(prompt).trim();
  }

  var result = await sendAndCollect(agent, chatId, cardId, finalPrompt, 30000);

  // 若轮询未取到回复但消息已发出：标记为"已发送待回复"，不算失败（模型会在后台继续）
  var success = !!result.reply || result.sent;
  return {
    success: success,
    agent: agentId,
    displayName: agent.displayName,
    persona: agent.persona,
    modelName: agent.modelName,
    cardId: cardId,
    chatId: chatId,
    reply: result.reply,
    sent: result.sent,
    sendError: result.sendError,
    elapsedMs: result.elapsedMs,
    configId: host.config.id,
    configName: host.config.name,
    note: result.reply ? "" : "消息已发送，模型正在独立会话后台回复，可稍后在「AIHub/" + agent.displayName + "」会话查看完整结果"
  };
}

// ---------------------------------------------------------------------------
// 广播：多 agent 并行（相互独立，串行队列防护见说明）
// ---------------------------------------------------------------------------

async function broadcast(prompt, agents, context) {
  var targets = [];
  if (agents && Array.isArray(agents) && agents.length > 0) {
    targets = agents;
  }
  else {
    targets = AGENTS.map(function (a) { return a.id; });
  }

  var results = [];
  for (var i = 0; i < targets.length; i++) {
    var result = await askAgent(targets[i], prompt, context);
    results.push({
      agent: result.agent,
      displayName: result.displayName || "",
      success: result.success,
      reply: result.reply || "",
      error: result.error || "",
      elapsedMs: result.elapsedMs || 0,
      modelName: result.modelName || ""
    });
  }

  var succeeded = results.filter(function (r) { return r.success; });
  var failed = results.filter(function (r) { return !r.success; });

  return {
    success: succeeded.length > 0,
    total: results.length,
    succeededCount: succeeded.length,
    failedCount: failed.length,
    prompt: prompt,
    results: results,
    summary: "广播完成：" + succeeded.length + " 成功 / " + failed.length + " 失败"
  };
}

// ---------------------------------------------------------------------------
// 工具实现
// ---------------------------------------------------------------------------

async function aihub_setup(params) {
  try {
    return await setupAllAgents();
  }
  catch (error) {
    return {
      success: false,
      error: error && error.message ? error.message : String(error)
    };
  }
}

async function aihub_ask(params) {
  try {
    var agent = asText(params && params.agent).trim();
    var prompt = asText(params && params.prompt).trim();
    if (!agent) {
      return { success: false, error: "缺少参数 agent" };
    }
    if (!prompt) {
      return { success: false, error: "缺少参数 prompt" };
    }
    return await askAgent(agent, prompt, asText(params && params.context).trim());
  }
  catch (error) {
    return {
      success: false,
      error: error && error.message ? error.message : String(error)
    };
  }
}

async function aihub_broadcast(params) {
  try {
    var prompt = asText(params && params.prompt).trim();
    if (!prompt) {
      return { success: false, error: "缺少参数 prompt" };
    }
    var agents = params && params.agents;
    var context = asText(params && params.context).trim();
    return await broadcast(prompt, agents, context);
  }
  catch (error) {
    return {
      success: false,
      error: error && error.message ? error.message : String(error)
    };
  }
}

async function aihub_status(params) {
  try {
    var host = await discoverHostConfig();
    if (!host.config) {
      return { success: false, error: "未找到承载配置" };
    }
    var cards = await listCharacterCards();
    var agents = [];
    for (var ai = 0; ai < AGENTS.length; ai++) {
      var agent = AGENTS[ai];
      // 网页版 agent：不依赖模型配置，检查 cookie
      if (agent.web) {
        var webReady = false;
        var webReason = "未保存网页登录 cookie，请运行 aihub_weblogin 登录后保存";
        try {
          var savedCookieVal = await Tools.SoftwareSettings.readEnvironmentVariable(WEB_COOKIE_ENV);
          webReady = !!asText(savedCookieVal).trim();
          if (webReady) {
            webReason = "";
          }
        }
        catch (error) {
          webReady = false;
        }
        agents.push({
          agent: agent.id,
          displayName: agent.displayName,
          modelName: "deepseek-web（浏览器）",
          modelIndex: -1,
          persona: agent.persona,
          cardBound: false,
          cardId: "",
          ready: webReady,
          web: true,
          webUrl: agent.webUrl,
          reason: webReason
        });
        continue;
      }
      var modelIndex = modelIndexOf(host.config, agent.modelName);
      var card = null;
      for (var i = 0; i < cards.length; i++) {
        if (asText(cards[i].id) === (CARD_PREFIX + agent.id) || asText(cards[i].name) === (CARD_PREFIX + agent.id)) {
          card = cards[i];
          break;
        }
      }
      agents.push({
        agent: agent.id,
        displayName: agent.displayName,
        modelName: agent.modelName,
        modelIndex: modelIndex,
        persona: agent.persona,
        cardBound: !!card,
        cardId: card ? asText(card.id) : "",
        ready: modelIndex >= 0 && !!card
      });
    }
    return {
      success: true,
      hostConfigId: host.config.id,
      hostConfigName: host.config.name,
      source: host.source,
      agents: agents,
      advice: "若 agent 未就绪，先运行 aihub_setup"
    };
  }
  catch (error) {
    return {
      success: false,
      error: error && error.message ? error.message : String(error)
    };
  }
}

async function aihub_quota(params) {
  try {
    var host = await discoverHostConfig();
    if (!host.config) {
      return { success: false, error: "未找到承载配置" };
    }
    var config = host.config;
    return {
      success: true,
      configId: config.id,
      configName: config.name,
      provider: config.apiProviderType || "",
      modelList: config.modelList || [],
      agentModels: AGENTS.map(function (a) { return a.modelName; }),
      limits: {
        requestLimitPerMinute: config.requestLimitPerMinute || 0,
        maxConcurrentRequests: config.maxConcurrentRequests || 0,
        enableSummary: config.enableSummary,
        summaryMessageCountThreshold: config.summaryMessageCountThreshold
      },
      note: "Operit 原生模型有限量，请在 Operit 设置中查看具体配额"
    };
  }
  catch (error) {
    return {
      success: false,
      error: error && error.message ? error.message : String(error)
    };
  }
}

// aihub_weblogin：网页版 agent（DeepSeek 网页）登录管理
// 用法1：aihub_weblogin({}) 打开 DeepSeek 网页浏览器浮窗，用户手动登录
// 用法2：aihub_weblogin({account, password}) 自动填账号密码走密码登录
// 用法3：aihub_weblogin({save: true}) 把当前浏览器会话的登录 cookie 保存到本地
async function aihub_weblogin(params) {
  try {
    var agentId = asText(params && params.agent).trim();
    var save = !!(params && params.save);
    if (save) {
      return await saveWebCookies(agentId);
    }
    var account = asText(params && params.account).trim();
    var password = asText(params && params.password).trim();
    return await webLogin(agentId, account, password);
  }
  catch (error) {
    return {
      success: false,
      error: error && error.message ? error.message : String(error)
    };
  }
}

// ---------------------------------------------------------------------------
// 核心：aihub_task 智能任务编排
// 1. 用编排 agent（deepseek_v41_flash 深度思考）拆解总任务 → 每个子任务分配给哪个 agent
// 2. 每个 agent 在自己的独立会话执行子任务（不污染当前会话）
// 3. 全部完成后，用编排 agent 汇总各结果 → 一份最终交付
// ---------------------------------------------------------------------------

var ORCHESTRATOR_AGENT = "deepseek_v41_flash"; // 深度思考者做编排

function buildAgentCatalogText() {
  return AGENTS.map(function (a) {
    return "- " + a.id + "（" + a.displayName + "）：" + a.description + "。人设：" + a.persona;
  }).join("\n");
}

async function askAgentRaw(agentId, prompt) {
  // 复用 askAgent 但强制独立会话；等待回复最长 90s（串行执行场景）
  return await askAgentWithWait(agentId, prompt, "", 90000);
}

async function askAgentWithWait(agentId, prompt, context, waitMs) {
  // 与 askAgent 相同，但可自定义等待时长（编排执行用更长等待，避免回复慢导致"假中断"）
  var agent = null;
  for (var i = 0; i < AGENTS.length; i++) {
    if (AGENTS[i].id === agentId) {
      agent = AGENTS[i];
      break;
    }
  }
  if (!agent) {
    return {
      success: false,
      error: "未知 agent: " + agentId + "，可选: " + AGENTS.map(function (a) { return a.id; }).join(", ")
    };
  }

  // 网页版 agent：走浏览器自动化（不经过 Operit 模型配置）
  if (agent.web) {
    var webResult = await askWebAgent(agent, (context && asText(context).trim() ? "【附加上下文】\n" + asText(context).trim() + "\n\n【任务】\n" : "") + asText(prompt).trim());
    webResult.displayName = agent.displayName;
    webResult.persona = agent.persona;
    webResult.modelName = "deepseek-web（浏览器）";
    return webResult;
  }

  var host = await discoverHostConfig();
  if (!host.config) {
    return { success: false, agent: agentId, error: "未找到承载模型配置，请先 aihub_setup" };
  }
  var cards = await listCharacterCards();
  var card = await findAgentCard(cards, agentId);
  var cardId = card ? asText(card.id) : "";
  if (!cardId) {
    var modelIndex = modelIndexOf(host.config, agent.modelName);
    if (modelIndex < 0) {
      return {
        success: false,
        agent: agentId,
        error: "模型 " + agent.modelName + " 不在配置 " + host.config.name + " 中，请先 aihub_setup"
      };
    }
    var createResult = await createAgentCard(agent, host.config.id, modelIndex);
    cardId = createResult.cardId;
  }
  var chatId = await ensureAgentChat(agent, cardId);
  if (!chatId) {
    return { success: false, agent: agentId, error: "创建 agent 独立会话失败（chat service 不可用）" };
  }
  var finalPrompt = prompt;
  if (context && asText(context).trim()) {
    finalPrompt = "【附加上下文】\n" + asText(context).trim() + "\n\n【任务】\n" + asText(prompt).trim();
  }
  var result = await sendAndCollect(agent, chatId, cardId, finalPrompt, waitMs);
  var success = !!result.reply || result.sent;
  return {
    success: success,
    agent: agentId,
    displayName: agent.displayName,
    persona: agent.persona,
    modelName: agent.modelName,
    cardId: cardId,
    chatId: chatId,
    reply: result.reply,
    sent: result.sent,
    sendError: result.sendError,
    elapsedMs: result.elapsedMs,
    configId: host.config.id,
    configName: host.config.name,
    note: result.reply ? "" : "消息已发送，模型正在独立会话后台回复，可稍后在「AIHub/" + agent.displayName + "」会话查看完整结果"
  };
}

async function aihub_task(params) {
  try {
    var task = asText(params && params.task).trim();
    if (!task) {
      return { success: false, error: "缺少参数 task" };
    }
    var mode = asText(params && params.mode).trim() || "auto";
    var restrictedAgents = params && params.agents && Array.isArray(params.agents) ? params.agents : null;

    // 候选 agent（受限或全部）
    var candidates = AGENTS.map(function (a) { return a.id; });
    if (restrictedAgents && restrictedAgents.length > 0) {
      candidates = restrictedAgents;
    }

    var catalog = buildAgentCatalogText();

    // ---------- 计划生成（plan） ----------
    // mode=execute 时直接使用传入 plan；否则让编排 agent 拆解
    var planJson = null;
    var planValid = false;
    var fallbackUsed = false;
    var planGeneratedAt = Date.now();

    if (mode === "execute") {
      var givenPlan = params && params.plan && Array.isArray(params.plan) ? params.plan : null;
      if (givenPlan && givenPlan.length > 0 && !hasPlaceholderPlan(givenPlan)) {
        planJson = givenPlan;
        planValid = true;
      }
      else {
        return { success: false, step: "plan", error: "mode=execute 需要传入有效的 plan 数组" };
      }
    }
    else {
      // 第 1 步：编排 agent 拆解任务（只让它做规划，不做执行）
      var planPrompt = "你是 AIHub 任务编排器。把下面的总任务拆解成 1-3 个子任务，并为每个子任务指派最合适的 agent。\n\n" +
        "可用 agent 清单（只能从中选）：\n" + catalog + "\n\n" +
        "总任务：\n" + task + "\n\n" +
        "只输出一个 JSON 数组，格式：\n" +
        '[{"agent":"deepseek_v4_flash","subtask":"具体子任务描述","reason":"派给它的理由"}]\n\n' +
        "硬性要求：\n" +
        "1. agent 必须真实存在，subtask 必须是你实际写出的具体内容，禁止尖括号占位符（如 <agent_id>）。\n" +
        "2. 只输出 JSON，前后不要任何解释文字、不要 markdown 代码块标记。\n" +
        "3. 简单任务 1 个子任务即可，复杂任务最多 3 个。";

      var planResult = await askAgentRaw(ORCHESTRATOR_AGENT, planPrompt);

      // 解析编排 JSON（宽松：提取 [] 内 JSON）
      if (planResult.success) {
        planJson = extractJsonArray(planResult.reply);
        planValid = Array.isArray(planJson) && planJson.length > 0 && !hasPlaceholderPlan(planJson);
      }

      // 编排失败/占位符 → 规则降级分配：直接把任务分给前 3 个候选 agent，各自独立完成
      if (!planValid) {
        fallbackUsed = true;
        planJson = buildFallbackPlan(candidates, task);
        planValid = true;
      }
    }

    // mode=plan：只返回计划，不执行
    if (mode === "plan") {
      return {
        success: true,
        mode: "plan",
        task: task,
        plan: planJson,
        fallbackUsed: fallbackUsed,
        note: "计划已生成，确认后请用 mode=execute 传入 plan 执行（或直接 mode=auto 一步到位）"
      };
    }

    var planStartedAt = Date.now();

    // 第 2 步：各 agent 独立会话执行子任务
    // 防限额中断：严格串行（同一时间只跑 1 个 agent），避免并发触发 RPM/并发限额
    // 每个子任务等待回复最长 90s；超时未取到回复则标记"已发送待回复"，模型继续在独立会话后台跑
    var execStartedAt = Date.now();
    var executions = [];
    for (var i = 0; i < planJson.length; i++) {
      var item = planJson[i];
      var agentId = asText(item.agent).trim();
      var subtask = asText(item.subtask).trim();
      // 校验 agent 合法
      var valid = false;
      for (var j = 0; j < candidates.length; j++) {
        if (candidates[j] === agentId) {
          valid = true;
          break;
        }
      }
      if (!valid) {
        agentId = candidates[0] || ORCHESTRATOR_AGENT; // 兜底
      }
      var execResult = await askAgentRaw(agentId, "请完成以下子任务：\n" + subtask + "\n\n（这是整体任务的一部分，请给出可直接交付的结果。）");
      executions.push({
        agent: agentId,
        subtask: subtask,
        reason: asText(item.reason).trim(),
        success: execResult.success,
        reply: execResult.reply || "",
        sent: !!execResult.sent,
        error: execResult.error || (execResult.sendError || ""),
        elapsedMs: execResult.elapsedMs || 0,
        chatId: execResult.chatId || "",
        note: execResult.note || ""
      });
    }
    var execWallMs = Date.now() - execStartedAt;

    // 第 3 步：汇总（用编排 agent 整合各结果成一份交付）
    // 只对"已取到回复"的子任务做智能汇总；未取到回复的标注为后台处理中，直接拼接原始内容
    var parts = executions.map(function (e, idx) {
      var resultText = e.reply ? e.reply : (e.sent ? "（消息已发送，回复仍在独立会话后台生成中，可查看「AIHub/" + e.agent + "」会话）" : "（失败：" + e.error + "）");
      return "【子任务" + (idx + 1) + "｜" + e.agent + "】" + e.subtask + "\n结果：" + resultText;
    }).join("\n\n");

    var gotReplies = executions.filter(function (e) { return !!e.reply; });
    var summarySkipped = false;
    var summaryResult = null;
    var finalOutput = "";
    if (gotReplies.length === 1 && executions.length === 1) {
      summarySkipped = true;
      finalOutput = executions[0].reply;
    }
    else if (gotReplies.length === 0) {
      // 没有任何回复：不调用汇总（会拿到空），直接给提示
      summarySkipped = true;
      finalOutput = "任务已派发给各 agent，正在独立会话后台执行中。请稍后切换到「AIHub/xxx」会话查看各 agent 的完整结果。\n\n" + parts;
    }
    else {
      var summaryPrompt = "你是 AIHub 最终汇总器。下面是一个总任务被拆解后，各个 agent 独立完成的结果。请把它们整合成一份完整、连贯、可直接交付的最终答案（按逻辑组织，去掉重复，补上缺失的衔接）。若某子任务标注'后台生成中'，请说明该部分稍后可在对应 agent 会话查看。\n\n" +
        "总任务：\n" + task + "\n\n" +
        "各子任务结果：\n" + parts;

      summaryResult = await askAgentRaw(ORCHESTRATOR_AGENT, summaryPrompt);
      finalOutput = summaryResult.success && summaryResult.reply ? summaryResult.reply : (parts);
    }

    return {
      success: summarySkipped || (summaryResult && summaryResult.success),
      mode: mode,
      task: task,
      plan: planJson,
      fallbackUsed: fallbackUsed,
      executions: executions,
      finalResult: finalOutput,
      summarySkipped: summarySkipped,
      elapsedMs: Date.now() - planStartedAt,
      execWallMs: execWallMs,
      note: "各 agent 均在独立会话中执行，未污染当前会话" + (fallbackUsed ? "；编排 agent 未按格式规划，已自动降级分配" : "") + (summarySkipped ? "；单子任务直接交付，已跳过汇总" : "")
    };
  }
  catch (error) {
    return {
      success: false,
      error: error && error.message ? error.message : String(error)
    };
  }
}

function hasPlaceholderPlan(plan) {
  for (var i = 0; i < plan.length; i++) {
    var item = plan[i] || {};
    var agent = asText(item.agent).trim();
    var subtask = asText(item.subtask).trim();
    if (!agent || agent.indexOf("<") >= 0 || agent.indexOf("agent_id") >= 0) {
      return true;
    }
    if (!subtask || subtask.indexOf("<") >= 0 || subtask.indexOf("子任务描述") >= 0 || subtask.indexOf("agent_id") >= 0) {
      return true;
    }
  }
  return false;
}

function buildFallbackPlan(candidates, task) {
  var pool = candidates.filter(function (id) { return id !== ORCHESTRATOR_AGENT; });
  if (pool.length === 0) {
    pool = candidates.slice();
  }
  var selected = pool.slice(0, 3);
  var plans = selected.map(function (id, idx) {
    var agent = null;
    for (var i = 0; i < AGENTS.length; i++) {
      if (AGENTS[i].id === id) {
        agent = AGENTS[i];
        break;
      }
    }
    var angle = agent ? agent.description : "从你的专业角度";
    return {
      agent: id,
      subtask: "请以「" + angle + "」的身份视角，针对以下总任务给出你这一角色的完整方案与建议（要具体、可交付）：\n" + task,
      reason: "编排降级：规则分配第 " + (idx + 1) + " 位"
    };
  });
  return plans;
}

function extractJsonArray(text) {
  var raw = asText(text).trim();
  // 尝试整体解析
  try {
    var parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  }
  catch (error) {
    // 继续
  }
  // 宽松：找第一个 [ 到最后一个 ]
  var start = raw.indexOf("[");
  var end = raw.lastIndexOf("]");
  if (start >= 0 && end > start) {
    var slice = raw.slice(start, end + 1);
    try {
      var arr = JSON.parse(slice);
      if (Array.isArray(arr)) {
        return arr;
      }
    }
    catch (error2) {
      return null;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// exports（METADATA 同步铁律：新增工具必须补 METADATA + exports）
// ---------------------------------------------------------------------------

var agentSwarmTools = {
  aihub_advice: aihub_advice,
  aihub_setup: aihub_setup,
  aihub_ask: aihub_ask,
  aihub_broadcast: aihub_broadcast,
  aihub_status: aihub_status,
  aihub_quota: aihub_quota,
  aihub_task: aihub_task,
  aihub_weblogin: aihub_weblogin
};

function aihub_advice(params) {
  return {
    advice: "AIHub 使用建议：\n- 用 aihub_ask 让单个 agent 回答；用 aihub_broadcast 让多个 agent 同时回答。\n- agent 可选：deepseek_v4_flash / deepseek_v41_flash / glm_5_2 / kimi_k3 / sensenova_lite / deepseek_web（网页版）。\n- 每个 agent 有独立人设（快枪手/深度思考/稳重长文/创意灵感/轻快闲聊/网页版 DeepSeek）。\n- 首次使用前先 aihub_setup 自动建角色卡；网页版 agent（deepseek_web）需先 aihub_weblogin 登录并保存 cookie。"
  };
}

exports.aihub_advice = agentSwarmTools.aihub_advice;
exports.aihub_setup = agentSwarmTools.aihub_setup;
exports.aihub_ask = agentSwarmTools.aihub_ask;
exports.aihub_broadcast = agentSwarmTools.aihub_broadcast;
exports.aihub_status = agentSwarmTools.aihub_status;
exports.aihub_quota = agentSwarmTools.aihub_quota;
exports.aihub_task = agentSwarmTools.aihub_task;
exports.aihub_weblogin = agentSwarmTools.aihub_weblogin;
