# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TOAST UI Image Editor — 基于 HTML5 Canvas 的全功能图片编辑器（纯 JS 组件），由 NHN Cloud 维护。基于 [fabric.js](https://github.com/fabricjs/fabric.js) v4.2.0 构建。项目使用 Lerna 管理，包含三个包：

- `apps/image-editor` — 核心组件（`tui-image-editor`）
- `apps/react-image-editor` — React 包装器（`@toast-ui/react-image-editor`）
- `apps/vue-image-editor` — Vue 2 包装器（`@toast-ui/vue-image-editor`）

## Build & Test Commands

```sh
# 安装依赖
npm install

# 构建全部包
npm run build

# 仅构建核心编辑器
cd apps/image-editor && npm run build

# 运行测试（仅核心包）
cd apps/image-editor && npm test

# 运行单个测试文件
cd apps/image-editor && npx jest -- path/to/test.spec.js

# 类型检查
cd apps/image-editor && npm run test:types

# 开发服务器（Storybook 演示）
cd apps/image-editor && npm run serve
```

## Architecture

### Core Package (`apps/image-editor`)

核心编辑器采用 **Command + Component + Action** 三层架构，所有逻辑集中在 `apps/image-editor/src/js/` 下：

1. **`imageEditor.js`** — 主入口类，将 Action、Invoker、UI、Graphics 通过 mixin 组合为 `ImageEditor` 公共 API。
2. **`invoker.js`** — Command 执行器，维护 undo/redo 双栈，所有有副作用的操作都通过它执行。内部通过 `commandFactory.create(name, ...args)` 按名称查找并创建 Command。
3. **`command/`** — 每个可撤销的操作都是一个独立文件（如 `addShape.js`、`rotate.js`），导出 `{name, execute, undo}` 结构并通过 `commandFactory.register` 注册。
4. **`interface/command.js`** — 命令抽象基类 `Command`，提供 `setUndoData`、`setExecuteCallback` 等公共能力。
5. **`graphics.js`** — 封装 fabric.js 底层操作，是所有 Component 操作 Canvas 的统一通道。
6. **`component/`** — 功能模块（`cropper`、`filter`、`flip`、`shape`、`text` 等），继承 `Component` 基类，持有 `graphics` 引用。
7. **`drawingMode/`** — 每种绘画/编辑模式的类（`cropper`、`shape`、`text`、`freeDrawing` 等），控制 canvas 的交互行为。
8. **`extension/`** — fabric.js 的插件扩展（`blur`、`mask`、`arrowLine`、`cropzone` 等）。
9. **`action.js`** — UI 层的动作映射，通过 mixin 挂到 ImageEditor 上，将 UI 事件翻译为 Command 调用。
10. **`ui/`** — UI 渲染层，使用 Stylus 编写样式（`css/`），模板生成 HTML 字符串（`ui/template/`）。

### Key Design Patterns

- **Mixin 模式**：ImageEditor 通过 mixin 组合 Action、Invoker 等能力，而非传统继承。
- **Command 注册**：`index.js` 中 side-effect import 所有 command 模块，触发 `register` 注册到 `commandFactory` 的 map 中。
- **事件驱动**：通过 `tui-code-snippet` 的 `CustomEvents` 实现组件间通信。
- **`@/` 路径别名**：`src/js/` 目录；`@css/` 指向 `src/css/`。jest 中对应映射见 `jest.config.js`。

### Wrapper Packages

- React 包装器仅作薄封装，创建 `TuiImageEditor` 实例并通过 `onXxx` 属性透传事件。
- Vue 包装器同理，将原生实例暴露给模板。

## Coding Conventions

- 使用 Stylus (`.styl`) 编写样式
- 使用 Babel 转译，无 TypeScript（类型定义在根目录 `index.d.ts`）
- 依赖 `tui-code-snippet` 提供工具函数（`isString`、`extend`、`CustomEvents` 等）
- 模块路径引用使用别名（`@/xxx`、`@css/xxx`、`@svg/xxx`）
