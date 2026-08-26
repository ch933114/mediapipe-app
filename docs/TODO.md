# 待補資訊

- 尚未設定 Bitbucket remote（可先開專案、之後再建立雲端 repo）：
  1. 請主管或 DevOps 在 Bitbucket 建立空 repo
  2. `git remote add origin git@bitbucket.org:<workspace>/<repo>.git`
  3. commit 後再 `git push -u origin test`／`main`（有 uat 一併 push）

- 請把以下環境的 API URL 從 `https://TODO_REPLACE_ME` 替換成正確網址：
  - .env.staging
  - .env.production
