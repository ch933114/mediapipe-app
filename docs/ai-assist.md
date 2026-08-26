# AI 輔助規範（共用）

**規範本體在 `docs/` 與 `AGENTS.md`。**  
各工具另有自動載入入口，內容都指回同一套規範，避免各寫一份。

## 自動遵守（各工具入口）

開專案後，下列檔案會被對應工具**自動注入**（無需手動 `@`）：

| 工具                             | 自動載入檔                                         | 說明                         |
| -------------------------------- | -------------------------------------------------- | ---------------------------- |
| Cursor                           | `.cursor/rules/*.mdc` + 多數情況也會讀 `AGENTS.md` | rules 為摘要，細節在 `docs/` |
| GitHub Copilot（VS Code／Agent） | `AGENTS.md`、`.github/copilot-instructions.md`     | 兩者都會套用                 |
| Claude Code                      | `CLAUDE.md`（內含 `@AGENTS.md` 等匯入）            | 啟動即載入                   |
| Gemini CLI                       | `GEMINI.md`                                        | 啟動即載入                   |
| 其他支援 agents.md 的 Agent      | `AGENTS.md`                                        | 跨工具標準入口               |

**仍不會自動載入的情況**：網頁版 ChatGPT／未開 repo 的對話、未支援專案規則的外掛。此時請 `@AGENTS.md` 或貼上 `docs/ai-assist.md`。

## 必讀（動筆前）

1. `AGENTS.md`（含 Always apply）
2. `docs/project-conventions.md`
3. `docs/naming-conventions.md`
4. `docs/code-conventions.md`
5. `docs/comment-conventions.md`
6. `docs/css-conventions.md`
7. `docs/figma-mcp.md`
8. `docs/deployment.md`
9. `docs/design-system.md`（若專案有設計系統）

## Skills（標準流程）

專案預置以下流程。Cursor 可用 `/commit` 等觸發；其他 AI 依 `AGENTS.md` Skills 表或 `.cursor/skills/*/SKILL.md` 執行。

| Skill              | 用途        | 要點                                                                                            |
| ------------------ | ----------- | ----------------------------------------------------------------------------------------------- |
| `commit`           | 完整 commit | 先 format／lint／type-check；依 docs／tooling／app 分類成少量 Conventional Commits；預設不 push |
| `push`             | 安全推送    | 先 type-check／lint／stylelint／format:check；禁止 force push                                   |
| `deploy`           | 部署與版號  | `build:stage`／`build:uat`／`build:prod` + bump／tag；見 `docs/deployment.md`                   |
| `mediapipe-test` | 專案導覽    | 常用指令、目錄、必讀文件速查                                                                    |

## 與工具無關的底線

- UI 文案：繁體中文
- 命名／目錄／API 層職責：見 `docs/naming-conventions.md`、`docs/project-conventions.md`
- Figma：預設唯讀，見 `docs/figma-mcp.md`
- 提交：Husky + commitlint 強制；格式見 `docs/commit-conventions.md`

## 維護原則

- **只改 `docs/` + `AGENTS.md` 的規則內容**
- 工具入口檔（`CLAUDE.md`、`GEMINI.md`、`.github/copilot-instructions.md`、`.cursor/rules/`）保持薄適配，避免各寫一套造成漂移
