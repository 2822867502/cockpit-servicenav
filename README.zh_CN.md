# Cockpit 服务导航插件 (servicenav)

[![License](https://img.shields.io/badge/license-GPLv3-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-130%20passed-brightgreen.svg)](test-reports/)

Cockpit 管理界面的服务导航插件。以卡片或列表形式展示可配置的子服务（如 Portainer、Grafana、自定义 Web 应用），支持一键跳转。

**作者**: deepseek v4 pro & zlk

**仓库**: [github.com/2822867502/cockpit-servicenav](https://github.com/2822867502/cockpit-servicenav)

[English Documentation](README.md)

---

## 功能特性

- **服务卡片 / 列表**：响应式卡片网格或紧凑列表视图
- **智能 URL 解析**：支持绝对地址或相对端口号（自动拼接当前 Cockpit 主机和协议）
- **每服务独立 HTTPS 模式**：跟随 Cockpit / 强制 HTTPS / 强制 HTTP
- **图标显示**：`<img>` 标签直接加载 `/favicon.ico`，失败回退默认图标
- **CRUD 管理**：模态表单界面添加/编辑/删除服务
- **配置持久化**：通过 `cockpit.localStorage` 存储，无需文件系统权限
- **深色模式**：从父 Cockpit 窗口同步 `pf-v6-theme-dark` 主题
- **多语言**：默认简体中文，英文回退
- **PatternFly 5 UI**：与 Cockpit 设计系统一致

## 环境要求

- **Cockpit** 270 或更高版本
- **Node.js** 18+
- **npm** 9+

## 快速开始

```bash
git clone https://github.com/2822867502/cockpit-servicenav.git
cd cockpit-servicenav
npm install
npm run build
sudo make install      # 安装到 /usr/local/share/cockpit/
```

在 Cockpit 侧边栏中找到「服务导航」。

### 开发模式

```bash
npm run watch          # 文件变更自动重新构建
make devel-install     # 符号链接到 ~/.local/share/cockpit/
```

## 配置说明

### 存储方式

配置通过 `cockpit.localStorage` 存储（键名：`servicenav-config`）。开发模式下回退到浏览器 `localStorage`。无需文件系统权限。

### 配置格式

```json
{
  "version": 1,
  "viewMode": "grid",
  "services": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Grafana 监控",
      "url": "3000",
      "httpsMode": "follow",
      "iconType": "auto",
      "iconUrl": null,
      "description": "指标和监控面板",
      "createdAt": "2026-06-25T10:00:00.000Z",
      "updatedAt": "2026-06-25T10:00:00.000Z"
    }
  ]
}
```

### URL 配置

| 类型 | 示例 | 行为 |
|---|---|---|
| **相对端口** | `8080` | 使用当前 Cockpit 主机 + httpsMode 协议 |
| **相对端口 + 路径** | `9090/admin` | 使用当前 Cockpit 主机 + 指定路径 |
| **绝对 URL** | `https://example.com:3000` | 直接使用，不受 httpsMode 影响 |

如果 Cockpit 通过 `https://10.0.2.1:9090` 访问，配置端口 `8080` 将打开 `https://10.0.2.1:8080`。

### 每服务 HTTPS 模式

每个服务有独立的 `httpsMode` 字段：

| 值 | 说明 |
|---|---|
| `follow`（默认） | 使用当前 Cockpit 页面的协议 |
| `https` | 强制 `https://` |
| `http` | 强制 `http://` |

绝对地址（以 `http://` 或 `https://` 开头）不受此设置影响。

### 图标配置

| 模式 | 说明 |
|---|---|
| `auto` | 通过 `<img>` 标签加载服务的 `/favicon.ico` |
| `url` | 使用用户提供的图标 URL（支持相对端口如 `5080/path` 或 `http://:5080/path`） |
| `none` | 显示默认立方体图标 |

## 深色模式

插件通过 `MutationObserver` 监听父 Cockpit 窗口的 `<html>` 类名变化，将 `pf-v6-theme-dark` / `pf-theme-dark` 同步到插件 iframe。CSS 使用三层策略：

1. `color-scheme: dark` — 浏览器原生暗色渲染
2. **PF5 设计令牌覆写** — 50+ 个 `--pf-v5-*` CSS 变量设为暗色值
3. **直接 CSS 选择器** — 针对 PF5 组件类名（`pf-v5-c-form-control`、`pf-v5-c-card` 等）

## 目录结构

```
cockpit-servicenav/
├── build.js                 # esbuild 构建脚本
├── Makefile                 # 顶层构建目标
├── package.json             # NPM 配置和依赖
├── tsconfig.json            # TypeScript 配置
├── jest.config.js           # Jest 测试配置
├── manifest.json            # Cockpit 插件描述文件
├── README.md                # 英文文档
├── README.zh_CN.md          # 中文文档（本文件）
│
├── src/
│   ├── index.html           # Cockpit 加载的入口 HTML
│   ├── index.tsx            # React 启动 + 主题同步
│   ├── app.tsx              # 根 App 组件
│   ├── components/          # React UI 组件（10 个）
│   ├── hooks/               # React 自定义 hooks（2 个）
│   ├── lib/                 # 工具模块（6 个）
│   └── styles/              # 插件样式
│
├── test/                    # 10 个测试套件，126 个测试
└── po/                      # 翻译参考文件
```

## 可用命令

```bash
npm run build         # 构建到 dist/
npm run watch         # 构建并监听文件变更
npm test              # 运行 126 个 Jest 测试
npm run lint          # ESLint 检查
npm run typecheck     # TypeScript 类型检查
npm run clean         # 清理构建产物
```

## 测试

```bash
npm test              # 126 个测试，10 个套件
```

测试使用完整的 `cockpit` 全局 API mock，无需安装 Cockpit。

## 国际化

默认语言为**简体中文**，英文为回退语言。

**语言检测优先级：**
1. `navigator.language` — 浏览器语言
2. `cockpit.locale()` — Cockpit 区域设置
3. `cockpit.language` — Cockpit 用户偏好
4. 默认：`zh_CN`

翻译映射嵌入在 `src/lib/i18n.ts` 中。添加新语言时，参照 `zhCN` 字典模式新增即可。

## 故障排查

### 深色模式未生效

1. 打开浏览器 DevTools，检查 `<html>` 是否有 `pf-theme-dark` 类
2. 在控制台执行：`document.documentElement.classList`
3. 若缺失，检查 `index.tsx` 中的 `bootstrap()` 主题同步逻辑
4. 确认 Cockpit 父窗口 `<html>` 有 `pf-v6-theme-dark` 类

### 服务列表为空或添加失败

1. 打开 DevTools → Application → Local Storage
2. 检查 `servicenav-config` 键是否存在且为合法 JSON
3. 查看控制台是否有 `[servicenav]` 错误日志

### 图标不显示

1. 目标服务必须可从浏览器访问
2. `auto` 模式下目标服务需提供 `/favicon.ico`
3. `url` 模式下图标 URL 需可访问
4. 可将图标类型设为 `none` 使用默认图标
5. 检查浏览器 Network 面板中 favicon 请求状态

### `TypeError: object is not iterable`

配置文件 `services` 字段为对象而非数组。插件有 `ensureArray()` 保护，会自动降级为空数组恢复。

## 版权声明

- 本插件：GNU General Public License v3.0 — Copyright (C) 2026 deepseek v4 pro & zlk
- Cockpit API：LGPL-2.1（插件作为独立作品使用其公共 API）
- PatternFly 5：MIT License（GPL 兼容）
- React：MIT License（GPL 兼容）

## 贡献指南

1. 提交前确保通过全部检查：`npm run lint && npm run typecheck && npm test`
2. 遵循现有代码风格和模式
3. 为新功能添加测试
4. 为新增用户可见字符串更新 `i18n.ts` 翻译
