# CSS / 樣式慣例

## 原則

- 啟用 Tailwind 時：以 utility class 為主，避免散落的全域自訂 CSS
- 未啟用 Tailwind 時：全域樣式集中在 `src/assets/styles/app.css`
- 元件內 `<style>` 僅用於無法用 utility 表達的例外情況
- 禁止把 secrets（API key / token）寫進樣式或前端 bundle

## 設計系統（可選）

各專案可有自己的設計系統，也可以沒有：

- 有：以 `docs/design-system.md` 與對應 token／utility 為準；禁止硬編碼 hex／隨意 px／手寫 box-shadow
- 無：以本文件與 Tailwind `theme.extend` 為準

## Tailwind（預設啟用）

- 全域入口：`src/assets/styles/app.css`（含 `@tailwind` directives）
- 有設計系統時優先其 Tailwind 擴充；否則用 Tailwind spacing / color / typography scale
- 避免硬編碼 hex；若需品牌色，在 `tailwind.config.js` 的 `theme.extend` 定義（或設計系統 token）
- 響應式：mobile-first（`sm:`、`md:`、`lg:` 往上加）

## SCSS（可選）

- 專案已安裝 `sass`；`.vue` 內可用 `<style lang="scss">`
- 變數與 mixin 放 `src/assets/styles/`，不要在各元件重複定義

## 命名

- 自訂 class 使用 kebab-case（例如 `.page-header`）
- BEM 非強制，但同一元件內命名需一致
- 設計系統若有文字樣式前綴，保留文件規定的命名（勿自行發明衝突前綴）
- 完整命名（含 CSS 變數、與檔案／TS 對照）見 `docs/naming-conventions.md`

## stylelint

提交前執行 `pnpm run stylelint`，規則見 `stylelint.config.mjs`。

## 參考

- `.cursor/rules/css-style.mdc`
- `.cursor/rules/design-system.mdc`
- `docs/design-system.md`（若專案有設計系統）
- `docs/code-conventions.md`（樣式章節）
