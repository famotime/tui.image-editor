# Project Structure

This repository is a Lerna and npm workspaces monorepo. Package source is under `apps/*`; root scripts dispatch package builds through Lerna.

## Packages

- `apps/image-editor`: core JavaScript image editor package.
- `apps/react-image-editor`: React wrapper around `tui-image-editor`.
- `apps/vue-image-editor`: Vue 2 wrapper around `tui-image-editor`.

## Core Package Layout

- `apps/image-editor/src/index.js`: public entry point. It loads polyfills, CSS, command registrations, and exports `ImageEditor`.
- `apps/image-editor/src/js/imageEditor.js`: public API facade and coordinator for `Invoker`, `Graphics`, UI, command execution, and external events.
- `apps/image-editor/src/js/graphics.js`: Fabric canvas owner. It manages canvas objects, drawing mode lifecycle, component lookup, copy/paste, zoom, and image dimensions.
- `apps/image-editor/src/js/graphicsRegistry.js`: factory list for Graphics components and drawing modes.
- `apps/image-editor/src/js/component/*`: feature components such as cropper, filter, flip, icon, resize, shape, text, and zoom.
- `apps/image-editor/src/js/drawingMode/*`: mutually exclusive drawing mode implementations.
- `apps/image-editor/src/js/command/*`: command modules registered by import side effects and executed through `Invoker`.
- `apps/image-editor/src/js/eventBinder.js`: shared event-map binding helper.
- `apps/image-editor/src/js/basicUtil.js`: low-level pure utility functions re-exported by `util.js`.
- `apps/image-editor/src/js/ui.js`: includeUI coordinator for DOM layout, menus, history, and editor sizing.
- `apps/image-editor/src/js/ui/helpMenu.js`: help menu grouping and partition ordering.
- `apps/image-editor/src/css/*` and `apps/image-editor/src/svg/*`: styles and icon assets.

## Wrapper Layout

- `apps/react-image-editor/src/index.js`: React component wrapper, imperative ref API, and event handler prop synchronization.
- `apps/react-image-editor/tests/index.spec.js`: React wrapper lifecycle and event binding tests.
- `apps/vue-image-editor/src/ImageEditor.vue`: Vue 2 component wrapper.
- `apps/vue-image-editor/src/options.js`: Vue wrapper option merge helper.
- `apps/vue-image-editor/tests/options.spec.js`: Vue option merge tests.

## Tests

- Core tests: `cd apps/image-editor && npm test`.
- Core type tests: `cd apps/image-editor && npm run test:types`.
- React wrapper tests: `cd apps/react-image-editor && npm test`.
- Vue wrapper tests: `cd apps/vue-image-editor && npm test`.

Webpack builds may require `NODE_OPTIONS=--openssl-legacy-provider` on newer Node/OpenSSL combinations.
