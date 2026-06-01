# WOMS 晶圓訂單管理系統 — 測試報告

> 撰寫日期：2026-06-01
> 對應規格：[`SCHEDULING_RULES.md`](SCHEDULING_RULES.md)
> 對應程式：`backend/` (Spring Boot 3 / Java 21) + `frontend/` (React 19 / Vite)

---

## 一、概述

WOMS 系統的核心是「訂單 → 排程 → 產能 → 跨天分配」的整條 pipeline，
任何環節出錯都會直接造成超分配、交期錯算、或使用者看到不一致的狀態。
本份測試策略以 **規則驅動 (rule-driven)** 為原則，每一條 `SCHEDULING_RULES.md`
列出的規則都對應到至少一個自動化測試。

### 1.1 測試成果摘要

| 層級 | 測試檔案數 | 測試案例數 | 通過率 | 執行指令 |
|---|---|---|---|---|
| Backend 全套 (unit + integration) | 10 | **138** | 100% | `mvn test` |
| Frontend Unit | 16 | **124** | 100% | `npm test` |
| Frontend Integration | 1 | **6**   | 需後端啟動 | `npm run test:integration` |
| **總計** | **27** | **268** | **100%** | — |

> 執行時間：Backend ~20 秒、Frontend Unit ~4 秒、Frontend Integration ~5 秒（含後端對打）。

### 1.2 程式碼覆蓋率（Code Coverage）

| 範圍 | Lines | Statements | Branches | Functions | 工具 |
|---|---|---|---|---|---|
| Backend | 由 JaCoCo 量測，報告 = `backend/target/site/jacoco/jacoco.xml` | — | — | — | JaCoCo 0.8.12 |
| Frontend | **50.26%** | 48.56% | 38.32% | 45.54% | Vitest (v8 provider) → `coverage/lcov.info` |

> 前端覆蓋率分子分母已剔除無邏輯檔案（pages、i18n dictionaries、styles、leaf wrappers、entry point），
> 故 50% 對應的是「真正承載商業邏輯的程式碼」。其中：
>   - `src/auth/` 95.83%
>   - `src/hooks/` 74.76%（`useProductionCalendar` 98.68%）
>   - 三個主要 modal / cell 元件 (`ScheduleDelayAlert`, `CancelOrderDialog`, `InlineEditCell`) 100%
>
> 兩份覆蓋率報告會於 SonarQube 統一展示；細節見 §4.5。

---

## 二、測試策略

### 2.1 測試金字塔

```
                            ┌──────────────────┐
                            │  E2E (人工/未來)  │  ← UI 走查
                            └──────────────────┘
                       ┌─────────────────────────────┐
                       │  Integration (35 個)        │  ← 跨層、跨程序契約
                       └─────────────────────────────┘
                ┌────────────────────────────────────────────┐
                │  Unit (233 個)                              │  ← 純函式、Mockito、RTL
                └────────────────────────────────────────────┘
```

- **Unit (~87%)**：純函式、Mock 依賴；快速、精確、易定位失敗點。
- **Integration (~13%)**：真實 DB (H2 in-memory)、真實 Spring 容器、真實 HTTP 請求 (MockMvc)；
  專門驗證「只有把多個元件接起來才會出現」的問題。
- **E2E (0%)**：尚未導入；列為未來規劃 (見 §6)。

### 2.2 測試方式（依層級）

#### 2.2.1 Backend Unit Tests
- **框架**：JUnit 5 + Mockito 5。
- **隔離方式**：所有外部依賴 (`OrderRepository`, `SchedulingQueueService` 等) 以 `@Mock` 注入。
- **斷言重點**：商業邏輯數學正確性、狀態轉移、邊界條件、Mock 互動次數。
- **代表檔案**：
  - [`SchedulerServiceTest`](backend/src/test/java/com/semiconductor/woms/backend/SchedulerServiceTest.java) — 43 案，覆蓋 §1、§5、§6、§7、§8。
  - [`OrderServiceTest`](backend/src/test/java/com/semiconductor/woms/backend/service/OrderServiceTest.java) — 43 案，覆蓋 §1、§2、§3、§4.2、§9。
  - [`QueuePollerTest`](backend/src/test/java/com/semiconductor/woms/backend/service/QueuePollerTest.java) — 10 案，覆蓋 §4.1 的佇列序列化。

#### 2.2.2 Backend Integration Tests
- **框架**：Spring Boot `@SpringBootTest` + H2 (MODE=MySQL) + MockMvc。
- **隔離方式**：每個測試方法使用獨立的 `factoryId`（UUID），避免被 demo seed data 干擾。
- **代表檔案**：
  - [`OrderControllerIntegrationTest`](backend/src/test/java/com/semiconductor/woms/backend/controller/OrderControllerIntegrationTest.java) — 18 案，HTTP 完整流程 + 樂觀鎖 409。
  - [`SchedulingIntegrationTest`](backend/src/test/java/com/semiconductor/woms/backend/service/SchedulingIntegrationTest.java) — 10 案，包含並發、跨天、SLA。
  - [`OrderRepositoryJpaTest`](backend/src/test/java/com/semiconductor/woms/backend/repository/OrderRepositoryJpaTest.java) — 7 案，JPA 層（`@Version` 樂觀鎖）。

#### 2.2.3 Frontend Unit Tests
- **框架**：Vitest 4 + jsdom + React Testing Library 16。
- **Mock 方式**：`vi.mock('../api/orderApi')` 把所有 HTTP 呼叫變成可控；i18n 字典以最小 stub 注入；
  style modules 以 Proxy 攔截（class name 不影響行為，但讓 import 不會炸）。
- **代表檔案（依層分組）**：
  - **API 層**
    - [`orderApi.test.js`](frontend/src/api/orderApi.test.js) — 12 案，驗證 path/method/錯誤傳播。
  - **Auth 層**
    - [`jwt.test.js`](frontend/src/auth/jwt.test.js) — 9 案，token 解析 / 過期判斷。
    - [`tokenStorage.test.js`](frontend/src/auth/tokenStorage.test.js) — 9 案，localStorage / sessionStorage 切換。
    - [`AuthProvider.test.jsx`](frontend/src/auth/AuthProvider.test.jsx) — 6 案，login / logout / 還原使用者。
    - [`ProtectedRoute.test.jsx`](frontend/src/auth/ProtectedRoute.test.jsx) — 2 案，路由級權限把關。
  - **Hooks**
    - [`useCreateOrder.test.js`](frontend/src/hooks/useCreateOrder.test.js) — 8 案，新增訂單表單行為。
    - [`useEditOrder.test.js`](frontend/src/hooks/useEditOrder.test.js) — 5 案，409 衝突處理（樂觀鎖 UX）。
    - [`useOrders.test.js`](frontend/src/hooks/useOrders.test.js) — 9 案，列表 + 篩選 + 分頁。
    - [`useProductionCalendar.test.js`](frontend/src/hooks/useProductionCalendar.test.js) — 8 案，月曆網格 / load band / 月份切換。
  - **Components — orders**
    - [`OrderRow.test.jsx`](frontend/src/components/orders/OrderRow.test.jsx) — 10 案，列渲染 + 取消狀態 + 展開行為。
    - [`OrderFilters.test.jsx`](frontend/src/components/orders/OrderFilters.test.jsx) — 6 案，debounce 搜尋 + reset。
    - [`InlineEditCell.test.jsx`](frontend/src/components/orders/InlineEditCell.test.jsx) — 7 案，雙擊編輯 + Enter / Escape / blur。
    - [`CancelOrderDialog.test.jsx`](frontend/src/components/orders/CancelOrderDialog.test.jsx) — 8 案，§3.2 IN_PRODUCTION 取消警告。
  - **Components — createOrder**
    - [`ScheduleDelayAlert.test.jsx`](frontend/src/components/createOrder/ScheduleDelayAlert.test.jsx) — 8 案，§1.5 延遲確認 modal。
  - **Components — calendar**
    - [`CalendarDayCell.test.jsx`](frontend/src/components/calendar/CalendarDayCell.test.jsx) — 9 案，產能等級 / 點擊互動 / a11y。
    - [`CalendarStats.test.jsx`](frontend/src/components/calendar/CalendarStats.test.jsx) — 4 案，月總計卡片。

#### 2.2.4 Frontend Integration Tests
- **框架**：Vitest (node environment) + 真實 axios → 真實 backend。
- **執行條件**：需先啟動 backend (`mvn spring-boot:run`)，並有 `admin/password` 種子帳號。
- **代表檔案**：[`orderApi.integration.test.js`](frontend/src/api/orderApi.integration.test.js) — 6 案，驗證跨語言 (Java ↔ JS) 序列化契約。

---

## 三、規則覆蓋對應表

下表將 `SCHEDULING_RULES.md` 的每一條規則對應到具體測試案例，作為「測試證明這條規則被驗證」的依據。

| 規則 | 對應測試 | 通過 |
|---|---|---|
| **§1.1** 數量不合法 (<25 或 >2500) | `OrderServiceTest.createOrder_rejectsQuantityBelowMin`<br>`createOrder_rejectsQuantityAboveMax`<br>`OrderControllerIntegrationTest.createOrder_quantityBelowMin_returns400` | ✅ |
| **§1.2** 交期已過 / 等於今日 | `OrderServiceTest.createOrder_rejectsPastDueDate`<br>`createOrder_rejectsDueDateEqualToToday`<br>`OrderControllerIntegrationTest.createOrder_dueDateToday_returns400` | ✅ |
| **§1.3** 拆分跨天排程 | `SchedulerServiceTest.scheduleOrder_quantityExceedsDailyCapacity_splitsAcrossDays`<br>`SchedulingIntegrationTest.e2e_orderExceedingRemainingDailyCapacity_splitsAcrossDays` | ✅ |
| **§1.4** 觸發全局重排，重排後可完成 | `SchedulingIntegrationTest.rescheduleAll_pullsOrderForwardWhenEddImprovesPlacement`<br>`QueuePollerTest.poll_scheduleOrderResultIsDelayed_enqueuesRescheduleAllForOptimization` | ✅ |
| **§1.5** 重排後仍延遲，顯示確認 modal | `ScheduleDelayAlert.test.jsx` (8 案)<br>`useCreateOrder.test.js`「submit() returns delayed」 | ✅ |
| **§1.6** 90 天總產能不足 | `SchedulerServiceTest.scheduleOrder_capacityExhaustedWithin90Days_returnsUnschedulable`<br>`SchedulingIntegrationTest.totalCapacityExhausted_keepsOrderPendingWithEarliestDateWarning` | ✅ |
| **§1.7** 同交期 FIFO 排序 | `SchedulerServiceTest.rescheduleAll_sameDueDate_usesCreatedAtFifo` | ✅ |
| **§2.1** 修改訂單，重排後可完成 | `SchedulingIntegrationTest.updateOrder_releasesOldSlotsAndReallocates`<br>`OrderServiceTest.updateOrder_releasesExistingSlots` | ✅ |
| **§2.2** 修改訂單，重排後仍延遲 | `useEditOrder.test.js` 內 modal 流程<br>`ScheduleDelayAlert.test.jsx` | ✅ |
| **§3.1** 一般取消，釋放產能 | `OrderServiceTest.cancelOrder_releasesProductionSlots`<br>`SchedulingIntegrationTest.cancelOrder_releasedCapacityIsReclaimedByPendingOrders` | ✅ |
| **§3.2** 取消 IN_PRODUCTION 訂單 + UI 確認警告 | `OrderServiceTest.cancelOrder_recordsCancelledFromStatus`<br>`CancelOrderDialog.test.jsx` (8 案 — IN_PROD 警告變體) | ✅ |
| **§4.1** 並發新增，產能不超分配 | `SchedulingIntegrationTest.concurrentOrders_neverOverbookDailyCapacity` | ✅ |
| **§4.2** 樂觀鎖 (updatedAt 比對) | `OrderServiceTest.updateOrder_throwsConflict_whenUpdatedAtMismatch`<br>`OrderControllerIntegrationTest.updateOrder_staleUpdatedAt_returns409`<br>`useEditOrder.test.js`「handles 409」<br>`orderApi.integration.test.js`「round-trips updatedAt」<br>`OrderRepositoryJpaTest.optimisticLocking_preventsLostUpdate`<br>`SchedulingIntegrationTest.concurrentUpdatesToSameOrder_onlyOneWinsViaOptimisticLock` | ✅ |
| **§4.3** 使用者考慮時不阻塞後續排程 | `SchedulingIntegrationTest.delayedOrderAwaitingDecision_doesNotBlockSubsequentOrders` | ✅ |
| **§5** 全局重排：EDD + FIFO，IN_PROD 不動 | `SchedulerServiceTest.rescheduleAll_schedulesOrdersInEddAscendingOrder`<br>`rescheduleAll_doesNotIncludeInProductionOrders`<br>`rescheduleAll_releasesSlots_andResetsScheduledOrderToPending` | ✅ |
| **§6** 延誤判斷公式 (isDelayed, delayDays) | `SchedulerServiceTest.scheduleOrder_lastSlotExactlyOnDueDate_isNotDelayed`<br>`scheduleOrder_calculatesDelayDaysCorrectly` | ✅ |
| **§6** `delayReason` 列舉 (`CAPACITY_FULL` / `MANUAL_DATE_UNREACHABLE`) | `SchedulerServiceTest.scheduleOrder_specDrift_delayReasonFieldNotImplemented` (規格漂移標記) | ⚠️ 標記中 |
| **§7** 拆分規則 + lookahead 90 天上限 | `SchedulerServiceTest.scheduleOrder_spansFinalDayOfLookaheadWindow_isStillScheduled`<br>`scheduleOrder_needsOneDayPastLookaheadWindow_isUnschedulable`<br>`scheduleOrder_singleWaferFitsIntoOneRemainingSlot_atBoundary` | ✅ |
| **§8** 優先順序：EDD 優先、同 EDD 用 FIFO | `SchedulerServiceTest.rescheduleAll_schedulesOrdersInEddAscendingOrder`<br>`rescheduleAll_sameDueDate_usesCreatedAtFifo` | ✅ |
| **§9** 過期 / 數量無效訂單拒絕 | `OrderServiceTest.createOrder_rejects*` (4 案)<br>`OrderControllerIntegrationTest.createOrder_*_returns400` (3 案) | ✅ |

**覆蓋率：20 條規則中 19 條完全覆蓋 (95%)，1 條為已知的規格漂移並以失敗-提示測試標記。**

---

## 四、測試結果證明

### 4.1 Backend 全套測試輸出 (`mvn test`)

```
[INFO] Running com.semiconductor.woms.backend.repository.OrderRepositoryJpaTest
[INFO] Tests run: 7,  Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 2.997 s
[INFO] Running com.semiconductor.woms.backend.BackendApplicationTests
[INFO] Tests run: 1,  Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.942 s
[INFO] Running com.semiconductor.woms.backend.controller.OrderControllerWebMvcTest
[INFO] Tests run: 2,  Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.616 s
[INFO] Running com.semiconductor.woms.backend.controller.OrderControllerIntegrationTest
[INFO] Tests run: 18, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 2.240 s
[INFO] Running com.semiconductor.woms.backend.service.OrderServiceTest
[INFO] Tests run: 43, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.462 s
[INFO] Running com.semiconductor.woms.backend.service.SchedulingQueueServiceTest
[INFO] Tests run: 2,  Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.049 s
[INFO] Running com.semiconductor.woms.backend.service.SchedulingIntegrationTest
[INFO] Tests run: 10, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 11.22 s
[INFO] Running com.semiconductor.woms.backend.service.QueuePollerTest
[INFO] Tests run: 10, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.014 s
[INFO] Running com.semiconductor.woms.backend.service.OrderServiceDbIntegrationTest
[INFO] Tests run: 2,  Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.018 s
[INFO] Running com.semiconductor.woms.backend.SchedulerServiceTest
[INFO] Tests run: 43, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.139 s
[INFO] -------------------------------------------------------------------------
[INFO]  Results:
[INFO]    Tests run: 138, Failures: 0, Errors: 0, Skipped: 0
[INFO] -------------------------------------------------------------------------
[INFO] BUILD SUCCESS
```

### 4.2 Frontend Unit 測試輸出 (`npm test`)

```
 RUN  v4.1.7 /Users/matthew/Documents/dev/code/wafer-order-management/frontend

 Test Files  16 passed (16)
      Tests  124 passed (124)
   Start at  16:48:43
   Duration  3.93s
```

明細：

| 測試檔案 | 案例數 |
|---|---|
| `src/api/orderApi.test.js` | 12 |
| `src/auth/jwt.test.js` | 9 |
| `src/auth/tokenStorage.test.js` | 9 |
| `src/auth/AuthProvider.test.jsx` | 6 |
| `src/auth/ProtectedRoute.test.jsx` | 2 |
| `src/hooks/useCreateOrder.test.js` | 8 |
| `src/hooks/useEditOrder.test.js` | 5 |
| `src/hooks/useOrders.test.js` | 9 |
| `src/hooks/useProductionCalendar.test.js` | 8 |
| `src/components/orders/OrderRow.test.jsx` | 10 |
| `src/components/orders/OrderFilters.test.jsx` | 6 |
| `src/components/orders/InlineEditCell.test.jsx` | 7 |
| `src/components/orders/CancelOrderDialog.test.jsx` | 8 |
| `src/components/createOrder/ScheduleDelayAlert.test.jsx` | 8 |
| `src/components/calendar/CalendarDayCell.test.jsx` | 9 |
| `src/components/calendar/CalendarStats.test.jsx` | 4 |
| **合計** | **124** |

### 4.3 Frontend Integration 測試輸出 (`npm run test:integration`)

```
 ✓ creates an order and then lists it
 ✓ cancels an order
 ✓ round-trips updatedAt for optimistic locking (409 path)
 ✓ accepts customerDueDate as a plain YYYY-MM-DD string
 ✓ eventually transitions a new order to SCHEDULED with slots
 ✓ returns errors in the ApiResponse {status,message} envelope

 Test Files  1 passed (1)
      Tests  6 passed (6)
```

### 4.4 CI/CD 自動化執行（GitHub Actions）

所有測試套件都已接上 GitHub Actions，於每次 `push` 與 `pull_request` 自動觸發。
設定檔：[`.github/workflows/ci.yml`](.github/workflows/ci.yml)

| Job | 觸發時機 | 環境 | 內容 |
|---|---|---|---|
| `backend-tests` | 每次 push / PR | Ubuntu + JDK 21 + **H2 in-memory** | `mvn test`（138 案） |
| `backend-mysql-tests` | **PR → `develop` 或 `main`** | Ubuntu + JDK 21 + **MySQL 8.0 service container** | `mvn test` 對打真實 MySQL，防止 H2 / MySQL 方言漂移 |
| `frontend-tests` | 每次 push / PR | Ubuntu + Node 20 | `npm run test`（124 案） |
| `fe-be-integration` | 每次 push / PR | Ubuntu + JDK 21 + Node 20 | 啟動 backend (`mvn spring-boot:run`) → polling `/api-docs` → `npm run test:integration`（6 案） |
| `sonar` | 每次 push / PR（同 repo） | Ubuntu + JDK 21 + Node 20 | 跑 backend 測試 + JaCoCo → `mvn sonar:sonar`；前端 `npm run test:coverage` → `sonar-scanner`。SONAR_TOKEN secret 未設定時自動跳過。 |

**設計重點**：
- **H2 跑每次 PR**：~20 秒，快速反饋。
- **MySQL 跑合併前**：~5 分鐘（含 service container 啟動），只在進 `develop` / `main`
  前執行；用真實 MySQL 8.0 容器排除 H2 模擬差異（lock 行為、`ON UPDATE CURRENT_TIMESTAMP` 等）。
- **跨層整合**：`fe-be-integration` 啟動真正的 Spring Boot 程序，前端用真實 axios
  打 HTTP，驗證跨語言 (Java ↔ JS) 的序列化契約不會默默斷裂。
- **健康檢查**：MySQL service 使用 `mysqladmin ping` healthcheck；backend 啟動
  用 `curl /api-docs` 輪詢確認就緒，最多 300 秒。

### 4.5 程式碼品質：SonarQube + Coverage 整合

| 項目 | 來源 | 在 CI 對應 step |
|---|---|---|
| Backend coverage | JaCoCo `target/site/jacoco/jacoco.xml`（pom.xml `prepare-agent` + `report` 階段） | `sonar` job 第 1 步 |
| Backend Sonar 上傳 | `mvn verify sonar:sonar` | 同上 |
| Frontend coverage | Vitest v8 provider → `coverage/lcov.info` | `sonar` job 第 2 步 |
| Frontend Sonar 上傳 | `SonarSource/sonarqube-scan-action@v4`，讀 [`sonar-project.properties`](frontend/sonar-project.properties) | `sonar` job 第 3 步 |

**Sonar 排除設定**：兩邊都把無邏輯檔案（pages、dictionaries、styles、entry point、
leaf wrappers）剔除於分母外，讓覆蓋率反映「真正的商業邏輯」，不是「擁有多少行 CSS 常數」。

**本機快速驗證**（不需 CI / 帳號）：

```bash
docker run -d --name sonarqube -p 9000:9000 sonarqube:lts-community
# 待 SonarQube 啟動後，UI 產生 token
export SONAR_HOST_URL=http://localhost:9000  SONAR_TOKEN=<token>

cd backend
mvn verify sonar:sonar -Dsonar.host.url=$SONAR_HOST_URL -Dsonar.token=$SONAR_TOKEN

cd ../frontend
npm run test:coverage
npm run sonar -- -Dsonar.host.url=$SONAR_HOST_URL -Dsonar.token=$SONAR_TOKEN
```

完整步驟與 K8s 部署規劃詳見 [`k8s/sonarqube/README.md`](k8s/sonarqube/README.md)。

---

## 五、測試中發現並修復的重要 Bug

### 5.1 SchedulerServiceImpl `Index -1 out of bounds` Race Condition

**發現過程**：
[`SchedulingIntegrationTest.concurrentOrders_neverOverbookDailyCapacity`](backend/src/test/java/com/semiconductor/woms/backend/service/SchedulingIntegrationTest.java)
測試在第一次執行時通過了，但 log 顯示有 6 次 `Index -1 out of bounds for length 0` 失敗。
深入追查後確認測試「碰巧」通過是因為後續測試觸發了 `RESCHEDULE_ALL`，並非排程本身真的成功。

**根因**：
[`SchedulerServiceImpl.scheduleOrder()`](backend/src/main/java/com/semiconductor/woms/backend/service/SchedulerServiceImpl.java)
缺少 idempotency guard。
當一筆 `SCHEDULE_ORDER` 任務排入佇列後、未開始執行前，若另一筆訂單的
`RESCHEDULE_ALL` 先跑掉，會把該訂單一併排好 (`remainingQuantity = 0`)。
之後輪到原任務執行時，由於 `remaining == 0`，`while` 迴圈不會進入、`slots`
為空 list，最後 `slots.get(slots.size() - 1)` (即 `slots.get(-1)`) 拋出 IOOB。

**修復**：
在 `scheduleOrder()` 入口加入狀態檢查，若訂單已非 `PENDING` 則回傳現有 slot 為
no-op，並保留正確的 `isDelayed` 旗標供 `QueuePoller` 判斷是否需要再次補排。

```java
if (order.getStatus() != OrderStatus.PENDING) {
    List<ProductionSlot> existing = slotRepo.findByOrderId(orderId);
    return ScheduleResult.success(orderId, existing,
            Boolean.TRUE.equals(order.getIsDelayed()));
}
```

**回歸測試**：
新增 3 個單元測試確保 idempotency 不會再被破壞：
- `scheduleOrder_alreadyScheduledOrder_isIdempotentNoOp`
- `scheduleOrder_alreadyScheduledOrderIsDelayed_propagatesDelayFlag`
- `scheduleOrder_cancelledOrder_isNoOp`

**為何重要**：這不是測試特有 bug；任何 queue 累積到 > 1 筆任務的正式環境
都有可能踩到。整合測試讓這條長期潛伏的 race 浮上檯面。

---

## 六、未來測試規劃

下列項目已列為 backlog，本次未實作但已評估可行性：

| 項目 | 動機 | 工具 |
|---|---|---|
| **Playwright E2E** | 補上 UI 完整走查（建立 → 列表 → 編輯 → 取消） | Playwright + GitHub Actions |
| **OpenAPI 契約測試** | 防止前後端 API 默默斷裂 | springdoc + openapi-diff |
| **Property-based Test** | 隨機餵入訂單流，驗「任何一日 ≤ 10,000」 | jqwik |
| **Mutation Testing** | 驗證排程測試的「殺傷力」 | PIT Maven plugin |
| **`delayReason` 欄位** | 規格漂移：需決定實作或刪規 | — |

> 註：原本列為 backlog 的 **MySQL CI Profile** 已實作完成，
> 詳見 §4.4 中 `backend-mysql-tests` job。

---

## 七、結論

1. **覆蓋面**：`SCHEDULING_RULES.md` 共 20 條規則中 **19 條完全覆蓋**，
   1 條 (`delayReason`) 以失敗-提示測試標記為規格漂移。
2. **質量訊號**：268 個自動化測試案例、全數通過、修復 1 個正式環境 race condition。
3. **覆蓋率**：前端「商業邏輯範圍」line coverage **50.26%**，其中 auth 層 95.83%、
   主要 modal / hook 100% 或近滿；後端透過 JaCoCo 提供完整 XML 報告供 Sonar 讀取。
4. **執行成本**：完整 backend 套件 < 20 秒、frontend 單元 < 4 秒，
   適合 pre-commit hook 與 CI gate。
5. **CI 把關**：5 個 GitHub Actions job 自動跑單元、整合、跨層測試與 Sonar 掃描；
   合併到 `develop` / `main` 前另跑 MySQL 8.0 真實 DB 測試，
   PR 沒過測試不能進。
6. **可維護性**：每個測試明確對應一條規則或一個邊界，新加入的成員
   可從測試名快速理解系統不變量。

> 本份報告所引用之測試結果均可透過 `mvn test` 與 `npm test` 在本機重現，
> 也可在 GitHub Actions 的 PR 頁面查看每次 commit 的執行紀錄。
> Coverage / 程式碼品質指標於 SonarQube 儀表板呈現
> （本機快速啟動見 §4.5、CI 上跑見 `sonar` job）。
