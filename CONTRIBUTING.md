# Git 協作說明

## 分支命名規則

所有功能開發都在自己的 feature branch 上進行，命名格式如下：

feature/[人名縮寫]-[功能名稱]

範例：
- feature/hsy-db-schema
- feature/cyk-order-crud
- feature/lyt-scheduler-core
- feature/hms-order-list
- feature/cih-calendar-view
- feature/qyh-ci-setup

## 每次開始新工作的流程

### 步驟一：確保本地 develop 是最新的

git checkout develop
git pull origin develop

### 步驟二：從 develop 開新的 feature branch

git checkout -b feature/你的名字縮寫-功能名稱

範例：
git checkout -b feature/cyk-order-crud

## 日常開發流程

### 寫完一個小功能就 commit，不要累積太久

git add .
git commit -m "feat: 簡短說明做了什麼"

commit message 前綴規則：
- feat:     新增功能
- fix:      修 bug
- refactor: 重構，沒有新增功能也沒修 bug
- test:     新增或修改測試
- docs:     文件修改
- chore:    雜事，例如改設定檔

範例：
git commit -m "feat: add Order entity and repository"
git commit -m "fix: fix quantity validation boundary condition"
git commit -m "test: add unit test for scheduler split logic"

### 推上 GitHub

git push origin feature/你的分支名稱

範例：
git push origin feature/cyk-order-crud

## 開 Pull Request

### 步驟一：到 GitHub 網頁

push 完後，GitHub 頁面上方會出現黃色提示列，點 Compare & pull request

或手動操作：
1. 到 repo 頁面
2. 點上方 Pull requests 頁籤
3. 點右上角綠色 New pull request 按鈕
4. base 選 develop，compare 選你的 feature branch
5. 點 Create pull request

### 步驟二：填寫 PR 說明

標題格式：[W週次 姓名] 類型: 簡短說明

範例：
[W1 王暄雅] feat: Order entity and CRUD API
[W2 陳信嘉] feat: scheduler core logic
[W1 何孟修] chore: CI/CD workflow setup

內文必須包含以下三個區塊：

---

## 這個 PR 做了什麼
- （條列說明這個 PR 新增或修改了什麼）

## 怎麼測試
1. （說明 reviewer 要怎麼驗證這個 PR 是正確的）
2. （例如要執行什麼指令、預期看到什麼結果）

## 注意事項
- （有沒有需要 reviewer 特別注意的地方）
- （有沒有已知的限制或之後要補的東西）

---

### 步驟三：等待 review

至少需要一位組員 Approve 才能 merge。
在群通知「PR 已開，請大家 review」。

## Review 別人的 PR

### 步驟一：到 GitHub 的 Pull requests 頁籤

點進要 review 的 PR。

### 步驟二：看程式碼

點 Files changed 頁籤，看這個 PR 修改了哪些檔案。
對有問題的地方可以點行號旁邊的 + 號留 comment。

### 步驟三：給出結論

點右上角 Review changes 按鈕，選擇：
- Approve：沒問題，同意合併
- Request changes：有問題，需要修改後再看
- Comment：只留意見，不給結論

### 步驟四：Approve 後由 PR 發起人自己 Merge

不要幫別人按 Merge，由 PR 發起人確認 Approve 後自己按。

## Merge PR

### 步驟一：確認 CI 是綠燈

PR 頁面下方的 Checks 區塊，確認所有項目都是綠色勾勾。
如果有紅色叉叉，先修好再 merge。

### 步驟二：按 Merge pull request

選擇 Squash and merge（把所有 commit 壓成一個，保持 develop 歷史整潔）。
點 Confirm squash and merge。

### 步驟三：刪除已 merge 的 feature branch

merge 完後 GitHub 會提示 Delete branch，點它把 feature branch 刪掉。
本地端也同步刪除：

git checkout develop
git pull origin develop
git branch -d feature/你的分支名稱



## 每週 develop 合併到 main

每週末 demo 前由組長操作，確認 develop 穩定後：
1. 到 GitHub 開 PR，base 選 main，compare 選 develop
2. 標題填：[Wx] weekly merge: develop to main
3. 組員 Approve 後 merge

