# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TOAST UI Image Editor — 基于 HTML5 Canvas 的全功能图片编辑器（纯 JS 组件），由 NHN Cloud 维护。基于 [fabric.js](https://github.com/fabricjs/fabric.js) v5.3.0 构建。项目使用 Lerna 管理，包含三个包：

- `apps/image-editor` — 核心组件（`tui-image-editor`）
- `apps/react-image-editor` — React 包装器（`@toast-ui/react-image-editor`）
- `apps/vue-image-editor` — Vue 2 包装器（`@toast-ui/vue-image-editor`）

## Build & Test Commands

```sh
# 安装依赖
npm install

# 构建全部包
npm run build

# 分包构建
npm run build:image-editor
npm run build:react
npm run build:vue

# 项目已完成构建配置优化，无需设置任何 NODE_OPTIONS 环境变量即可在现代 Node/OpenSSL 环境下直接运行构建。

# 核心包测试
cd apps/image-editor && npm test

# 运行单个测试文件
cd apps/image-editor && npx jest -- path/to/test.spec.js

# 类型检查
cd apps/image-editor && npm run test:types

# React wrapper 测试
cd apps/react-image-editor && npm test

# Vue wrapper 测试
cd apps/vue-image-editor && npm test

# 代码风格检查
npx eslint apps/image-editor/src

# 文档生成
cd apps/image-editor && npm run doc

# 开发服务器（Storybook 演示）
cd apps/image-editor && npm run serve
```

## Architecture

### Core Package (`apps/image-editor`)

核心编辑器采用 **Command + Component + Action** 三层架构，主要逻辑集中在 `apps/image-editor/src/js/` 下：

1. **`imageEditor.js`** — 主入口类，协调 Invoker、UI、Graphics、Command 执行和公共事件。
2. **`invoker.js`** — Command 执行器，维护 undo/redo 双栈，所有有副作用的操作都通过它执行。内部通过 `commandFactory.create(name, ...args)` 按名称查找并创建 Command。
3. **`command/`** — 每个可撤销的操作都是一个独立文件（如 `addShape.js`、`rotate.js`），导出 `{name, execute, undo}` 结构并通过 `commandFactory.register` 注册。
4. **`interface/command.js`** — 命令抽象基类 `Command`，提供 `setUndoData`、`setExecuteCallback` 等公共能力。
5. **`graphics.js`** — 封装 fabric.js 底层操作，是所有 Component 操作 Canvas 的统一通道。
6. **`graphicsRegistry.js`** — Graphics 的 Component 与 DrawingMode 实例注册表，集中维护构造顺序。
7. **`component/`** — 功能模块（`cropper`、`filter`、`flip`、`shape`、`text` 等），继承 `Component` 基类，持有 `graphics` 引用。
8. **`drawingMode/`** — 每种绘画/编辑模式的类（`cropper`、`shape`、`text`、`freeDrawing` 等），控制 canvas 的交互行为。
9. **`eventBinder.js`** — 将事件名到 handler 名的映射绑定到 `CustomEvents` 目标，避免在协调层重复手写 `.on()` 映射。
10. **`basicUtil.js` / `util.js`** — 低层纯函数拆到 `basicUtil.js`，`util.js` 保持兼容 re-export 并保留业务相关工具。
11. **`extension/`** — fabric.js 的插件扩展（`blur`、`mask`、`arrowLine`、`cropzone` 等）。
12. **`action.js`** — UI 层的动作映射，通过 mixin 挂到 ImageEditor 上，将 UI 事件翻译为 Command 调用。
13. **`ui/`** — UI 渲染层，使用 Stylus 编写样式（`css/`），模板生成 HTML 字符串（`ui/template/`）。`ui/helpMenu.js` 负责帮助菜单分组与分隔符顺序。

### Key Design Patterns

- **Mixin 模式**：ImageEditor 通过 mixin 组合 Action、Invoker 等能力，而非传统继承。
- **Command 注册**：`index.js` 中 side-effect import 所有 command 模块，触发 `register` 注册到 `commandFactory` 的 map 中。
- **事件驱动**：通过 `tui-code-snippet` 的 `CustomEvents` 实现组件间通信。
- **`@/` 路径别名**：`src/js/` 目录；`@css/` 指向 `src/css/`。jest 中对应映射见 `jest.config.js`。

### Wrapper Packages

- React 包装器仅作薄封装，创建 `TuiImageEditor` 实例并通过 `onXxx` 属性透传事件。事件同步 helper 会处理新增、替换和删除 handler prop。
- Vue 包装器同理，将原生实例暴露给模板。`src/options.js` 负责 include UI 默认项合并，避免污染共享默认对象。

## Recent Refactor Notes

- 重构计划与执行证据见 `docs/refactor-plan.md`。
- 最新模块职责清单见 `docs/project-structure.md`。
- 核心包新增测试覆盖：`eventBinder.spec.js`、`graphicsRegistry.spec.js`、`helpMenu.spec.js`、`basicUtil.spec.js`。
- Wrapper 新增覆盖：React handler prop 删除解绑；Vue option merge 不污染默认 include UI 配置。
- `getRgb('#abc')` 测试锁定当前历史行为，后续如需修正 shorthand 解析应单独评估兼容性。

## Coding Conventions

- 使用 Stylus (`.styl`) 编写样式
- 使用 Babel 转译，无 TypeScript（类型定义在根目录 `index.d.ts`）
- 依赖 `tui-code-snippet` 提供工具函数（`isString`、`extend`、`CustomEvents` 等）
- 模块路径引用使用别名（`@/xxx`、`@css/xxx`、`@svg/xxx`）
