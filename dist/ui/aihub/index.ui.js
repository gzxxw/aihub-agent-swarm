"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Screen;

// ---------------------------------------------------------------------------
// AIHub 协作台 - Compose DSL 薄壳 UI
// 铁律：render 纯函数，所有异步在 onLoad / action 回调；事件返回 Promise
// ---------------------------------------------------------------------------

var PACKAGE_NAME = "agent_swarm";
var TOOL_SETUP = "aihub_setup";
var TOOL_ASK = "aihub_ask";
var TOOL_BROADCAST = "aihub_broadcast";
var TOOL_STATUS = "aihub_status";
var TOOL_QUOTA = "aihub_quota";
var TOOL_TASK = "aihub_task";

var AGENT_IDS = ["deepseek_v4_flash", "deepseek_v41_flash", "glm_5_2", "kimi_k3", "sensenova_lite"];
var AGENT_LABELS = {
  deepseek_v4_flash: "DeepSeek V4 Flash",
  deepseek_v41_flash: "DeepSeek V4.1 Flash",
  glm_5_2: "GLM 5.2",
  kimi_k3: "Kimi K3",
  sensenova_lite: "商量 6.8 Lite"
};
var AGENT_COLORS = {
  deepseek_v4_flash: "#4FC3F7",
  deepseek_v41_flash: "#B39DDB",
  glm_5_2: "#FFB74D",
  kimi_k3: "#F06292",
  sensenova_lite: "#81C784"
};

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

function toErrorText(error) {
  if (error instanceof Error) {
    return error.message || "unknown";
  }
  return String(error || "unknown");
}

function fmtMs(ms) {
  var value = Number(ms) || 0;
  if (value >= 60000) {
    return (value / 60000).toFixed(1) + " 分钟";
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(0) + " 秒";
  }
  return value + " ms";
}

function clipText(text, maxLen) {
  var raw = asText(text);
  var len = maxLen || 200;
  if (raw.length <= len) {
    return raw;
  }
  return raw.slice(0, len) + "…（已截断，完整内容见对应 agent 会话）";
}

function parseToolRecord(result) {
  if (result && typeof result === "object" && !Array.isArray(result)) {
    return result;
  }
  if (typeof result === "string") {
    var raw = result.trim();
    if (!raw) {
      return {};
    }
    try {
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    }
    catch (error) {
      return {};
    }
  }
  return {};
}

function useStateValue(ctx, key, initialValue) {
  var pair = ctx.useState(key, initialValue);
  return { value: pair[0], set: pair[1] };
}

function resolveRuntimePackageName(ctx, fallback) {
  var currentPackageName = asText(ctx.getCurrentPackageName ? ctx.getCurrentPackageName() : "").trim();
  var currentToolPkgId = asText(ctx.getCurrentToolPkgId ? ctx.getCurrentToolPkgId() : "").trim();
  if (!currentPackageName) {
    return fallback;
  }
  if (currentToolPkgId && currentPackageName === currentToolPkgId) {
    return fallback;
  }
  return currentPackageName;
}

async function resolveToolName(ctx, packageName, toolName) {
  if (ctx.resolveToolName) {
    var resolved = await ctx.resolveToolName({ packageName: packageName, toolName: toolName, preferImported: true });
    var value = asText(resolved).trim();
    if (value) {
      return value;
    }
  }
  return packageName + ":" + toolName;
}

async function ensureImportedAndUsed(ctx, packageName) {
  var imported = ctx.isPackageImported ? !!(await ctx.isPackageImported(packageName)) : false;
  if (!imported && ctx.importPackage) {
    var result = await ctx.importPackage(packageName);
    var message = asText(result).toLowerCase();
    if (message.indexOf("error") >= 0 || message.indexOf("failed") >= 0 || message.indexOf("not found") >= 0) {
      throw new Error(asText(result) || "importPackage failed");
    }
  }
  if (ctx.usePackage) {
    var useResult = await ctx.usePackage(packageName);
    var useText = asText(useResult);
    if (useText && useText.toLowerCase().indexOf("error") >= 0) {
      throw new Error(useText);
    }
  }
}

async function callTool(ctx, toolName, params) {
  var packageName = resolveRuntimePackageName(ctx, PACKAGE_NAME);
  await ensureImportedAndUsed(ctx, packageName);
  var resolved = await resolveToolName(ctx, packageName, toolName);
  var candidates = [resolved, packageName + ":" + toolName, PACKAGE_NAME + ":" + toolName].filter(function (item, index, arr) {
    return !!item && arr.indexOf(item) === index;
  });
  var lastError = "";
  for (var i = 0; i < candidates.length; i++) {
    try {
      var result = await ctx.callTool(candidates[i], params);
      return parseToolRecord(result);
    }
    catch (error) {
      lastError = toErrorText(error);
    }
  }
  throw new Error(lastError || ("工具调用失败: " + toolName));
}

function Screen(ctx) {
  var statusState = useStateValue(ctx, "status", "idle");
  var statusTextState = useStateValue(ctx, "statusText", "");
  var errorState = useStateValue(ctx, "error", "");
  var agentListState = useStateValue(ctx, "agentList", []);
  var configState = useStateValue(ctx, "config", null);
  var quotaState = useStateValue(ctx, "quota", null);
  var hasInitializedState = useStateValue(ctx, "hasInitialized", false);
  var promptState = useStateValue(ctx, "prompt", "");
  var selectedAgentsState = useStateValue(ctx, "selectedAgents", []);
  var planModeState = useStateValue(ctx, "planMode", false);
  var pendingPlanState = useStateValue(ctx, "pendingPlan", null);
  var broadcastResultState = useStateValue(ctx, "broadcastResult", null);
  var logState = useStateValue(ctx, "log", []);
  var setupBusyState = useStateValue(ctx, "setupBusy", false);
  var broadcastBusyState = useStateValue(ctx, "broadcastBusy", false);

  function pushLog(entry) {
    var next = logState.value.concat([entry]);
    if (next.length > 50) {
      next = next.slice(next.length - 50);
    }
    logState.set(next);
  }

  var refreshStatus = async function () {
    statusState.set("loading");
    statusTextState.set("正在获取 agent 状态…");
    errorState.set("");
    try {
      var result = await callTool(ctx, TOOL_STATUS, {});
      agentListState.set((result && result.agents) || []);
      configState.set(result && result.config ? result.config : (result.hostConfigName ? { name: result.hostConfigName, id: result.hostConfigId } : null));
      statusState.set(result && result.success ? "ready" : "error");
      statusTextState.set(result && result.success ? "状态已更新" : "状态获取失败");
      if (!result || !result.success) {
        errorState.set((result && result.error) || "状态获取失败");
      }
      pushLog({
        t: Date.now(),
        kind: "status",
        text: "状态刷新，agents=" + ((result && result.agents && result.agents.length) || 0)
      });
    }
    catch (error) {
      statusState.set("error");
      statusTextState.set("状态获取失败");
      errorState.set(toErrorText(error));
    }
  };

  var doSetup = async function () {
    setupBusyState.set(true);
    statusTextState.set("正在自动建立 agent 角色卡…");
    errorState.set("");
    try {
      var result = await callTool(ctx, TOOL_SETUP, {});
      if (!result || !result.success) {
        errorState.set((result && result.error) || "设置失败");
      }
      else {
        pushLog({
          t: Date.now(),
          kind: "setup",
          text: "角色卡就绪 " + (result.readyCount || 0) + "/" + (result.agents ? result.agents.length : 0)
        });
        await refreshStatus();
      }
    }
    catch (error) {
      errorState.set(toErrorText(error));
    }
    finally {
      setupBusyState.set(false);
    }
  };

  var loadQuota = async function () {
    try {
      var result = await callTool(ctx, TOOL_QUOTA, {});
      if (result && result.success) {
        quotaState.set(result);
      }
    }
    catch (error) {
      // 配额非关键，忽略
    }
  };

  var doTask = async function () {
    var prompt = promptState.value.trim();
    if (!prompt) {
      errorState.set("请输入要执行的任务");
      return;
    }
    var agents = selectedAgentsState.value && selectedAgentsState.value.length > 0 ? selectedAgentsState.value : null;
    broadcastBusyState.set(true);
    errorState.set("");
    broadcastResultState.set(null);
    pendingPlanState.set(null);
    // 计划模式：先生成计划，不执行；否则一步到位
    var mode = planModeState.value ? "plan" : "auto";
    statusTextState.set(planModeState.value ? "正在生成任务分配计划…" : "正在智能编排任务：拆解 → 分派 → 执行 → 汇总…");
    try {
      // 未勾选任何 agent 时不传 agents 字段（避免 null 触发 array 类型校验失败）
      var payload = { task: prompt, mode: mode };
      if (agents && agents.length > 0) {
        payload.agents = agents;
      }
      var result = await callTool(ctx, TOOL_TASK, payload);
      if (planModeState.value && result && result.success && result.plan) {
        // 计划模式：保存计划待确认，不执行
        pendingPlanState.set({
          task: prompt,
          agents: agents,
          plan: result.plan,
          fallbackUsed: !!result.fallbackUsed
        });
        pushLog({
          t: Date.now(),
          kind: "plan",
          text: "分配计划已生成 " + result.plan.length + " 个子任务，等待确认执行"
        });
      }
      else {
        broadcastResultState.set(result);
        pushLog({
          t: Date.now(),
          kind: "task",
          text: "任务编排完成 " + (result && result.executions ? result.executions.length : 0) + " 个子任务" + (result && result.elapsedMs ? "，总耗时 " + fmtMs(result.elapsedMs) : "")
        });
      }
    }
    catch (error) {
      errorState.set(toErrorText(error));
    }
    finally {
      broadcastBusyState.set(false);
      statusTextState.set("");
    }
  };

  var executePlan = async function () {
    var pending = pendingPlanState.value;
    if (!pending || !pending.plan) {
      errorState.set("没有待执行的计划");
      return;
    }
    broadcastBusyState.set(true);
    errorState.set("");
    broadcastResultState.set(null);
    statusTextState.set("按计划执行中：各 agent 独立会话并行执行 → 汇总…");
    try {
      var payload = { task: pending.task, mode: "execute", plan: pending.plan };
      if (pending.agents && pending.agents.length > 0) {
        payload.agents = pending.agents;
      }
      var result = await callTool(ctx, TOOL_TASK, payload);
      broadcastResultState.set(result);
      pendingPlanState.set(null);
      pushLog({
        t: Date.now(),
        kind: "task",
        text: "计划执行完成 " + (result && result.executions ? result.executions.length : 0) + " 个子任务" + (result && result.elapsedMs ? "，总耗时 " + fmtMs(result.elapsedMs) : "")
      });
    }
    catch (error) {
      errorState.set(toErrorText(error));
    }
    finally {
      broadcastBusyState.set(false);
      statusTextState.set("");
    }
  };

  var cancelPlan = function () {
    pendingPlanState.set(null);
    errorState.set("");
  };

  var toggleAgent = function (agentId) {
    var current = selectedAgentsState.value || [];
    var next = [];
    var found = false;
    for (var i = 0; i < current.length; i++) {
      if (current[i] === agentId) {
        found = true;
        continue;
      }
      next.push(current[i]);
    }
    if (!found) {
      next.push(agentId);
    }
    selectedAgentsState.set(next);
  };

  var children = [];

  // 标题区
  children.push(ctx.UI.Row({ verticalAlignment: "center" }, [
    ctx.UI.Icon({ name: "hub", tint: "primary" }),
    ctx.UI.Spacer({ width: 8 }),
    ctx.UI.Text({ text: "AIHub 协作台", style: "headlineSmall", fontWeight: "bold" })
  ]));
  children.push(ctx.UI.Text({
    text: "把 Operit 原生 5 个模型包装为独立 agent，可单问、可广播、可监控。",
    style: "bodyMedium",
    color: "onSurfaceVariant"
  }));

  // 顶部状态条
  var statusBarColor = "surfaceVariant";
  if (statusState.value === "ready") {
    statusBarColor = "primaryContainer";
  }
  else if (statusState.value === "error") {
    statusBarColor = "errorContainer";
  }
  else if (statusState.value === "loading") {
    statusBarColor = "tertiaryContainer";
  }
  children.push(ctx.UI.Card({ fillMaxWidth: true, containerColor: statusBarColor }, [
    ctx.UI.Row({ padding: 14, verticalAlignment: "center" }, [
      statusState.value === "loading"
        ? ctx.UI.CircularProgressIndicator({ width: 16, height: 16, strokeWidth: 2 })
        : ctx.UI.Icon({
          name: statusState.value === "ready" ? "checkCircle" : (statusState.value === "error" ? "error" : "info"),
          tint: "onSurfaceVariant"
        }),
      ctx.UI.Spacer({ width: 8 }),
      ctx.UI.Column({ spacing: 2 }, [
        ctx.UI.Text({ text: statusTextState.value || (statusState.value === "ready" ? "就绪" : "未初始化"), style: "bodyMedium", fontWeight: "semiBold" }),
        configState.value
          ? ctx.UI.Text({ text: "承载配置: " + asText(configState.value.name), style: "bodySmall", color: "onSurfaceVariant" })
          : ctx.UI.Text({ text: "运行 aihub_setup 建立 agent 角色卡", style: "bodySmall", color: "onSurfaceVariant" })
      ]),
      ctx.UI.Spacer({ weight: 1 }),
      ctx.UI.Button({
        text: "刷新",
        onClick: function () { return refreshStatus(); }
      })
    ])
  ]));

  // 操作按钮区：一键设置 / 刷新 / 用量
  children.push(ctx.UI.Row({ spacing: 8 }, [
    ctx.UI.Button({
      text: setupBusyState.value ? "设置中…" : "一键设置",
      enabled: !setupBusyState.value,
      onClick: function () { return doSetup(); }
    }),
    ctx.UI.Button({
      text: "用量",
      onClick: function () { return loadQuota(); }
    }),
    ctx.UI.Button({
      text: "状态",
      onClick: function () { return refreshStatus(); }
    })
  ]));

  // 用量信息（如果有）
  if (quotaState.value) {
    var quota = quotaState.value;
    children.push(ctx.UI.Card({ fillMaxWidth: true, containerColor: "surfaceVariant" }, [
      ctx.UI.Column({ padding: 14, spacing: 6 }, [
        ctx.UI.Text({ text: "模型配置: " + asText(quota.configName) + " (" + asText(quota.configId) + ")", style: "bodyMedium", fontWeight: "semiBold" }),
        ctx.UI.Text({ text: "Provider: " + asText(quota.provider), style: "bodySmall", color: "onSurfaceVariant" }),
        ctx.UI.Text({ text: "模型列表: " + ((quota.modelList || []).join(", ")), style: "bodySmall", color: "onSurfaceVariant" }),
        ctx.UI.Text({ text: "限额: RPM=" + asText(quota.limits && quota.limits.requestLimitPerMinute) + " 并发=" + asText(quota.limits && quota.limits.maxConcurrentRequests), style: "bodySmall", color: "onSurfaceVariant" })
      ])
    ]));
  }

  // Agent 卡片列表
  children.push(ctx.UI.Text({ text: "Agents", style: "titleMedium", fontWeight: "semiBold" }));
  var agentList = agentListState.value || [];
  if (agentList.length === 0) {
    children.push(ctx.UI.Card({ fillMaxWidth: true, containerColor: "secondaryContainer" }, [
      ctx.UI.Row({ padding: 14, verticalAlignment: "center" }, [
        ctx.UI.Icon({ name: "info", tint: "onSecondaryContainer" }),
        ctx.UI.Spacer({ width: 8 }),
        ctx.UI.Text({ text: "暂无 agent 状态，点击「一键设置」或「刷新」", style: "bodySmall", color: "onSecondaryContainer" })
      ])
    ]));
  }
  else {
    for (var i = 0; i < agentList.length; i++) {
      var agent = agentList[i];
      var agentColor = AGENT_COLORS[agent.agent] || "#888888";
      var ready = !!agent.ready;
      var selected = (selectedAgentsState.value || []).indexOf(agent.agent) >= 0;
      var statusDot = ready ? "🟢" : "🔴";
      var statusLabel = ready ? "就绪" : (agent.modelIndex < 0 ? "模型缺失" : "未绑定");
      children.push(ctx.UI.Card({ fillMaxWidth: true }, [
        ctx.UI.Row({ padding: 12, verticalAlignment: "center" }, [
          ctx.UI.Surface({
            width: 44,
            height: 44,
            shape: { cornerRadius: 22 },
            containerColor: agentColor
          }, [
            ctx.UI.Box({ fillMaxSize: true, contentAlignment: "center" }, [
              ctx.UI.Text({ text: (agent.displayName || agent.agent).charAt(0), style: "titleMedium", color: "onPrimary", fontWeight: "bold" })
            ])
          ]),
          ctx.UI.Spacer({ width: 10 }),
          ctx.UI.Column({ weight: 1, spacing: 2 }, [
            ctx.UI.Text({ text: asText(agent.displayName || agent.agent), style: "bodyLarge", fontWeight: "semiBold" }),
            ctx.UI.Text({ text: (agent.modelName || "") + (agent.modelIndex >= 0 ? " [idx " + agent.modelIndex + "]" : ""), style: "bodySmall", color: "onSurfaceVariant" }),
            ctx.UI.Row({ spacing: 4, verticalAlignment: "center" }, [
              ctx.UI.Text({ text: statusDot, style: "bodySmall" }),
              ctx.UI.Text({ text: statusLabel, style: "bodySmall", color: ready ? "primary" : "error" })
            ])
          ]),
          ctx.UI.Text({ text: selected ? "✓ 已选" : "点选", style: "bodySmall", color: selected ? "primary" : "onSurfaceVariant" }),
          ctx.UI.Spacer({ width: 4 }),
          ctx.UI.Button({
            text: selected ? "取消" : "选择",
            onClick: function (agentId) { return function () { toggleAgent(agentId); }; }(agent.agent)
          })
        ])
      ]));
    }
  }

  // 任务编排区
  children.push(ctx.UI.Text({ text: "智能任务编排", style: "titleMedium", fontWeight: "semiBold" }));
  children.push(ctx.UI.Card({ fillMaxWidth: true }, [
    ctx.UI.Column({ padding: 14, spacing: 10 }, [
      ctx.UI.TextField({
        label: "任务",
        placeholder: "描述任务，AIHub 自动拆解分派给合适的 agent 执行…",
        value: promptState.value,
        onValueChange: promptState.set,
        singleLine: false
      }),
      ctx.UI.Text({ text: "参与范围: " + ((selectedAgentsState.value && selectedAgentsState.value.length > 0) ? selectedAgentsState.value.join(", ") : "自动分配（全部）"), style: "bodySmall", color: "onSurfaceVariant" }),
      ctx.UI.Row({ verticalAlignment: "center" }, [
        ctx.UI.Switch({
          checked: planModeState.value,
          onCheckedChange: function (checked) { planModeState.set(checked); pendingPlanState.set(null); }
        }),
        ctx.UI.Spacer({ width: 8 }),
        ctx.UI.Column({ spacing: 1 }, [
          ctx.UI.Text({ text: "计划模式", style: "bodyMedium", fontWeight: "semiBold" }),
          ctx.UI.Text({ text: planModeState.value ? "开启：先生成分配计划，确认后再执行" : "关闭：一步到位直接执行", style: "bodySmall", color: "onSurfaceVariant" })
        ])
      ]),
      ctx.UI.Button({
        text: broadcastBusyState.value ? (planModeState.value ? "生成计划中…" : "编排中…") : (planModeState.value ? "生成计划" : "开始编排"),
        enabled: !broadcastBusyState.value,
        fillMaxWidth: true,
        onClick: function () { return doTask(); }
      })
    ])
  ]));

  // 计划预览（计划模式生成后、确认执行前）
  if (pendingPlanState.value && !broadcastBusyState.value) {
    var pending = pendingPlanState.value;
    var pendingPlan = pending.plan || [];
    children.push(ctx.UI.Card({ fillMaxWidth: true, containerColor: "tertiaryContainer" }, [
      ctx.UI.Column({ padding: 14, spacing: 8 }, [
        ctx.UI.Text({ text: "分配计划（确认后执行）", style: "titleMedium", fontWeight: "bold", color: "onTertiaryContainer" }),
        ctx.UI.Text({ text: "任务: " + asText(pending.task), style: "bodySmall", color: "onTertiaryContainer" }),
        pendingPlan.map(function (p, idx) {
          return ctx.UI.Text({ text: (idx + 1) + ". " + asText(p.agent) + " ← " + clipText(p.subtask, 120), style: "bodySmall", color: "onTertiaryContainer" });
        }),
        ctx.UI.Row({ spacing: 8 }, [
          ctx.UI.Button({
            text: "✓ 确认执行",
            fillMaxWidth: true,
            onClick: function () { return executePlan(); }
          }),
          ctx.UI.Button({
            text: "取消",
            onClick: function () { return cancelPlan(); }
          })
        ])
      ])
    ]));
  }

  // 执行中进度提示（非阻塞，让用户知道在跑）
  if (broadcastBusyState.value) {
    children.push(ctx.UI.Card({ fillMaxWidth: true, containerColor: "tertiaryContainer" }, [
      ctx.UI.Column({ padding: 12, spacing: 8 }, [
        ctx.UI.Row({ verticalAlignment: "center" }, [
          ctx.UI.CircularProgressIndicator({ width: 18, height: 18, strokeWidth: 2 }),
          ctx.UI.Spacer({ width: 10 }),
          ctx.UI.Text({ text: "编排进行中…", style: "bodyMedium", fontWeight: "semiBold", color: "onTertiaryContainer" })
        ]),
        ctx.UI.Text({
          text: "正在拆解任务 → 各 agent 独立会话并行执行 → 汇总最终结果。多 agent 场景通常需要 2-4 分钟，可在对应「AIHub/xxx」会话中查看实时进度。",
          style: "bodySmall",
          color: "onTertiaryContainer"
        })
      ])
    ]));
  }

  // 编排结果（最终结果置顶，各 agent 详情折叠）
  if (broadcastResultState.value) {
    var result = broadcastResultState.value;
    // 最终结果（最优先展示）
    if (result.finalResult) {
      children.push(ctx.UI.Card({ fillMaxWidth: true, containerColor: "secondaryContainer" }, [
        ctx.UI.Column({ padding: 14, spacing: 6 }, [
          ctx.UI.Row({ verticalAlignment: "center" }, [
            ctx.UI.Text({ text: "最终结果", style: "titleMedium", fontWeight: "bold" }),
            ctx.UI.Spacer({ weight: 1 }),
            ctx.UI.Text({ text: result.elapsedMs ? "总耗时 " + fmtMs(result.elapsedMs) : "", style: "bodySmall", color: "onSurfaceVariant" })
          ]),
          ctx.UI.Text({ text: "任务: " + asText(result.task), style: "bodySmall", color: "onSurfaceVariant" }),
          ctx.UI.Text({ text: asText(result.finalResult), style: "bodyMedium" })
        ])
      ]));
    }
    // 分配计划（简要）
    var planList = result.plan || [];
    if (planList.length > 0) {
      children.push(ctx.UI.Card({ fillMaxWidth: true, containerColor: "surfaceVariant" }, [
        ctx.UI.Column({ padding: 12, spacing: 4 }, [
          ctx.UI.Text({ text: "分配计划" + (result.fallbackUsed ? "（已降级）" : ""), style: "bodyMedium", fontWeight: "semiBold" }),
          planList.map(function (p, idx) {
            return ctx.UI.Text({ text: (idx + 1) + ". " + asText(p.agent) + " ← " + clipText(p.subtask, 80), style: "bodySmall", color: "onSurfaceVariant" });
          })
        ])
      ]));
    }
    // 各 agent 结果（回复截断，避免页面巨长）
    var execList = result.executions || [];
    if (execList.length > 0) {
      children.push(ctx.UI.Text({ text: "各 agent 执行详情", style: "titleMedium", fontWeight: "semiBold" }));
    }
    for (var j = 0; j < execList.length; j++) {
      var item = execList[j];
      children.push(ctx.UI.Card({ fillMaxWidth: true }, [
        ctx.UI.Column({ padding: 12, spacing: 4 }, [
          ctx.UI.Row({ verticalAlignment: "center" }, [
            ctx.UI.Text({ text: asText(item.agent), style: "bodyMedium", fontWeight: "semiBold" }),
            ctx.UI.Spacer({ weight: 1 }),
            ctx.UI.Text({ text: (item.success ? "✓ " : "✗ ") + fmtMs(item.elapsedMs), style: "bodySmall", color: item.success ? "primary" : "error" })
          ]),
          ctx.UI.Text({ text: clipText(item.subtask, 100), style: "bodySmall", color: "onSurfaceVariant" }),
          ctx.UI.Text({
            text: item.success ? clipText(item.reply, 300) : ("错误: " + asText(item.error)),
            style: "bodySmall",
            color: "onSurfaceVariant"
          })
        ])
      ]));
    }
  }

  // 错误提示
  if (errorState.value.trim()) {
    children.push(ctx.UI.Card({ fillMaxWidth: true, containerColor: "errorContainer" }, [
      ctx.UI.Row({ padding: 14, verticalAlignment: "center" }, [
        ctx.UI.Icon({ name: "error", tint: "onErrorContainer" }),
        ctx.UI.Spacer({ width: 8 }),
        ctx.UI.Text({ text: errorState.value, style: "bodyMedium", color: "onErrorContainer" })
      ])
    ]));
  }

  // 日志区
  children.push(ctx.UI.Text({ text: "最近日志", style: "titleMedium", fontWeight: "semiBold" }));
  if (logState.value.length === 0) {
    children.push(ctx.UI.Text({ text: "暂无日志", style: "bodySmall", color: "onSurfaceVariant" }));
  }
  else {
    for (var k = 0; k < logState.value.length; k++) {
      var entry = logState.value[k];
      children.push(ctx.UI.Row({ verticalAlignment: "center" }, [
        ctx.UI.Text({ text: new Date(entry.t).toLocaleTimeString(), style: "bodySmall", color: "onSurfaceVariant", width: 70 }),
        ctx.UI.Spacer({ width: 6 }),
        ctx.UI.Text({ text: "[" + entry.kind + "] " + entry.text, style: "bodySmall" })
      ]));
    }
  }

  return ctx.UI.LazyColumn({
    onLoad: async function () {
      if (!hasInitializedState.value) {
        hasInitializedState.set(true);
        try {
          await refreshStatus();
        }
        catch (error) {
          errorState.set(toErrorText(error));
        }
      }
    },
    fillMaxSize: true,
    padding: 16,
    spacing: 14
  }, children);
}