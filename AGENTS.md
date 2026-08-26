# Repository Guidelines (mediapipe-test)

**本檔會被多種 AI 自動載入。** 動筆前必須遵守；細節見 `docs/`（完整說明：`docs/ai-assist.md`）。

## Always apply（強制）

1. **套件**：一律 `pnpm`（不用 npm / yarn）
2. **UI 文案**：繁體中文
3. **Vue**：SFC 一律 `<script setup lang="ts">`；TypeScript `strict`；避免 `any`
4. **目錄**：API 只放 `src/services/`；`views/` 只組裝；可共用 UI 放 `components/common/`
5. **命名**：見 `docs/naming-conventions.md`（元件 PascalCase、composable `useXxx`、其餘見該文件）
6. **註解**：短、**英文 + 繁中**、只說用途；見 `docs/comment-conventions.md`
7. **Figma MCP**：**預設唯讀**；未經使用者明確要求不得寫入 Figma；見 `docs/figma-mcp.md`
8. **Commit**：Conventional Commits；見 `docs/commit-conventions.md`（Husky + commitlint 會擋）
9. **Secrets**：禁止寫進前端程式碼／commit `.env` 憑證

動筆前若尚未讀過，先讀：`docs/naming-conventions.md`、`docs/code-conventions.md`、`docs/comment-conventions.md`、`docs/figma-mcp.md`、`docs/project-conventions.md`。

## Tech Stack

- Vue 3 + Vite + TypeScript
- Pinia
- Vue Router
- Tailwind CSS（可選，預設啟用）
- vue-i18n（可選，預設啟用）
  

## Branches & Environments

- `main`: 正式站
- `test`: 測試站
- `uat`: 正式站前測試環境（可選）

## Build & Release

- `pnpm run build:stage`: 測試站 build + bump/tag（test: `v0.0.y`）
- `pnpm run build:uat`: uat build + bump/tag（uat: `v0.x.0`）
- `pnpm run build:prod`: 正式站 build + bump/tag（main: `v{x}.0.0`，`v1.0.0` → `v2.0.0`）

環境變數可在 `.env.*` 設定；若尚未確定 API 或 Bitbucket remote，請看 `docs/TODO.md`。

## 規範文件（共用真相）

- `docs/ai-assist.md` — AI 入口與自動載入對照
- `docs/project-conventions.md`、`docs/naming-conventions.md`、`docs/code-conventions.md`
- `docs/comment-conventions.md`、`docs/css-conventions.md`、`docs/figma-mcp.md`
- `docs/deployment.md`、`docs/commit-conventions.md`
- 有設計系統時見 `docs/design-system.md`

## 工具適配（自動載入）

| 工具                        | 自動載入                          |
| --------------------------- | --------------------------------- |
| 多數 Agent／Copilot／Cursor | `AGENTS.md`（本檔）               |
| Cursor                      | 另加 `.cursor/rules/`             |
| Claude Code                 | `CLAUDE.md`                       |
| Gemini CLI                  | `GEMINI.md`                       |
| GitHub Copilot              | `.github/copilot-instructions.md` |

## Skills（標準流程）

| 指令／Skill         | 用途                                   |
| ------------------- | -------------------------------------- |
| `/commit`           | 檢查後分類提交（Conventional Commits） |
| `/push`             | 檢查後安全推送（不 force）             |
| `/deploy`           | 依環境 build + bump／tag               |
| `/mediapipe-test` | 本專案導覽與常用指令                   |

詳見 `docs/ai-assist.md`；Skill 原文在 `.cursor/skills/*/SKILL.md`。

## Git Hooks

此 repo 使用 Husky + lint-staged + commitlint 強制規範。
