# Wafer 訂單管理排程系統

## 本地啟動方式 (暫定)
1. docker compose up db -d
2. 等約 10 秒讓 MySQL 啟動完成
3. 餵入 schema：
Get-Content backend\src\main\resources\schema.sql | docker exec -i wafer-order-management-db-1 mysql -u root -proot woms
4. 餵入種子資料：
Get-Content backend\src\main\resources\data.sql | docker exec -i wafer-order-management-db-1 mysql -u root -proot woms
5. docker exec -it wafer-order-management-db-1 mysql -u root -proot woms
6. SHOW TABLES; 應該看到 9 張表
7. SELECT * FROM customers; 應該看到 3 筆資料


## 本地啟動方式 (正式版，先模擬的，待修改)
### 第一次啟動
```bash
git clone https://github.com/你的帳號/wafer-order-management
cd wafer-order-management
docker-compose up --build
```

### 之後啟動
```bash
docker-compose up
```

### 停止
```bash
docker-compose down
```

## 各服務位置
| 服務 | 網址 |
|---|---|
| 前端 | http://localhost:3000 |
| 後端 API | http://localhost:8080/api |
| MySQL | localhost:3306 |

## 測試帳號
| 帳號 | 密碼 | 權限 |
|---|---|---|
| admin | password123 | ADMIN（可新增修改取消訂單） |
| viewer | password123 | VIEWER（只能查看） |


## 分支說明
- main：穩定版本，每週末合併
- develop：開發主分支，所有 PR 合併到這裡
- feature/xxx：個人功能分支

## PR 流程
1. 從 develop 開 feature branch
2. 完成功能後推上去，開 PR 到 develop
3. 至少一人 review 並 approve
4. PR 發起人自己按 Merge