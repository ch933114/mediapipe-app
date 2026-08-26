# 部署與版號

本專案的部署採用 `pnpm run build:*` 指令，會自動：

1. format → lint → stylelint → type-check
2. `vite build --mode <env>`
3. `scripts/bump-and-tag.mjs`：讀取 `omniguider.config.json` 的 `tagStrategy`、更新版號、commit dist、打 tag、push

## 分支與建置指令

- `test`（測試站）：`pnpm run build:stage` → tag `v0.0.y`
- `uat`（可選，正式站前測試環境）：`pnpm run build:uat` → tag `v0.x.0`
- `main`（正式站）：`pnpm run build:prod` → tag `v{x}.0.0`

## 版號規則（部署時低位歸零）

- test：只動 patch（`v0.0.1` → `v0.0.2`）
- uat：只動 minor，patch 永遠為 0（`v0.1.0` → `v0.2.0`）
- main：只動 major，minor/patch 永遠為 0（`v1.0.0` → `v2.0.0`）

## bump-and-tag 做什麼

`scripts/bump-and-tag.mjs` 會：

1. 更新 `package.json` 的 `version`
2. `git add package.json && git add -f dist`（`dist` 在 `.gitignore`，需 `-f`）
3. commit（`build: stage|uat|prod`）
4. 建立 annotated tag `vX.Y.Z`
5. `git push --follow-tags origin <branch>`

> 若是在 Cursor/Agent 環境執行，SSH 可能需要走 `SOCKS5_PROXY`，否則會遇到 `Could not resolve hostname bitbucket.org`。這時請改用 `/push` skill 內的 SOCKS 版 push 指令。

## 旗標

- `SKIP_BUMP=1`：跳過 bump/tag/push（用於本機測試 build）
- `SKIP_PUSH=1`：只建立 commit+tag，不 push
