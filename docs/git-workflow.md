# Git 工作流程（共用）

## 分支與環境

- `main`: 正式站（build:prod → tag `vX.0.0`）
- `test`: 測試站（build:stage → tag `v0.0.y`）
- `uat`: 正式站前測試環境（可選，build:uat → tag `v0.x.0`）

## 日常流程（建議）

1. `git checkout main && git pull`
2. `git checkout -b feature/<name>`
3. 開發、commit（見 `docs/commit-conventions.md`）
4. 需要發佈時，把功能合併到對應環境分支並執行 build 指令

## SSH Clone（每人不同）

若每人 SSH key 不同，可用：

```bash
GIT_SSH_COMMAND="ssh -i ~/.ssh/你的key -o IdentitiesOnly=yes" \
  git clone git@bitbucket.org:<workspace>/<repo>.git
```
