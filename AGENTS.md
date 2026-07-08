# Repository Guidelines

## Project Structure & Module Organization

This repository is a Lerna/npm workspaces monorepo. Package code lives under `apps/*`:

- `apps/image-editor`: core TOAST UI ImageEditor package, including `src`, `tests`, `examples`, `scripts`, and generated `dist`.
- `apps/react-image-editor`: React wrapper with `src`, `tests`, `stories`, and Storybook config.
- `apps/vue-image-editor`: Vue 2 wrapper with `src`, `tests`, `stories`, and Storybook config.
- `docs`: project documentation and contribution references.

Do not edit generated `dist` output unless the release workflow explicitly requires it.
See `docs/project-structure.md` for current module responsibilities.

## Build, Test, and Development Commands

- `npm install`: install root workspace dependencies.
- `npm run build`: run each package build through Lerna.
- `npm run build:image-editor`: build only the core editor package.
- `npm run build:react` / `npm run build:vue`: build the wrapper packages.
- `cd apps/image-editor && npm run serve`: start the webpack dev server for core examples.
- `cd apps/react-image-editor && npm run storybook`: run React Storybook on port `6006`.
- `cd apps/vue-image-editor && npm run storybook`: run Vue Storybook on port `6006`.

On newer Node/OpenSSL versions, webpack builds may require `NODE_OPTIONS=--openssl-legacy-provider`.

## Coding Style & Naming Conventions

Use UTF-8, LF line endings, spaces, and 2-space indentation as defined in `.editorconfig`. JavaScript, React, and Vue code are linted with ESLint using `eslint-config-tui`, Jest rules, and Prettier integration. Prettier uses single quotes, semicolons, `printWidth: 100`, trailing commas where valid in ES5, and arrow parentheses.

Name tests as `*.spec.js`. Keep package-specific code inside its package folder and prefer existing helpers such as `eventBinder`, `graphicsRegistry`, `basicUtil`, and `ui/helpMenu` before adding new abstractions.

## Testing Guidelines

Jest is the primary test framework. Core tests are in `apps/image-editor/tests`; wrapper tests are in each wrapper package's `tests` directory.

- `cd apps/image-editor && npm test`: run core Jest tests.
- `cd apps/image-editor && npm run test:types`: verify TypeScript type tests.
- `cd apps/react-image-editor && npm test`: run React wrapper tests.
- `cd apps/vue-image-editor && npm test`: run Vue wrapper option tests.

Add or update tests when changing commands, editor behavior, UI state, or wrapper APIs.

## Refactor Notes

Recent refactoring extracted event binding, Graphics registration, help menu grouping, and low-level utility functions into focused modules. Keep behavior-compatible imports through `@/util` unless a narrower module is clearly better. The current refactor plan and verification log live in `docs/refactor-plan.md`.

## Commit & Pull Request Guidelines

Recent history uses Conventional Commit prefixes such as `feat:` and `fix:`; continue that style, for example `fix: correct cropzone resize behavior`. Keep commit summaries brief and specific.

Pull requests should include a clear description, linked issues such as `fix #123` or `ref #123`, test results, and screenshots or GIFs for visible UI changes. Follow `CONTRIBUTING.md` and complete the PR template when available.
