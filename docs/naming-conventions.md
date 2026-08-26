# 命名規範（檔案＋程式碼）

AI 與人類共用。新增／重命名檔案或識別子時**必須**遵守本文件；與本文件衝突時以本文件為準。

相關：`docs/project-conventions.md`（目錄）、`docs/code-conventions.md`（寫法）、`docs/css-conventions.md`（樣式）。

---

## 1. 大小寫速查

| 風格                | 範例                             | 用途                                                                  |
| ------------------- | -------------------------------- | --------------------------------------------------------------------- |
| **PascalCase**      | `UserCard`、`HomeView`           | Vue 元件檔／元件名、型別／介面、Enum 名稱、`*Model`                   |
| **camelCase**       | `userId`、`fetchUser`、`useAuth` | 變數、函式、方法、composable 檔名、一般 `.ts` 檔名、props／emits 名稱 |
| **kebab-case**      | `page-header`、`zh-TW`           | 自訂 CSS class、資料夾（多字）、語系檔、路由 path、專案名稱           |
| **SCREAMING_SNAKE** | `API_BASE_URL`、`MAX_RETRY`      | `constants/` 與模組級常數、`.env` 變數名                              |
| **snake_case**      | —                                | **禁止**用於檔名與程式識別子（後端 JSON 欄位除外，見 §7）             |

原則：

- 名稱用**英文**；UI 顯示文字用繁體中文（i18n 或模板字串）
- 名稱要能表達職責；避免 `data`、`info`、`temp`、`utils2`、`foo`
- 縮寫維持一致大小寫：`Id`／`id`、`Url`／`url`、`Api`／`api`（勿混用 `ID`／`URL` 在 camel／Pascal 中段，例：`userId` 而非 `userID`）

---

## 2. 目錄與檔名

### 2.1 目錄

- `src/` 下分類目錄固定為**複數或既有名稱**（見 `project-conventions.md`）：`components/`、`composables/`、`services/`、`stores/`、`views/`…
- 新增子目錄用 **kebab-case**（例：`components/common/form-fields/`）
- 不要為單一檔案多開無意義資料夾

### 2.2 依目錄的檔名

| 位置                                       | 檔名規則                                                                   | 範例                                                           |
| ------------------------------------------ | -------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `components/common/`、`components/layout/` | **PascalCase** `.vue`；一檔一主要元件                                      | `UserCard.vue`、`AppLayout.vue`                                |
| `views/`                                   | **PascalCase** + `View` 後綴                                               | `HomeView.vue`、`UserDetailView.vue`                           |
| `composables/`                             | **camelCase**，`use` 開頭                                                  | `useAuth.ts`、`useLocale.ts`                                   |
| `stores/`                                  | **camelCase**；建議與 store id 對齊                                        | `user.ts` → `useUserStore`；或多字 `userProfile.ts`            |
| `services/`                                | **camelCase**                                                              | `api.ts`、`request.ts`                                         |
| `services/apis/`                           | **camelCase**，模組名 + 可選 `Api`                                         | `user.ts` 或 `userApi.ts`（同專案擇一，新建預設 `userApi.ts`） |
| `models/`                                  | **PascalCase** + `Model` 後綴                                              | `UserModel.ts`、`OrderItemModel.ts`                            |
| `types/`                                   | **camelCase**（領域名）                                                    | `api.ts`、`user.ts`                                            |
| `enums/`                                   | **PascalCase** 或領域 **camelCase**（同專案一致；新建預設 **PascalCase**） | `OrderStatus.ts`                                               |
| `constants/`                               | **camelCase**                                                              | `appConfig.ts`、`storageKeys.ts`                               |
| `utils/`                                   | **camelCase**；動詞或主題                                                  | `resolveEnv.ts`、`formatDate.ts`                               |
| `router/`                                  | 既有 `index.ts`；拆分時 **camelCase**                                      | `routes.ts`、`guards.ts`                                       |
| `i18n/locales/`                            | **BCP 47／既有碼**                                                         | `zh-TW.json`、`en.json`                                        |
| `assets/images/`                           | **kebab-case**                                                             | `hero-banner.png`、`icon-close.svg`                            |
| `assets/styles/`                           | **kebab-case**                                                             | `app.css`、`tokens.scss`                                       |
| 測試檔（若有）                             | 與被測檔同名 + `.spec`／`.test`                                            | `formatDate.spec.ts`、`UserCard.spec.ts`                       |

### 2.3 檔名禁止

- 空格、底線（`snake_case`）、連續連字號
- 無意義後綴：`New`、`Copy`、`Temp`、`Final`
- 與目錄重複語意：`components/ButtonComponent.vue` → 用 `Button.vue`
- 用檔名編碼功能變體以外的狀態（`.plain`／`.i18n`／`.tw` 僅限 **scaffold 模板**，產出專案勿新增）

### 2.4 匯出與檔名對齊

- 元件：檔名 `UserCard.vue` → 預設／主要匯出對應 `UserCard`
- Composable：檔名 `useAuth.ts` → 匯出 `useAuth`
- Model：檔名 `UserModel.ts` → 匯出 `UserModel`（型別或 schema）
- 不要 `export default` 一個與檔名無關的名字

---

## 3. TypeScript 識別子

### 3.1 變數與函式

| 種類             | 規則                              | 範例                                        |
| ---------------- | --------------------------------- | ------------------------------------------- |
| 區域／參數變數   | camelCase                         | `userId`、`isLoading`                       |
| 布林             | `is`／`has`／`can`／`should` 前綴 | `isOpen`、`hasError`、`canEdit`             |
| 函式／方法       | camelCase；動詞開頭               | `fetchUser`、`formatDate`、`handleSubmit`   |
| 事件處理（模板） | `on` + 事件，或 `handle` + 動作   | `onClick`、`handleSubmit`（同檔內擇一風格） |
| 陣列             | 複數名詞                          | `users`、`orderItems`                       |
| Map／Record      | `by`／`Map`／`Lookup` 後綴擇一    | `userById`、`statusLabelMap`                |

### 3.2 常數

| 種類                                       | 規則                              | 範例                                |
| ------------------------------------------ | --------------------------------- | ----------------------------------- |
| 模組級／真正常數                           | `SCREAMING_SNAKE`                 | `SUCCESS_CODES`、`DEFAULT_LOCALE`   |
| `const` 但非「設定常數」（物件實例、函式） | camelCase                         | `const router = …`                  |
| 放 `constants/` 的鍵名                     | 匯出 `SCREAMING_SNAKE` 或分組物件 | `export const STORAGE_KEYS = { … }` |

### 3.3 型別、介面、Enum

| 種類                 | 規則                                                               | 範例                                 |
| -------------------- | ------------------------------------------------------------------ | ------------------------------------ |
| `type`／`interface`  | PascalCase；**不要** `I` 前綴                                      | `User`、`ApiResult`、`UserCardProps` |
| Props 型別           | `ComponentName` + `Props`                                          | `UserCardProps`                      |
| Emits 型別（若獨立） | `ComponentName` + `Emits`                                          | `UserCardEmits`                      |
| 泛型參數             | 單一大寫或 PascalCase                                              | `T`、`TData`、`TResult`              |
| Enum 名稱            | PascalCase                                                         | `OrderStatus`                        |
| Enum 成員            | PascalCase 或 SCREAMING_SNAKE（同檔一致；新建預設 **PascalCase**） | `OrderStatus.Pending`                |
| 聯合型別成員（字串） | kebab 或 camel 與 API／網域一致                                    | `'pending' \| 'done'`                |

共用型別 → `src/types/`；單一 API／模組模型 → `src/models/`（見 code-conventions）。

### 3.4 類別（少用）

- 若使用 `class`：PascalCase（`SessionCache`）
- 偏好函式＋型別；不要為了命名而引入 class

---

## 4. Vue 專用

### 4.1 元件

- 檔名與元件名 **PascalCase**
- 多字名稱（避免單字與原生 HTML 衝突）：`UserCard` 而非 `Card` 若語意過泛；基礎元件可用清晰單字如 `Modal`、`Spinner`
- 版型放 `layout/`，常用前綴 `App`：`AppLayout`、`AppHeader`
- 頁面元件在 `views/`，後綴 `View`

### 4.2 Props／Emits／Slots

| 項目           | 規則                                                     | 範例                              |
| -------------- | -------------------------------------------------------- | --------------------------------- |
| prop 名        | camelCase（腳本）；模板可用同名                          | `userId`、`isDisabled`            |
| emit 事件名    | camelCase                                                | `update:modelValue`、`itemSelect` |
| `v-model` 參數 | `modelValue` 或具名 `modelXxx`                           | `modelValue`、`modelOpen`         |
| slot 名        | camelCase 或 kebab（同元件一致；新建預設 **camelCase**） | `headerActions`                   |

### 4.3 `<script setup>` 內

- 與模板綁定的 ref／reactive：camelCase（`const isOpen = ref(false)`）
- 模板中元件標籤用 PascalCase：`<UserCard />`
- 不要用 `data` 當唯一狀態名；用領域名（`user`、`formState`）

### 4.4 Composables

- 函式與檔名：`use` + PascalCase 主題 → 檔案寫成 camelCase：`useUserSession.ts` 匯出 `useUserSession`
- 回傳物件鍵：camelCase
- 回傳若含 ref，名稱不要再加 `Ref` 後綴（`user` 而非 `userRef`），除非需與非 ref 同名區分

### 4.5 Pinia

- Store 函式：`use` + 領域 + `Store` → `useUserStore`
- `defineStore` 的 id：與領域一致的 **kebab-case** 或 camelCase（同專案一致；新建預設 **kebab-case**）→ `defineStore('user', …)`、`defineStore('user-profile', …)`
- state 欄位：camelCase；布林用 `is`／`has` 前綴

---

## 5. API／Services

| 項目              | 規則                           | 範例                                                     |
| ----------------- | ------------------------------ | -------------------------------------------------------- |
| 請求函式          | HTTP 語意或動作                | `getData`、`postData`；模組內 `fetchUser`、`createOrder` |
| `services/apis/*` | 一模組一檔；匯出函式 camelCase | `userApi.ts` → `getUser`、`updateUser`                   |
| 不要              | 在元件內直接 `axios`／`fetch`  | 一律走 `services/`                                       |

---

## 6. 路由、環境變數、i18n

### 6.1 路由

- `path`：**kebab-case**，開頭 `/` → `/user-profile`、`/orders/:orderId`
- `name`：PascalCase 或 camelCase（同專案一致；新建預設 **PascalCase**）→ `UserProfile`、`OrderDetail`
- 動態參數：camelCase → `:orderId`

### 6.2 環境變數

- 檔案：`.env`、`.env.development`、`.env.production`…
- 變數名：`VITE_` 前綴 + **SCREAMING_SNAKE** → `VITE_API_BASE_URL`
- 程式內讀取後賦給 camelCase 常數亦可：`const apiBaseUrl = import.meta.env.VITE_API_BASE_URL`

### 6.3 i18n key

- **kebab-case** 分段，用 `.` 分層 → `home.title`、`common.button.submit`
- 不要把完整中文當 key
- 語系檔名：`zh-TW.json`、`en.json`

---

## 7. CSS／Tailwind

- 自訂 class：**kebab-case** → `.page-header`、`.user-card__title`（BEM 可選，同元件一致）
- CSS 變數：**kebab-case** → `--color-primary`、`--space-md`
- Tailwind：以 utility 為主；自訂 theme key 用 camelCase 或巢狀物件（依 `tailwind.config` 既有風格）
- 設計系統若已規定前綴／token 名，**不得**自行發明衝突名稱（見 `design-system.md`）

---

## 8. 後端欄位對應

- 後端若為 `snake_case` JSON：在 **model／mapper** 層轉成前端 camelCase；元件與 store 只見 camelCase
- 型別欄位與前端使用處統一 camelCase
- 不要為了「和後端一樣」在 Vue 模板散落 `user_name`

---

## 9. AI 執行清單（必做）

建立或修改程式時自檢：

1. 檔案放對目錄，檔名符合 §2 表格
2. 匯出名稱與檔名對齊
3. 元件／View／Props／Emits／composable／store 後綴與前綴正確
4. 布林、陣列、常數大小寫正確
5. 路由 path 用 kebab-case；env 用 `VITE_` + SCREAMING_SNAKE
6. i18n key 用階層化 kebab／點記法
7. 自訂 CSS class 用 kebab-case
8. 不新增 `snake_case` 檔名或識別子（API 邊界除外）
9. UI 字串繁中；識別子英文

---

## 10. 對照示例

```text
✅ components/common/UserCard.vue          + UserCardProps
✅ views/OrderDetailView.vue
✅ composables/useOrderForm.ts             → useOrderForm()
✅ stores/user.ts                          → useUserStore + id 'user'
✅ services/apis/orderApi.ts               → fetchOrder()
✅ models/OrderModel.ts
✅ types/order.ts                          → Order、OrderStatus
✅ constants/storageKeys.ts                → STORAGE_KEYS
✅ utils/formatDate.ts
✅ assets/images/hero-banner.png
✅ i18n key: order.detail.title
✅ path: /order-detail/:orderId

❌ components/common/user-card.vue
❌ views/orderDetail.vue
❌ composables/orderForm.ts                （缺 use）
❌ stores/UseUserStore.ts
❌ types/IUser.ts                          （禁 I 前綴）
❌ const is_loading = …
❌ .env: apiBaseUrl=…
❌ class="pageHeader"
```
