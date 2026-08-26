---
name: push
description: Run required checks (type-check/lint/stylelint/format) and then push the current branch safely without force. Use when the user asks to push or says /push.
disable-model-invocation: true
---

# /push

在本 repo 執行「推送前檢查 + 安全 push」流程。

## 原則（必遵守）

- **先檢查再 push**：至少要通過 type-check。
- **不做危險 git 操作**：不改 git config、不 force push、不 `--no-verify`（除非使用者明確要求）。
- **不推 secrets**：若發現 `.env`、憑證檔、token 等被追蹤，停止並提醒。

## 推送前檢查（必做）

依序執行：

1. `pnpm run type-check`
2. `pnpm run lint`
3. `pnpm run stylelint`
4. `pnpm run format:check`

任何一步失敗都要停止，先修到通過再繼續。

## Push 流程

1. 盤點狀態
   - `git status --short`
   - `git log -5 --oneline`
2. 確認目前分支是否有 upstream
   - 若已有 upstream：`git push`
   - 若沒有 upstream：`git push -u origin HEAD`
3. Cursor/Agent 環境（SSH 需要走 SOCKS）
   - 若環境變數有 `SOCKS5_PROXY`（例：`socks5://127.0.0.1:61573`），請改用：
     - `GIT_SSH_COMMAND="ssh -o ProxyCommand=\"nc -X 5 -x ${SOCKS5_PROXY#socks5://} %h %p\"" git push`
     - `GIT_SSH_COMMAND="ssh -o ProxyCommand=\"nc -X 5 -x ${SOCKS5_PROXY#socks5://} %h %p\"" git push -u origin HEAD`
4. Push 完成後
   - `git status` 確認乾淨，且本地與遠端同步
