# 設計系統規範

> **選填**：各專案可有自己的設計系統，也可以沒有。  
> 若本專案尚無設計系統，可刪除此檔，並從 `.cursor/rules/mediapipe-test-core.mdc` 必讀清單移除對應項目。

## 何時補齊

當專案有 Figma／品牌 token 時，請在此寫明並實作：

| 項目     | 建議內容                                                                  |
| -------- | ------------------------------------------------------------------------- |
| 來源     | Figma 檔名、fileKey、Mode（例如僅 light）                                 |
| 實作檔案 | 如 `src/assets/styles/tokens.css`、`typography.css`、`tailwind.config.js` |
| 核心規則 | 禁止硬編碼、語意色優先、文字樣式 class、陰影 token…                       |
| 速查     | 常用 Tailwind class／utility 對照表                                       |

並同步更新：

- `.cursor/rules/design-system.mdc`（專案細節）
- `docs/css-conventions.md`（若需指向 token 檔）

## 無設計系統時

以 Tailwind `theme.extend` 與 `docs/css-conventions.md` 為準即可；Agent 仍遵守 `.cursor/rules/design-system.mdc` 的通用規則。
