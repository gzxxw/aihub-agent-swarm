"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerToolPkg = registerToolPkg;
exports.onApplicationCreate = onApplicationCreate;
const aihub_ui_1 = __importDefault(require("./ui/aihub/index.ui.js"));

function registerToolPkg() {
    // 1. UI 路由：AIHub 主界面
    ToolPkg.registerUiRoute({
        id: "aihub_dashboard",
        runtime: "compose_dsl",
        screen: aihub_ui_1.default,
        params: {},
        title: {
            zh: "AIHub 协作台",
            en: "AIHub Hub"
        }
    });

    // 2. 侧边栏入口（主侧边栏插件区，用户明确要求必须有侧边栏及其相关功能）
    ToolPkg.registerNavigationEntry({
        id: "aihub_main_sidebar",
        route: "toolpkg:com.agent.swarm:ui:aihub_dashboard",
        surface: "main_sidebar_plugins",
        title: {
            zh: "AIHub 协作台",
            en: "AIHub Hub"
        },
        icon: "hub",
        order: 10
    });

    // 3. 工具箱入口（备选）
    ToolPkg.registerNavigationEntry({
        id: "aihub_toolbox",
        route: "toolpkg:com.agent.swarm:ui:aihub_dashboard",
        surface: "toolbox",
        title: {
            zh: "AIHub 协作台",
            en: "AIHub Hub"
        },
        icon: "hub",
        order: 10
    });

    // 4. 应用生命周期 hook（预留：冷启动延迟 + 状态初始化）
    ToolPkg.registerAppLifecycleHook({
        id: "aihub_app_create",
        event: "application_on_create",
        function: onApplicationCreate
    });

    return true;
}

function onApplicationCreate() {
    // 预留：冷启动时不做重活，避免 ANR。需要初始化时在延迟后触发。
    return { ok: true };
}