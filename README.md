# Wafer 訂單管理排程系統

## 本地啟動方式

> 若要在本機直接開發前端（在 `frontend/` 執行 `npm install` / `npm run dev` / `npm test`），請使用 Node.js 20+（前端 Docker build image 亦使用 Node 20）。

### 需求
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) （啟動後確認右下角 Docker 圖示正在執行）

### 第一次啟動（或要重置資料庫）

```
docker compose down -v
docker compose up --build
```

`-v` 會清除舊資料庫 volume，重新用 `schema.sql` 建表並用 `data.sql` 插入種子資料。
`--build` 會重新編譯後端 JAR 與前端靜態檔，**首次約需 3–5 分鐘**。

### 日常啟動（不清資料）

```
docker compose up
```

### 確認服務正常

| 服務 | 網址 |
|------|------|
| 前端 | http://localhost:3000 |
| 後端 Swagger | http://localhost:8080/swagger-ui.html |
| MySQL | localhost:3306（帳號 `root`，密碼 `root`，DB `woms`） |

後端啟動後約 5–10 秒，QueuePoller 會自動把種子訂單排程完畢，訂單狀態從 `PENDING` 變為 `SCHEDULED`。

### 登入

系統預設三組測試帳號（由 `DemoDataInitializer` 在啟動時自動建立）：

| 帳號 | 密碼 | 角色 | 權限說明 |
|------|------|------|----------|
| `superadmin` | `password` | Super Admin | 最高權限，可管理所有資源 |
| `admin` | `password` | Admin | 管理員，可管理訂單與排程 |
| `viewer` | `password` | Viewer | 唯讀，僅可查看資料 |

### 停止

```powershell
docker compose down        # 停止並移除 container，資料保留
docker compose down -v     # 停止並清除資料庫（下次啟動重置）
```

## 分支說明
- main：穩定版本，每週末合併
- develop：開發主分支，所有 PR 合併到這裡
- feature/xxx：個人功能分支
