# AIHub 多Agent协作台 · 开发心得与踩坑记录

> 包 ID：`com.agent.swarm` ｜ 仓库：`github.com/gzxxw/aihub-agent-swarm` ｜ 版本历程：v0.1.3 智能编排 → v0.1.4 防中断 → DeepSeek 网页版接入
>
> 本文档记录本项目从 0 到 1 的真实开发过程：踩过的坑、绕过的弯、以及**最终没能完全实现、只能妥协的地方**。希望给后来做 Operit 插件（尤其是网页版 agent）的开发者省点时间。

---

## 一、项目是什么

把 Operit 原生多个模型包装成独立 agent 的协作台：

- **5 个模型 agent**：DeepSeek V4 Flash / V4.1 Flash、GLM 5.2、Kimi K3、商汤 SenseNova Lite（各有人设，FIXED_CONFIG 绑角色卡）
- **1 个网页版 agent**：DeepSeek 网页版（浏览器自动化 + cookie 登录，免 API Key）
- **8 个工具**：aihub_advice / setup / ask / broadcast / status / quota / task / weblogin
- **UI**：Compose DSL 侧边栏协作台，任务编排支持计划模式（plan/execute/auto）

---

## 二、踩过的坑（按杀伤力排序）

### 坑 1：命名空间写错——`Tools.Network` 不存在，实际是 `Tools.Net`

- **现象**：点了「登录」按钮完全没反应，连报错都没有，静默失败。
- **排查**：看日志无果 → 用 `debug_run_sandbox_script` 运行时探测 `typeof Tools.Network` = **undefined**，`typeof Tools.Net` = object。
- **根因**：types 定义文件里写的是 `Net`，凭印象写了 `Network`，调用直接抛空。
- **教训**：写插件前先探测运行时 API，别信文档/记忆。`Object.keys(Tools.Net)` 列一遍最靠谱。

### 坑 2：浏览器会话是内置常驻的，`startBrowser`/`stopBrowser` 根本不存在

- **现象**：以为要先手动启动浏览器会话。
- **实测**：`Tools.Net` 下 27 个方法里**没有 startBrowser/stopBrowser**；直接 `browserNavigate({url})` 就是复用系统常驻会话。
- **结论**：Operit 的浏览器是系统级常驻会话，不需要自己起停，别传 `session_name` 之类的臆造参数。

### 坑 3：UI 排版——往 Row 里塞 3 个按钮，文字被挤成 D-e-e-p-S-e-e-k

- **现象**：DeepSeek 卡片文字逐字垂直换行，按钮堆叠混乱。
- **根因**：Row 宽度有限，`Column(weight:1)` 被压到极窄，中文被逐字折断。
- **修复**：网页 agent 卡片改 **Column 布局**（信息行 + 独立操作区），普通 agent 卡片保持 Row。
- **教训**：内容多的卡片优先 Column 分区块，按钮别硬塞 Row。

### 坑 4：browserClick 报 WebView 线程错误，只能绕道 browserEvaluate

- **现象**：`browserClick({ref})` 报错：
  ```
  A WebView method was called on thread 'Thread-739'.
  All WebView methods must be called on the same thread.
  ```
- **结论**：browserClick 从沙盒线程调 WebView 方法直接炸，**无法从沙盒侧修复**。
- **解法**：全部改用 `browserEvaluate` 页面内执行 JS `.click()`——这是唯一能绕过线程问题且能看到返回值的通道。

### 坑 5：DeepSeek 的「发送按钮」不是真 `<button>`

- 快照里发送按钮是 `<div role="button" class="ds-button--iconLabelPrimary">`，不是 `<button>`。
- `browserType` 能成功填字，但 `press('Enter')` 发不出去。
- **最终**：`browserEvaluate` 里遍历 `div[role=button]`，匹配 `iconLabelPrimary` / `ds-button--primary` 后 `.click()`，实测秒发。

### 坑 6：调试 API 选型——只有 browserEvaluate 能回显结果

- 试过 `browserRunCode` 等，看不到返回值；`browserEvaluate` 会返回 `### Result` 结构化的执行结果。
- **结论**：所有页面操作尽量走 `browserEvaluate`，一行 JS 一个结果，可观测性最好。

### 坑 7：回复完成判据——「停止生成按钮消失」不可靠

- **第一版**：外部轮询快照，等「停止生成」消失 = 回复完成。
- **问题**：快照字符串匹配容易误判，还经常把用户消息当回复，之前就栽在这一步。
- **最终方案**（借鉴成熟 DeepSeek 助手插件的 `sendAndWaitReply`）：
  ```js
  // 页面内 Promise + setInterval 轮询 AI 回复块计数
  const getReplyCount = () => document.querySelectorAll(
    'div.ds-markdown.ds-assistant-message-main-content').length;
  const prevCount = getReplyCount();
  // 填消息 -> 点发送 -> 每 2s 数一次块数，增加即拿到回复
  // 一次 browserEvaluate 调用完成「发送+等待+抓取」闭环
  ```
- **附带好处**：等回复不占用沙盒串行调用额度，且一次调用拿回完整 reply。

### 坑 8：防中断——任务跑到一半被限额/超时砍掉

- **旧逻辑**：`sendAndCollect` 等所有 agent 回复完才返回 → 长任务超时被中断。
- **修复**：① 发出即返回；② 后台轮询收集；③ 严格串行防限额；④ UI 三态展示（✓有回复 / ⏳已发送待回复 / ✗失败）。
- **效果**：用户提交任务后切走页面干别的，任务在独立会话继续跑，回来后刷新拿结果。

### 坑 9：GitHub 同步——Contents API 改文件不产生 git 历史，本地副本分叉

- **现象**：git push 被拒（远端有本地没有的提交），`pull --rebase` 一堆 add/add 冲突。
- **根因**：之前几轮用 GitHub Contents API 直接传文件，远端 git 历史没跟着走，本地 `/tmp` git 副本的 HEAD 与远端分叉。
- **解法**：放弃 git push，统一走 **Contents API 单文件上传**（先 GET 拿 sha → base64 内容 PUT）。
- **教训**：同步方式要统一——要么全程 git，要么全程 API，别混用。

### 坑 10：React 受控组件的填值玄学

- 直接 `input.value = xxx` 对 React 受控组件无效，必须用**原生 value setter + 手动触发 input 事件**：
  ```js
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  ```
- DeepSeek 登录页切换「密码登录」tab 时按钮也不是真 button，用正则从快照匹配 ref 再点。

### 坑 11（安全）：GITHUB_TOKEN 明文出现在终端命令里

- 多轮同步在 shell 命令里直接写了 `TOKEN='ghp_...'`，命令记录在日志/历史中。
- **强烈建议开发者重置该 token**（项目代码本身无任何 key 泄露，但命令历史里有）。
- **教训**：token 应该走 Operit 环境变量/配置文件，别裸写在命令行。

---

## 三、无法完全实现 / 只能妥协的地方

1. **browserClick 线程错误**：无法从沙盒侧修复，只能全部绕到 `browserEvaluate` 的 JS 层，牺牲了可读性，也意味着所有交互都要手写 DOM 选择器。
2. **网页版依赖前端 DOM 结构**：`ds-markdown` 类名、`iconLabelPrimary` 按钮、`textarea[placeholder*=发送消息]` 这些都是 DeepSeek 前端的实现细节，**页面改版就可能失效**——这是网页版 agent 的固有脆弱点，永远没有官方 API 稳。
3. **cookie 登录态有效期不可控**：登录态过期只能重新 `aihub_weblogin`，做不到 API Key 那样长期有效；且 cookie 保存/注入依赖 `Tools.Net` 的 cookies 接口，能力受限。
4. **无法并发**：为防限额严格串行，多 agent 任务要排队；网页版回复生成慢（最长等 60s），排队体验更明显。
5. **长回复截断风险**：第一版回复抓取有 3000 字符截断；新闭环方案直接拿 innerText，但超长回复仍可能撑爆上下文，没有做智能截断。
6. **豆包等其他网页 agent 未实现**：方案可复制，但每个站点的 DOM 结构不同，需要逐个适配调试，属于「看得见但没做完」的延后项。
7. **历史会话复用只做到了一半**：借鉴了 `chatId` 续聊思路，但没把 `deepseek_list_history` 类的历史列表工具做进 AIHub。

---

## 四、验证有效的工程做法（正面经验）

- **每轮改动三件套**：`node --check` 语法 → METADATA 工具数与 exports 核对 → `debug_install_toolpkg` 烧录。
- **疑难问题用沙盒实测**：`debug_run_sandbox_script` 能在不碰 UI 的情况下探测运行时真相（命名空间、DOM 结构、按钮 ref），本项目大部分疑难都靠它定位。
- **页面内闭环优于外部轮询**：能在一个 browserEvaluate 里完成的（填字→发送→等回复→抓取）绝不分步外部轮询，又快又稳。
- **UI 三态 + 后台收集**：切页面也不怕任务丢，回来刷新拿结果。
- **角色卡 FIXED_CONFIG 绑定模型**：人设与模型隔离清晰，setup 自动建卡可复用。

---

## 五、给后来者

- **运行时 API 以探测为准**：`Tools.Net` 全家桶（browserNavigate / browserEvaluate / browserSnapshot / browserType / cookies），写之前先 `Object.keys` 列一遍。
- **调试神器**：`debug_run_sandbox_script` + `debug_install_toolpkg` 组合拳。
- **GitHub 同步**：统一用 Contents API，或全程维护 git 历史，别混用。
- **网页版 agent 是「能跑但脆弱」的方案**：适合免 Key 快速体验，生产级还是建议走官方 API。

---

*最后更新：2026-10-02 · 记录自 aiub-agent-swarm 真实开发过程。*
