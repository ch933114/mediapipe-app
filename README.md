# mediapipe 測試

> 專案代號：`mediapipe-test`  
> 由 [omniguider create-front](https://bitbucket.org/omnig/create-front) template **v1.5.1** 建立

mediapipe 測試 前端專案，基於 Vue 3 + Vite + TypeScript。本文件幫助新加入的同仁快速上手：怎麼跑起來、目錄怎麼分、怎麼部署。

---

## 目錄

- [技術棧](#技術棧)
- [快速開始](#快速開始)
- [常用指令](#常用指令)
- [環境變數](#環境變數)
- [專案結構](#專案結構)
  - [分支與部署](#分支與部署)
- [開發規範](#開發規範)
- [Git 與 Commit](#git-與-commit)
- [待辦事項](#待辦事項)

---

## 技術棧

| 類別                | 技術                                                     |
| ------------------- | -------------------------------------------------------- |
| 框架                | Vue 3（`<script setup>` + TypeScript）                   |
| 建置                | Vite 8                                                   |
| 狀態管理            | Pinia                                                    |
| 路由                | Vue Router                                               |
| HTTP                | Axios + Result API（可選，預設啟用）                     |
| 樣式                | Tailwind CSS（建立時可選，預設啟用）                     |
| 多語系              | vue-i18n（建立時可選，預設啟用；`src/i18n/`）            |
|  | 品質                                                     | ESLint、stylelint、Prettier |
| Git                 | Husky + lint-staged + commitlint（Conventional Commits） |
| AI 輔助             | Cursor `.cursor/rules/`、`.cursor/skills/`               |

---

## 快速開始

### 前置需求

- Node.js **22.17.0**（見 `.nvmrc`；建議用 nvm 或 Volta）
- **pnpm**（此專案強制使用 pnpm，`preinstall` 會阻擋 npm / yarn）

### 安裝與啟動

```bash
# 進入專案目錄後
pnpm install
pnpm dev
```

瀏覽器開啟終端機顯示的網址（預設 `http://localhost:5173`）。

### 本機預覽 build 結果

```bash
pnpm run build:stage   # 或 build:uat / build:prod
pnpm preview
```

---

## 常用指令

| 指令                    | 說明                                                         |
| ----------------------- | ------------------------------------------------------------ |
| `pnpm dev`              | 本機開發（讀取 `.env.development`）                          |
| `pnpm run build:stage`  | 測試站 build + bump 版號 + tag + push（需在 `test` 分支）    |
| `pnpm run build:uat`    | uat build + bump + push（需在 `uat` 分支，若專案有啟用 uat） |
| `pnpm run build:prod`   | 正式站 build + bump + push（需在 `main` 分支）               |
| `pnpm run lint`         | ESLint 檢查                                                  |
| `pnpm run stylelint`    | stylelint 檢查                                               |
| `pnpm run format`       | Prettier 格式化                                              |
| `pnpm run format:check` | Prettier 檢查（不寫入）                                      |
| `pnpm run type-check`   | TypeScript 型別檢查                                          |

> `build:*` 會依序執行 format → lint → stylelint → type-check → vite build → bump-and-tag。  
> 本機測試 build 可加 `SKIP_BUMP=1` 跳過版號與 push，詳見 `docs/deployment.md`。

---

## 環境變數

各環境對應的 `.env.*` 檔案：

| 檔案               | 用途                | `pnpm` 指令            |
| ------------------ | ------------------- | ---------------------- |
| `.env.development` | 本機開發            | `pnpm dev`             |
| `.env.staging`     | 測試站              | `pnpm run build:stage` |
| `.env.uat`         | uat（若專案有啟用） | `pnpm run build:uat`   |
| `.env.production`  | 正式站              | `pnpm run build:prod`  |

主要變數：

| 變數                   | 說明                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------- |
| `VITE_APP_TITLE`       | 瀏覽器標題                                                                         |
| `VITE_APP_BASE_URL`    | Vite `base`（靜態資源子路徑；**預設 `/`**，子目錄部署才改。目前為 `/`） |
| `VITE_APP_API_URL`     | 後端 API 根網址                                                                    |
| `VITE_APP_FRONT_URL`   | 前端完整網址（API + base path）                                                    |
| `VITE_APP_SHOW_LOG`    | 是否顯示 debug log                                                                 |
| `VITE_APP_META_ROBOTS` | SEO robots meta                                                                    |

程式碼中透過 `import.meta.env.VITE_*` 讀取。修改 `.env.*` 後需重啟 `pnpm dev`。

---

## 專案結構

```
mediapipe-test/
├── .cursor/                  # Cursor 適配（rules 自動套用／skills；指回 docs/）
├── .github/
│   └── copilot-instructions.md  # GitHub Copilot 自動載入
├── .env.*                    # 各環境變數
├── .husky/                   # Git hooks
├── docs/                     # 團隊／AI 共用規範（必讀；不限 Cursor）
├── public/                   # 靜態資源（不經 Vite 處理）
├── scripts/
│   └── bump-and-tag.mjs      # 部署時版號與 tag
├── src/
│   ├── assets/
│   │   ├── images/           # 圖片
│   │   └── styles/           # 全域樣式
│   ├── components/
│   │   ├── common/           # 通用 UI 元件
│   │   └── layout/           # 版型元件
│   ├── composables/          # useXxx 組合式函數
│   ├── constants/            # 常數
│   ├── enums/                # 列舉
│   ├── i18n/                 # vue-i18n（可選，預設啟用）
│   │   ├── locales/          # 語系 JSON
│   │   ├── index.ts
│   │   └── useLocale.ts
│   ├── models/               # API 資料模型
│   ├── router/               # 路由設定
│   ├── services/
│   │   ├── api.ts            # axios 實例（可選）
│   │   ├── request.ts        # Result API 請求封裝（可選）
│   │   └── apis/             # 各模組 API
│   ├── stores/               # Pinia
│   ├── types/                # 共用型別（含 ApiResult）
│   ├── utils/                # 工具函數
│   ├── views/                # 頁面（對應路由）
│   ├── App.vue
│   └── main.ts
├── AGENTS.md                 # 人／任何 AI 導覽（自動載入）
├── CLAUDE.md                 # Claude Code 自動載入
├── GEMINI.md                 # Gemini CLI 自動載入
├── omniguider.config.json    # 版號策略（由 create-front 產生）
├── package.json
└── vite.config.ts
```

### 新增功能時放哪裡？

| 要做的事     | 放在                                 |
| ------------ | ------------------------------------ |
| 新頁面       | `src/views/` + `src/router/index.ts` |
| 可複用 UI    | `src/components/common/`             |
| 呼叫後端 API | `src/services/apis/`                 |
| 全域狀態     | `src/stores/`                        |
| 可複用邏輯   | `src/composables/`                   |
| API 回傳結構 | `src/models/`                        |

完整說明見 [`docs/project-conventions.md`](docs/project-conventions.md)。

---

## 分支與部署

| 分支   | 環境                 | 建置指令               | Tag 規則 |
| ------ | -------------------- | ---------------------- | -------- |
| `test` | 測試站               | `pnpm run build:stage` | `v0.0.y` |
| `uat`  | 正式站前測試（可選） | `pnpm run build:uat`   | `v0.x.0` |
| `main` | 正式站               | `pnpm run build:prod`  | `vX.0.0` |

### 日常開發流程（摘要）

1. `git checkout main && git pull`
2. `git checkout -b feature/<功能名稱>`
3. 開發、commit
4. 合併到目標環境分支（`test` / `uat` / `main`）
5. 在該分支執行對應的 `pnpm run build:*`

版號會由 `scripts/bump-and-tag.mjs` 自動處理（更新 `package.json`、commit `dist`、打 tag、push）。

詳細流程：

- [`docs/git-workflow.md`](docs/git-workflow.md) — 分支策略
- [`docs/deployment.md`](docs/deployment.md) — 部署與版號（**必讀**）

---

## 開發規範

新成員建議依序閱讀：

1. [`AGENTS.md`](AGENTS.md) — 專案總覽（人／任何 AI 入口）
2. [`docs/ai-assist.md`](docs/ai-assist.md) — AI 怎麼讀規範、Skills 一覽
3. [`docs/project-conventions.md`](docs/project-conventions.md) — 目錄與職責
4. [`docs/naming-conventions.md`](docs/naming-conventions.md) — 檔案＋程式碼命名（AI 必守）
5. [`docs/code-conventions.md`](docs/code-conventions.md) — TypeScript / Vue 慣例
6. [`docs/comment-conventions.md`](docs/comment-conventions.md) — 註解慣例
7. [`docs/css-conventions.md`](docs/css-conventions.md) — 樣式慣例
8. [`docs/figma-mcp.md`](docs/figma-mcp.md) — Figma MCP 預設唯讀

使用 Cursor 時：`.cursor/rules/` 會自動套用摘要。  
亦預置 `CLAUDE.md`、`GEMINI.md`、`.github/copilot-instructions.md`，讓 Claude／Gemini／Copilot **自動載入**同一套規範（見 [`docs/ai-assist.md`](docs/ai-assist.md)）。

重點摘要：

- UI 語言：**繁體中文**
- Vue SFC 一律 `<script setup lang="ts">`
- 元件檔名 **PascalCase**（`UserCard.vue`）；完整命名見 [`naming-conventions.md`](docs/naming-conventions.md)
- Import 使用 `@/` alias 指向 `src/`
- 禁止把 secrets 寫進前端程式碼

### Skills（標準流程）

| Skill               | 用途           |
| ------------------- | -------------- |
| `/commit`           | 檢查後分類提交 |
| `/push`             | 檢查後安全推送 |
| `/deploy`           | 部署與版號     |
| `/mediapipe-test` | 專案導覽       |

詳見 [`docs/ai-assist.md`](docs/ai-assist.md)。

---

## Git 與 Commit

採用 **Conventional Commits**，格式：

```
<type>(<scope>): <subject>
```

常用 type：`feat`、`fix`、`docs`、`refactor`、`chore`、`build`

提交前 Husky 會自動跑 lint-staged；commit 訊息由 commitlint 檢查。

完整規範見 [`docs/commit-conventions.md`](docs/commit-conventions.md)。

---

## 待辦事項

若建立時尚未設定 Bitbucket remote，或 API 網址尚未確定，請查看 [`docs/TODO.md`](docs/TODO.md)。完成後可刪除該檔。

Template 版本紀錄：[`docs/template-version.md`](docs/template-version.md)
