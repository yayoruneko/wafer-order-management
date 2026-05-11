# Wafer 訂單管理排程系統

## 本地啟動方式 (暫定)

> 若要在本機直接開發前端（在 `frontend/` 執行 `npm install` / `npm run dev` / `npm test`），請使用 Node.js 20+（前端 Docker build image 亦使用 Node 20）。

1. docker compose up db -d
2. 等約 10 秒讓 MySQL 啟動完成
3. 餵入 schema：
Get-Content backend\src\main\resources\schema.sql | docker exec -i wafer-order-management-db-1 mysql -u root -proot woms
4. 餵入種子資料：
Get-Content backend\src\main\resources\data.sql | docker exec -i wafer-order-management-db-1 mysql -u root -proot woms
5. docker exec -it wafer-order-management-db-1 mysql -u root -proot woms
6. SHOW TABLES; 應該看到 9 張表
7. SELECT * FROM customers; 應該看到 3 筆資料

## 分支說明
- main：穩定版本，每週末合併
- develop：開發主分支，所有 PR 合併到這裡
- feature/xxx：個人功能分支