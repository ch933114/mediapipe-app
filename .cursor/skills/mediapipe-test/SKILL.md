---
name: mediapipe-test
description: mediapipe 測試 專案導覽與常用指令
---

# mediapipe 測試（mediapipe-test）

## 快速指令

```bash
pnpm dev                    # 本機開發（main 分支）
pnpm run build:stage        # 測試站 build + tag（test 分支）
pnpm run build:uat          # uat build + tag（若有 uat 分支）
pnpm run build:prod         # 正式站 build + tag（main 分支）
```

## 必讀文件

1. `AGENTS.md`
2. `docs/ai-assist.md`
3. `docs/project-conventions.md`
4. `docs/naming-conventions.md`
5. `docs/deployment.md`
6. `docs/code-conventions.md`
7. `docs/comment-conventions.md`
8. `docs/css-conventions.md`
9. `docs/figma-mcp.md`
10. `docs/design-system.md`（若專案有設計系統）

## 目錄速查

| 目錄                     | 用途       |
| ------------------------ | ---------- |
| `src/views/`             | 路由頁面   |
| `src/components/common/` | 共用 UI    |
| `src/components/layout/` | 版型       |
| `src/services/`          | API 層     |
| `src/stores/`            | Pinia      |
| `src/composables/`       | 組合式函數 |

## Skills

- `commit` — commit 流程（檢查 → 分類提交）
- `push` — push 前檢查後安全推送
- `deploy` — 部署與 tag
