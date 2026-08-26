# 專案規範

## 目錄結構

`src/` 分類固定為（整合 kcg-roadsafety-front 與 hhapp-front 慣例）：

```
src/
├── assets/
│   ├── images/          # 圖片、icon
│   └── styles/          # tailwind.css、styles.scss
├── components/
│   ├── common/          # 通用 UI（Button、Modal…）
│   └── layout/          # 版型（Header、Footer…）
├── composables/         # useXxx 組合式函數
├── constants/           # 固定常數
├── enums/               # 列舉
├── i18n/                # vue-i18n（建立時可選，預設啟用）
│   ├── locales/         # 語系 JSON（zh-TW、en…）
│   ├── index.ts         # createI18n 設定
│   └── useLocale.ts     # 切換語系 composable
├── models/              # API 資料模型（*Model.ts）
├── router/
├── services/            # API 層（統一用複數；Axios 可選，預設啟用）
│   ├── api.ts           # axios 實例
│   ├── request.ts       # Result API 請求封裝（getData / postData…）
│   └── apis/            # 各模組 API
├── stores/              # Pinia
├── types/               # 共用型別（含 ApiResult）
├── utils/               # 純函數工具
└── views/               # 頁面
```

## 必做工具

- ESLint
- stylelint
- Husky + commitlint

## 延伸（可共用的規範文件）

全專案模板共用（與設計系統無關；**人與任何 AI 皆讀 `docs/`**）：

- `docs/ai-assist.md`（AI 入口、Skills 一覽）
- `docs/git-workflow.md`
- `docs/commit-conventions.md`
- `docs/deployment.md`
- `docs/code-conventions.md`
- `docs/naming-conventions.md`（檔案＋程式碼命名）
- `docs/comment-conventions.md`
- `docs/css-conventions.md`
- `docs/figma-mcp.md`（Figma MCP 預設唯讀）

Cursor 適配（自動套用／快捷，內容指回 `docs/`）：

- `.cursor/rules/`、`.cursor/skills/`

其他工具自動載入（薄適配，指回 `AGENTS.md`／`docs/`）：

- `CLAUDE.md`（Claude Code）
- `GEMINI.md`（Gemini CLI）
- `.github/copilot-instructions.md`（GitHub Copilot）

依專案選用：

- `docs/design-system.md`（+ Cursor 時可有 `.cursor/rules/design-system.mdc`）

## 部署

請見 `docs/deployment.md`。
