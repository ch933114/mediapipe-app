---
name: deploy
description: Guide safe deploy steps using build:stage/build:uat/build:prod and the project tagging rules. Use when the user asks how to deploy, release, bump tag, or says /deploy.
disable-model-invocation: true
---

# /deploy

本 repo 的部署以 `pnpm run build:*` 為主；指令會自動執行：format → lint → stylelint → type-check → build → bump/tag/push。

## 分支與環境（最新版）

- `test`：測試站
- `uat`：正式站前測試環境（可選）
- `main`：正式站

## 版號規則（tag）

- `test`：`v0.0.y`（patch +1）
- `uat`：`v0.x.0`（minor +1；patch 永遠 0）
- `main`：`vX.0.0`（major +1；minor/patch 永遠 0；第二次部署為 `v2.0.0`）

## 部署指令

### 測試站（test）

```bash
git checkout test
git pull
pnpm run build:stage
```

### uat（可選）

```bash
git checkout uat
git pull
pnpm run build:uat
```

### 正式站（main）

```bash
git checkout main
git pull
pnpm run build:prod
```

## 本機測試旗標

- `SKIP_BUMP=1 pnpm run build:stage`：只 build，不 bump/tag/push
- `SKIP_PUSH=1 pnpm run build:prod`：bump+tag 但不 push
