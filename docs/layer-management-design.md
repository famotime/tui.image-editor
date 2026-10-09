# 图层管理与多图层追加设计方案

## 1. 概述与背景

在现有的 TOAST UI Image Editor 中，顶部「打开/加载图片（Load）」操作直接调用 `loadImageFromFile`，其底层逻辑会重置画布尺寸、清空现有对象、清空撤销栈，将选定图片作为底图替换原有内容。这导致用户无法在保留当前画布或工程的基础上，向画布叠加、拼贴新的图片素材。同时，编辑器缺少直观的图层层级控制界面，多元素重叠时难以高效管理前后顺序与属性。

本方案旨在为 TOAST UI Image Editor 引入**现代化的图层管理体系（Layer Management）**，并支持**在当前处理图片上追加新图片作为图层**，具体包括：
- 区分「底图加载」与「新图片追加」入口；
- 提供右侧可折叠的专业「图层管理侧边栏」；
- 统一管理画布上的底图、图片图层、文本、几何形状与贴图图标；
- 赋予每个图层排序、显隐、锁定、透明度调节、克隆与重命名能力；
- 滤镜工具自适应作用于当前激活的图片图层；
- 完整接入撤销/重做（Undo/Redo）与历史记录管理。

---

## 2. 交互与功能规范

### 2.1 新增图片入口（非替换追加）

1. **顶部操作栏独立按钮**：
   - 保留原有的「打开底图（Load）」按钮，用于初始化或整体更换画布底图。
   - 新增独立的「添加图片（Add Image）」按钮，选择文件后将新图片作为可自由拖动、缩放、旋转的图片对象（`fabric.Image`）叠加至画布上方。
2. **图层管理面板快捷入口**：
   - 在右侧图层面板顶部/底部工具条提供「+ 添加图片」快捷按钮。
3. **画布拖拽与粘贴（Drag & Drop / Clipboard）**：
   - 监听画布区域的拖放事件（`dragover`, `drop`）：用户直接拖拽外部图片文件到画布上即自动作为新图层追加。
   - 监听全局快捷键 `Ctrl+V`（或 `Cmd+V`）：当剪贴板中存在图片数据时，自动解析并作为新图层追加到画布中心。

### 2.2 初始尺寸与位置适配规则

- 新增图片默认以中心点对齐当前画布中心。
- **智能适配居中（Smart Fit）**：
  - 计算画布宽度与高度（`canvasWidth`, `canvasHeight`）；
  - 若新图片尺寸超出画布的 80%（宽或高），则自动等比计算缩放比例 `scale = Math.min((canvasWidth * 0.8) / imgWidth, (canvasHeight * 0.8) / imgHeight)`；
  - 若新图片原始尺寸在画布 80% 范围内，则保持 1:1 原始物理分辨率（`scale = 1`），避免小图被强行拉伸模糊。

### 2.3 图层侧边栏布局与交互形态

- **布局位置**：画布右侧停靠（`tui-image-editor-right-palette`），与左侧工具栏（`left-palette`）保持视觉平衡与统一的设计风格。
- **折叠展开**：侧边栏头部带有折叠按钮（▲/▼），支持一键折叠收起或展开，折叠时画布自适应充满工作区。
- **双向联动**：
  - 点击图层列表项：画布对应对象被选中（显示控制点与旋转手柄）；
  - 在画布上选中/切换元素：图层列表项同步高亮激活，并自动滚动到可视区域；
  - 画布取消选中时，图层面板高亮状态同步解除。

### 2.4 图层管理覆盖范围

图层列表中管理以下主要画布对象（自由画笔笔划不逐条罗列，避免笔迹过多造成刷屏）：
1. **背景/底图（Background Layer）**：
   - 初始作为特殊的底图层；
   - 默认带有位置锁定保护；
   - 支持解锁转化为普通图层，解锁后可自由调整前后层级、缩放或删除。
2. **图片图层（Image Layers）**：通过「添加图片」、拖拽或粘贴导入的所有外部图片。
3. **文字图层（Text Layers）**：通过 Text 工具添加的文本对象，列表项显示文本内容缩略摘要。
4. **形状图层（Shape Layers）**：矩形、圆形、三角形等几何形状对象。
5. **图标图层（Icon Layers）**：通过 Icon 工具添加的箭头、星形等贴图对象。

### 2.5 图层核心操作能力

| 操作项 | 触发方式 | 行为逻辑 | Undo/Redo 记录 |
| :--- | :--- | :--- | :--- |
| **层级调整** | 列表拖拽 / 上移下移置顶置底按钮 | 调整对象在 Fabric Canvas 中的堆叠顺序（`moveTo`, `bringForward`, `sendBackwards` 等） | 记录在历史栈中 |
| **显隐切换** | 点击眼睛图标（Eye icon） | 切换对象 `visible` 属性；隐藏状态下画布不显示、不可被选中、导出图片时不渲染 | 即时状态开关 |
| **锁定/解锁** | 点击锁图标（Lock icon） | 切换对象的 `selectable` 与 `evented` 属性；锁定状态下画布无法拖动、变形或旋转 | 即时状态开关 |
| **删除图层** | 垃圾桶按钮 / 快捷键 Delete | 从画布中移除对应对象（底层调用 `removeObject`） | 记录在历史栈中 |
| **重命名** | 双击图层名或点击铅笔按钮 | 弹出内联输入框，修改图层别名（如“公司Logo”、“背景底图”） | 本地属性保存 |
| **透明度** | 不透明度滑块（0% - 100%） | 调整当前激活图层的 `opacity` 属性 | 调整完成后入撤销栈 |
| **图层克隆** | 复制按钮 | 克隆当前图层并生成同等属性副本，偏移叠加到上一层 | 记录在历史栈中 |

### 2.6 滤镜（Filter）上下文自适应

- 当图层面板中选中了某个图片图层（`fabric.Image`）时，左侧工具栏中的滤镜（黑白、反色、锐化、浮雕、调色等）直接对该选中的图片对象生效；
- 当未选中任何图片图层或选中国底图时，滤镜默认作用于画布底图；
- 若选中的是矢量形状或文字图层，则保持原有提示或作用于底图。

---

## 3. 技术架构与核心模块设计

### 3.1 模块目录结构

```
apps/image-editor/src/
├── js/
│   ├── command/
│   │   ├── changeLayerOrder.js         # 图层层级变更 Command（支持 undo/redo）
│   │   └── changeLayerOpacity.js       # 图层透明度变更 Command（支持 undo/redo）
│   ├── ui/
│   │   ├── layer.js                    # 图层管理面板主控制器
│   │   ├── helpMenu.js                 # 顶部菜单栏配置扩展
│   │   ├── template/
│   │   │   ├── mainContainer.js        # 主工作区增加右侧侧边栏结构
│   │   │   ├── controls.js             # 顶部操作栏结构
│   │   │   └── submenu/
│   │   │       └── layer.js            # 图层列表及工具栏模板
│   │   └── theme/
│   │       └── standard.js             # 图层面板样式主题变量
│   ├── action.js                       # UI Action 层统一事件分发
│   ├── graphics.js                     # 底层 Graphics 图层操作辅助方法
│   └── imageEditor.js                  # 核心入口与事件监听
```

### 3.2 关键类与职责

#### 1. `Layer` (UI 控制器: `src/js/ui/layer.js`)
- 继承或持有 UI Submenu / Panel 模式；
- 负责监听 Fabric Canvas 的 `object:added`, `object:removed`, `object:modified`, `selection:created`, `selection:cleared`, `selection:updated` 等事件，并实时刷新右侧图层列表；
- 处理 HTML5 拖拽排序（Drag & Drop）或按键排序事件；
- 控制图层眼睛（显隐）、锁（锁定）、删除、克隆、透明度滑块的事件绑定与样式渲染。

#### 2. `changeLayerOrder` 命令 (`src/js/command/changeLayerOrder.js`)
- `execute(graphics, { objectId, fromIndex, toIndex })`:
  - 记录旧索引位置；
  - 调用 `graphics.moveObject(objectId, toIndex)`；
  - 触发画布重新渲染。
- `undo(graphics)`:
  - 将对象恢复至旧索引 `fromIndex`。

#### 3. `changeLayerOpacity` 命令 (`src/js/command/changeLayerOpacity.js`)
- `execute(graphics, { objectId, opacity })`:
  - 记录旧透明度；
  - 修改对象 `opacity` 并重新渲染。
- `undo(graphics)`:
  - 恢复对象的旧透明度。

#### 4. `Action` 适配扩展 (`src/js/action.js`)
- `addImageLayer(file)`: 读取 File 对象为 DataURL/BlobURL，利用智能缩放计算尺寸并调用 `addImageObject`；
- `setLayerVisibility(id, visible)`: 切换对象可见性；
- `setLayerLock(id, locked)`: 切换对象选中与交互锁定；
- `setLayerOpacity(id, opacity)`: 提交透明度变更命令；
- `reorderLayer(id, newIndex)`: 提交层级变更命令。

---

## 4. 实施与验证步骤

1. **Phase 1: 核心追加能力与顶部入口**
   - 在 `action.js` 和 `ui.js` 中新增 `addImage` 动作支持，实现「添加图片」独立入口；
   - 实现智能适配缩放算法（Smart Fit）；
   - 支持从本地拖拽图片到画布以及剪贴板 `Ctrl+V` 追加新图层。
2. **Phase 2: 图层侧边栏结构与基础渲染**
   - 修改 `mainContainer.js`，加入右侧图层管理面板容器 `tui-image-editor-right-palette`；
   - 编写 `ui/template/submenu/layer.js` 模板和 `ui/layer.js` 面板控制器；
   - 实现画布对象与图层列表项的实时双向联动与高亮同步。
3. **Phase 3: 图层操作与命令系统集成**
   - 注册 `changeLayerOrder` 与 `changeLayerOpacity` 命令，支持 Undo/Redo 与历史记录面板；
   - 实现显隐控制、图层锁定、快速删除、图层克隆与重命名；
   - 实现可转化的底图图层支持（解锁后可作为普通图层移动/排序/删除）。
4. **Phase 4: 滤镜上下文与样式打磨**
   - 扩展 `filter.js`，使其在选中图片图层时优先对该图片对象应用滤镜；
   - 完善黑暗主题/默认主题样式，添加中英双语国际化文案。
5. **Phase 5: 自动化测试与构建验证**
   - 编写单元测试用例（覆盖图层排序、透明度变更、图片追加、显隐与锁定）；
   - 运行项目全量测试与构建脚本（`npm test`, `npm run build`），确保无回归错误。
