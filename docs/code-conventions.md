# 程式碼慣例（Vue3 共用）

## TypeScript

- `strict: true`
- 避免 `any`；不確定時用 `unknown` + 窄化
- 需要共用的型別放 `src/types/`；單一模組/單一 API 的型別放 `src/models/`
- 型別-only import 使用 `import type`

## Vue SFC

- 一律使用 `<script setup lang="ts">`
- 元件檔名使用 **PascalCase**（例如 `UserCard.vue`）
- 一檔一主要元件；Props 型別命名 `ComponentNameProps`
- 完整檔案／識別子命名見 `docs/naming-conventions.md`（含 composable、store、路由、i18n、CSS）

## 目錄與職責

以 `src/` 的分類為準（見 `docs/project-conventions.md`），常用規則：

- **`views/`**：路由頁（負責組裝，不放大量可複用 UI）
- **`components/common/`**：可跨頁共用的 UI 元件
- **`components/layout/`**：版型元件（Header / Footer / Shell）
- **`services/`**：HTTP client 與 API 封裝（不要在這裡寫 UI 邏輯）
  - 啟用 Axios 時：後端為 Result API（`{ code, message, data }`），型別見 `types/api.ts`，請求用 `services/request.ts`
- **`stores/`**：Pinia 全域狀態；局部狀態優先用 composable
- **`utils/`**：純函數工具；與 Vue 生命週期/狀態相關的放 `composables/`

## Import 順序

建議順序（同一檔案維持一致）：

1. Vue / Router / Pinia（框架）
2. 外部套件
3. `@/` alias（專案內模組）
4. 相對路徑
5. `import type`（可與對應 import 相鄰）

## 樣式

- 若專案啟用 Tailwind：以 Tailwind class 為主，避免散落的自訂 CSS
- 若專案有設計系統：色／間距／圓角／文字樣式／陰影見 `docs/design-system.md`
- 若未啟用 Tailwind：全域樣式集中在 `src/assets/styles/app.css`
- 禁止把 secrets（API key / token）寫進前端 bundle

## 註解

完整規則見 `docs/comment-conventions.md`：

- 短而重要；英文 + 繁中雙語；只說用途
- 不要寫逐行旁白、實作經過或用法說明（TODO 除外）

## Lint / Format

提交前需通過：

- `pnpm run format:check`
- `pnpm run lint`
- `pnpm run stylelint`
- `pnpm run type-check`
