# Commit 規範（共用）

採用 Conventional Commits。

## 格式

```
<type>(<scope>): <subject>
```

## Type

- `feat`: 新功能
- `fix`: 錯誤修復
- `docs`: 文件
- `style`: 格式（不影響邏輯）
- `refactor`: 重構
- `test`: 測試
- `chore`: 建置、依賴、工具
- `build`: 建置 / 發佈（此 repo 的 bump-and-tag 會用）

## 原則

- subject 可使用繁體中文
- 禁止在 commit 訊息中包含 secrets
- 一個 commit 做一件事，避免把文件/工具/功能全部混在一起
