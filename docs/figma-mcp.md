# Figma MCP 使用規範（共用）

人與任何 AI 工具皆適用（不限 Cursor）。

## 原則

- **預設唯讀**：使用 Figma MCP 時，預設只讀取設計（截圖、結構、tokens、Code Connect 等）
- **禁止擅自寫入**：未經使用者**明確要求**，不得對 Figma 檔案做任何建立、修改、刪除、上傳或同步寫入
- **有疑慮先問**：若任務可能涉及寫入但使用者未明說，先確認再執行

## 允許（無需額外確認）

唯讀類工具，例如：

- `get_design_context`、`get_screenshot`、`get_metadata`、`get_variable_defs`
- `get_figjam`、`get_motion_context`、`search_design_system`
- `get_code_connect_map`、`get_code_connect_suggestions`、`whoami`

## 禁止（除非使用者明確要求寫入 Figma）

寫入／變更類工具，例如：

- `use_figma`、`generate_figma_design`、`generate_diagram`、`create_new_file`
- `upload_assets`、`add_code_connect_map`、`send_code_connect_mappings`
- 任何會新增、移動、刪除、改樣式／文字／元件，或覆寫 Figma 內容的操作

## 行為對照

```text
❌ BAD：使用者說「照這個 Figma 做元件」→ 自行 use_figma / generate_figma_design 改稿
✅ GOOD：使用者說「照這個 Figma 做元件」→ 只讀取設計，在程式碼實作

❌ BAD：為了「對齊設計」主動把程式畫面推回 Figma
✅ GOOD：僅在使用者明確說「寫入／更新／同步到 Figma」時才寫入
```

## 與實作的關係

- 「依 Figma 實作／還原 UI」= **改程式碼**，不是改 Figma
- 「推到 Figma／在 Figma 建畫面／同步設計」= 才可使用寫入類工具
