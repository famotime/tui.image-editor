# 项目开发指南

## 环境要求

- **Node.js** >= 14（推荐 v18+，当前使用 Node.js v22）
- **npm** >= 6（项目使用 npm workspaces + lerna 管理多包）
- 现代浏览器（Chrome、Edge、Safari、Firefox）

## 快速启动

### 1. 安装依赖

```sh
# 在项目根目录执行（依赖安装在根 node_modules）
npm install
```

### 2. 启动开发服务器

```sh
# 在项目根目录执行
$env:NODE_OPTIONS = "--openssl-legacy-provider"
Set-Location apps/image-editor
npm run serve
```

> **注意**：必须设置 `NODE_OPTIONS=--openssl-legacy-provider`，否则 Node.js 17+ 会遇到 `ERR_OSSL_EVP_UNSUPPORTED` 错误。PowerShell 中以上述方式设置环境变量。

开发服务器启动后，根据控制台实际监听的端口，在浏览器中打开页面访问：

```
http://localhost:8080/example01-includeUi.html
# 或被自动顺延的端口（如 8084）：
http://localhost:8084/example01-includeUi.html
```

该页面包含完整的 UI 工具栏（Crop、Flip、Rotate、Shape、Text、Draw、Icon、Mask、Filter 等），可直接拖入图片进行交互测试。

## 构建

```sh
# 构建全部三个包
npm run build

# 仅构建核心编辑器包
npm run build:image-editor

# 仅构建 React 包装器
npm run build:react

# 仅构建 Vue 包装器
npm run build:vue
```

## 测试

```sh
# 运行全部测试
cd apps/image-editor
npm test

# 运行单个测试文件
npx jest -- tests/command.spec.js

# 类型检查
npm run test:types
```

测试使用 jsdom 环境，ESM 模块通过 `jest-esm-transformer` 转译，路径别名 `@/` 映射到 `src/js/`。

## 项目结构

```
apps/
├── image-editor/           # 核心编辑器包（tui-image-editor）
│   ├── src/
│   │   ├── index.js        # 入口，side-effect import 注册所有 command
│   │   ├── imageEditor.js  # ImageEditor 主类（mixin 组合）
│   │   ├── invoker.js      # undo/redo 栈管理
│   │   ├── action.js       # UI 动作映射（mixin）
│   │   ├── graphics.js     # fabric.js 封装层
│   │   ├── js/
│   │   │   ├── command/    # 可撤销操作（每个文件一个 command）
│   │   │   ├── component/  # 功能模块（cropper、filter、shape 等）
│   │   │   ├── drawingMode/# 交互模式类
│   │   │   ├── extension/  # fabric.js 插件扩展
│   │   │   ├── factory/    # command 工厂
│   │   │   ├── helper/     # 辅助工具
│   │   │   ├── interface/  # 抽象基类（Command、Component）
│   │   │   ├── ui/         # UI 渲染层（Stylus 样式 + HTML 模板）
│   │   │   └── util.js     # 工具函数
│   │   └── css/            # Stylus 样式文件
│   ├── tests/              # Jest 测试
│   └── examples/           # 开发服务器示例页面
├── react-image-editor/     # React 包装器
└── vue-image-editor/       # Vue 2 包装器
```

## 常见问题与状态说明

| 问题/需求 | 说明 | 状态与解决方案 |
|------|------|----------|
| ESLint 报错 ~975 个 `prettier/prettier` | Windows 下换行符风格冲突（CRLF vs LF） | **已解决**。通过在 `.eslintrc.js` 规则及 `.prettierrc` 中配置 `endOfLine: 'auto'` 解决。 |
| ESLint 复杂度警告 | `cropper.js` 和 `cropzone.js` 方法复杂度略超阈值 | **已解决**。已通过添加 `// eslint-disable-next-line complexity` 标记过滤警告，确保 Webpack 编译不再被其打断。 |
| Google Fonts 502 | Noto Sans 字体从 Google Fonts CDN 加载失败 | **已知限制**。属网络原因，不影响编辑器核心功能使用。 |
| 移除左上角 Logo 标记 | 默认界面中左上角带有 "TOAST UI Image Editor" 品牌 Logo | **已实现**。已在模板中启用条件渲染，并清空默认及示例主题的品牌 Logo 路径；如需显示，只需在 UI 实例化的主题配置中设置 `common.bi.image` 即可。 |

## 核心架构要点

- **Command 模式**：所有可撤销操作通过 `commandFactory.register()` 注册，运行时按名称创建 Command 实例，由 `Invoker` 执行并维护 undo/redo 栈。
- **Mixin 组合**：`ImageEditor` 不直接继承，而是通过 `extend` 混入 `action`、`Invoker` 等方法，UI 通过 `setReAction()` 绑定事件。
- **path 别名**：`@/` → `src/js/`，`@css/` → `src/css/`，`@svg/` → `src/svg/`。jest 中通过 `moduleNameMapper` 映射。
