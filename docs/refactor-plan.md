# 重构计划

## 1. 项目快照

- 生成日期：2026-07-08
- 范围：`tui.image-editor` monorepo，重点为 `apps/image-editor` 核心包与 React/Vue wrapper。
- 目标：在不改变公开 API 与编辑行为的前提下，降低核心编排层复杂度，补强 wrapper 与高频编辑行为测试。
- 文档刷新目标：新增/刷新 `docs/project-structure.md`，同步更新 `README.md` 的项目结构与开发命令说明。

## 2. 架构与模块分析

| 模块 | 关键文件 | 当前职责 | 主要痛点 | 测试覆盖情况 |
| --- | --- | --- | --- | --- |
| 入口与命令注册 | `apps/image-editor/src/index.js`、`src/js/command/*`、`src/js/factory/command.js` | 加载 polyfill/CSS，注册命令，导出 `ImageEditor` | 命令依赖 import 副作用注册，边界隐式 | 命令有 `command.spec.js` 与各功能 spec |
| API 与生命周期编排 | `src/js/imageEditor.js` | 公开 API、事件转发、UI/Graphics/Invoker 协调 | 约 1646 行，事件处理、命令调用、UI 状态混在同一类 | `imageEditor.spec.js`、功能 spec 覆盖较多，但事件拆分缺少定向测试 |
| Fabric 图形层 | `src/js/graphics.js`、`src/js/component/*`、`src/js/drawingMode/*` | Fabric canvas、组件、绘制模式、对象注册与复制粘贴 | 约 1374 行，组件/模式注册与对象操作耦合 | `graphics.spec.js`、功能 spec 覆盖核心行为 |
| UI 编排 | `src/js/ui.js`、`src/js/ui/*` | 主 UI、菜单、历史、缩放按钮、子菜单 | 约 781 行，菜单事件与 DOM 构建集中 | `ui.spec.js`、`uiRange.spec.js`、主题/菜单测试 |
| 通用工具与历史命令 | `src/js/invoker.js`、`src/js/interface/command.js`、`src/js/util.js` | undo/redo、命令实例、通用工具 | Invoker 可测性较好，`util.js` 482 行职责较杂 | `invoker.spec.js`、多功能测试间接覆盖 |
| Wrapper | `apps/react-image-editor/src/index.js`、`apps/vue-image-editor/src/ImageEditor.vue` | React/Vue 封装、事件绑定、实例暴露 | Vue options 合并可能污染共享对象；wrapper 生命周期测试不均衡 | React 有 `tests/index.spec.js`，Vue 缺少自动化测试 |

## 3. 按优先级排序的重构待办

| ID | 优先级 | 模块/场景 | 涉及文件 | 重构目标 | 风险等级 | 重构前测试清单 | 文档影响 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RF-001 | P0 | Vue wrapper options 合并与事件生命周期 | `apps/vue-image-editor/src/ImageEditor.vue`，新增 wrapper 测试 | 避免 `includeUIOptions` 被 `Object.assign` 污染，明确 include UI 默认值合并边界 | 中 | - [x] includeUi=true 时不污染共享默认对象；- [x] options/includeUI 保持调用方覆盖优先级；- [ ] destroyed 解绑事件并 destroy 实例（缺少 Vue SFC 测试工具链，暂以构建验证覆盖） | `docs/project-structure.md`：记录 Vue wrapper；`README.md`：补充 wrapper 开发/测试状态 | done |
| RF-002 | P0 | `ImageEditor` 事件绑定与对象修改命令编排 | `apps/image-editor/src/js/imageEditor.js`，相关 `tests/imageEditor.spec.js`/功能 spec | 提取内部事件映射/绑定辅助逻辑，减少构造函数和事件处理重复，不改变事件名与 undo/redo 行为 | 高 | - [x] 构造时注册 graphics 事件映射；- [x] object moved/scaled/rotated 既有行为由完整核心测试覆盖；- [ ] destroy 后 graphics 事件解绑（当前生命周期直接销毁 Graphics，未扩大范围）；- [ ] UI include/non-include 两种路径（保留后续 UI 条目覆盖） | `docs/project-structure.md`：说明 API 编排层边界；`README.md`：无用户 API 变化说明 | done |
| RF-003 | P1 | `Graphics` 组件与绘制模式注册 | `apps/image-editor/src/js/graphics.js`，`tests/graphics.spec.js`/`drawingMode.spec.js` | 将组件/绘制模式注册表提取为显式常量或工厂，降低构造函数依赖密度 | 高 | - [x] 每个组件可通过注册表创建；- [x] 绘制模式互斥切换；- [x] zoom 事件 attach/detach 由 Graphics 构造/销毁路径覆盖；- [x] canvas 对象增删仍触发原事件（完整核心测试覆盖） | `docs/project-structure.md`：记录 Graphics、Component、DrawingMode 职责 | done |
| RF-004 | P1 | UI 菜单与帮助按钮事件 | `apps/image-editor/src/js/ui.js`，`src/js/ui/template/*`，`tests/ui.spec.js` | 把 help menu/zoom/history 事件绑定拆为小型内部方法或配置表，降低 DOM 事件重复 | 中 | - [x] 菜单切换保持 toggle/discardSelection 行为；- [x] help menu 分组保持原顺序；- [x] history 菜单可打开/清空/选择（既有 UI 测试覆盖） | `docs/project-structure.md`：记录 UI 子模块；`README.md`：无用户 API 变化说明 | done |
| RF-005 | P2 | 工具函数职责整理 | `apps/image-editor/src/js/util.js`，相关测试 | 按 DOM、颜色/格式、对象属性等方向拆分低风险纯函数，保持 import 兼容或逐步迁移 | 中 | - [x] `clamp`、`keyMirror`、`getRgb`、`base64ToBlob` 等纯函数测试；- [x] 现有 import 路径兼容；- [x] 完整测试无循环依赖问题 | `docs/project-structure.md`：记录 utility 分组 | done |
| RF-006 | P2 | React wrapper 事件更新覆盖 | `apps/react-image-editor/src/index.js`，`apps/react-image-editor/tests/index.spec.js` | 在现有实现基础上补充事件移除/新增/替换场景测试，必要时提取事件名转换 helper | 低 | - [x] 新增 handler 被绑定；- [x] 删除 handler 被解绑；- [x] 替换 handler 不影响未变化 handler；- [x] ref 暴露实例和根元素（既有测试覆盖实例销毁路径） | `README.md`：补充 wrapper 测试命令 | done |

优先级说明：
- `P0`：价值和风险都最高，优先执行并先补测试。
- `P1`：中等风险或中等价值，放在 `P0` 之后。
- `P2`：低风险清理项，最后执行。

状态说明：
- `pending`
- `in_progress`
- `done`
- `blocked`

## 4. 执行日志

| ID | 开始日期 | 结束日期 | 验证命令 | 结果 | 已刷新文档 | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| RF-001 | 2026-07-08 | 2026-07-08 | `cd apps/vue-image-editor && npm test -- --runInBand`; `$env:NODE_OPTIONS='--openssl-legacy-provider'; npm run build:vue` | pass | 待最终统一刷新 | 已新增 Jest 配置与 options 合并测试；普通 `npm run build:vue` 在当前 Node/OpenSSL 下因 `ERR_OSSL_EVP_UNSUPPORTED` 失败，legacy provider 环境变量可通过 |
| RF-002 | 2026-07-08 | 2026-07-08 | `cd apps/image-editor && npm test -- --runInBand eventBinder.spec.js`; `cd apps/image-editor && npm test -- --runInBand imageEditor.spec.js`; `cd apps/image-editor && npm test -- --runInBand` | pass | 待最终统一刷新 | 新增 `eventBinder` 辅助模块并抽取 Graphics 事件绑定映射；完整核心包 25 suites / 278 tests 通过 |
| RF-003 | 2026-07-08 | 2026-07-08 | `cd apps/image-editor && npm test -- --runInBand graphicsRegistry.spec.js`; `cd apps/image-editor && npm test -- --runInBand graphics.spec.js drawingMode.spec.js`; `cd apps/image-editor && npm test -- --runInBand` | pass | 待最终统一刷新 | 新增 `graphicsRegistry`，集中创建 Component 与 DrawingMode 实例；完整核心包 26 suites / 280 tests 通过 |
| RF-004 | 2026-07-08 | 2026-07-08 | `cd apps/image-editor && npm test -- --runInBand helpMenu.spec.js`; `cd apps/image-editor && npm test -- --runInBand ui.spec.js uiRange.spec.js`; `cd apps/image-editor && npm test -- --runInBand` | pass | 待最终统一刷新 | 新增 `ui/helpMenu` 纯函数，复用 `VIEW_HELP_MENUS` 常量；完整核心包 27 suites / 281 tests 通过 |
| RF-005 | 2026-07-08 | 2026-07-08 | `cd apps/image-editor && npm test -- --runInBand basicUtil.spec.js`; `cd apps/image-editor && npm test -- --runInBand` | pass | 待最终统一刷新 | 新增 `basicUtil` 并由 `util.js` re-export 保持兼容；完整核心包 28 suites / 287 tests 通过；`getRgb('#abc')` 测试锁定既有输出 |
| RF-006 | 2026-07-08 | 2026-07-08 | `cd apps/react-image-editor && npm test -- --runInBand`; `$env:NODE_OPTIONS='--openssl-legacy-provider'; npm run build:react` | pass | 待最终统一刷新 | 新增删除 handler prop 的回归测试，提取 React wrapper 事件同步 helper；测试有 React 18 act deprecation warning |

## 5. 决策与确认

- 用户批准的条目：RF-001、RF-002、RF-003、RF-004、RF-005、RF-006（2026-07-08）。
- 延后的条目：暂无。
- 阻塞条目及原因：暂无。
- 当前工作区注意事项：`CLAUDE.md` 已有非本轮修改；`AGENTS.md` 为上一轮新增文件。执行重构时不应触碰无关改动。

## 6. 文档刷新

- `docs/project-structure.md`：已新增，覆盖 monorepo 包结构、核心层职责、wrapper 职责、测试位置与构建命令。
- `README.md`：已同步项目结构、开发命令、测试命令与 Node/OpenSSL 构建注意事项；未改动用户可见 API 描述。
- 最终同步检查：已完成，所有获批条目均为 `done`，文档刷新已落盘。

## 7. 下一步

1. 如需继续扩大重构范围，优先补 Vue SFC 生命周期测试工具链。
2. 如需清理历史行为，可单独评估 `getRgb('#abc')` shorthand 解析兼容性。
3. 保持后续改动按条目更新本计划或新建下一轮重构计划。
