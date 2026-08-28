---
name: commit
description: Run a complete git commit workflow for this Vue3 project and split changes into a few meaningful commits. Use when the user asks to commit, create commits, or says /commit.
disable-model-invocation: true
---

# /commit

在本 repo 執行「完整 commit 流程」，並把變更**分類成少量 commits**（不用分太細），符合 Conventional Commits 與專案規範。

## 前置原則（必遵守）

- **先看再做**：提交前一定要檢視 `git status` 與 `git diff`（含 staged/unstaged）。
- **不做危險 git 操作**：不改 git config、不 force push、不 `reset --hard`、不 `--no-verify`（除非使用者明確要求）。
- **不要把所有變更塞進同一個 commit**：至少依「文件 / 工具 / 功能」做 2–4 個 commits。
- **不要提交 secrets**：`.env`、憑證檔、token 等一律不 commit；如使用者要求要先提醒風險。
- **訊息格式**：遵循 `docs/commit-conventions.md`（Conventional Commits）。

## 分類策略（不用分太細）

通常 2–4 個 commits 即可，建議順序：

1. **docs / 規範**：`docs/**`、`.cursor/**`、`README.md`
   - 建議：`docs: ...`
2. **tooling / repo 設定**：根目錄設定檔（`package.json`、`eslint.config.mjs`、`.prettierrc.json`…）
   - 建議：`chore: ...`
3. **app 程式碼**：`src/**`
   - 建議：`feat: ...` / `fix: ...` / `refactor: ...`

> 若某一類只改 1–2 行且與另一類強耦合，可合併；但仍避免把「文件+程式碼+工具」全部塞同一包。

## 執行流程（照順序）

### 0) Commit 前檢查（必做）

1. `pnpm run format`
2. `pnpm run lint`
3. `pnpm run stylelint`
4. `pnpm run format:check`
5. `pnpm run type-check`

任何一步失敗都要停止，先修到通過再繼續。

### 1) 蒐集現況

- `git status --short`
- `git diff`
- `git diff --staged`
- `git log -5 --oneline`

### 2) 切分變更（以檔案路徑為主）

- 只 stage 同一類檔案（避免 `git add -A` 一次全加）
- 檢查 `git diff --staged` 是否乾淨、只包含該類

### 3) 撰寫 commit message

用 heredoc（避免跳脫問題）：

```bash
git commit -m "$(cat <<'EOF'
type: subject

Body (optional).
EOF
)"
```

### 4) 重複 2)–3) 直到變更清空

### 5) 最後檢查

- `pnpm run lint`
- `pnpm run stylelint`
- `pnpm run format:check`
- `pnpm run type-check`
- `git status` 應該乾淨

### 6) 推送（若使用者要求）

預設只 commit **不 push**。若使用者要求 push，再執行 `/push`。
