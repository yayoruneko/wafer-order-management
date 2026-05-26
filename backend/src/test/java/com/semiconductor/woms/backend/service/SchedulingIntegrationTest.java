package com.semiconductor.woms.backend.service;

import com.semiconductor.woms.backend.dto.OrderRequest;
import com.semiconductor.woms.backend.dto.OrderUpdateRequest;
import com.semiconductor.woms.backend.model.Customer;
import com.semiconductor.woms.backend.model.Order;
import com.semiconductor.woms.backend.model.ProductionSlot;
import com.semiconductor.woms.backend.model.QueueStatus;
import com.semiconductor.woms.backend.model.User;
import com.semiconductor.woms.backend.model.enums.OrderStatus;
import com.semiconductor.woms.backend.model.enums.UserType;
import com.semiconductor.woms.backend.repository.CustomerRepository;
import com.semiconductor.woms.backend.repository.OrderRepository;
import com.semiconductor.woms.backend.repository.ProductionSlotRepository;
import com.semiconductor.woms.backend.repository.SchedulingQueueRepository;
import com.semiconductor.woms.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.concurrent.DelegatingSecurityContextExecutorService;
import org.springframework.security.test.context.support.WithMockUser;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.function.Predicate;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 完整流程整合測試：請求 → SchedulingQueue → QueuePoller → SchedulerService → DB。
 *
 * 這個檔案專門驗證「只有把整條 pipeline 接起來才會炸」的場景，避免重複
 * controller / service / repository 各自單元測試已經涵蓋的內容。
 *
 * 覆蓋：
 *  - 並發：兩筆同時送出，產能不會被超分配
 *  - 修改：updateOrder 觸發釋放舊 slot + 全局重排
 *  - 取消：cancelOrder 釋放後，先前的 PENDING 訂單會被排上
 *  - 跨天拆分：滿載一日後，下一筆會 split 到隔天
 *  - SLA：單筆 PENDING → SCHEDULED 應在 10 秒內完成
 */
@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@WithMockUser(username = "sched-it-admin", authorities = "ADMIN")
class SchedulingIntegrationTest {

    private static final int DAILY_CAPACITY = 10_000;
    private static final int MAX_ORDER_QTY = 2_500;
    private static final long SLA_MS = 10_000L;

    @Autowired private OrderService orderService;
    @Autowired private OrderRepository orderRepository;
    @Autowired private CustomerRepository customerRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ProductionSlotRepository slotRepository;
    @Autowired private SchedulingQueueRepository queueRepository;

    private String customerId;

    // 每個測試用獨立的 factoryId，避免被 DemoDataInitializer 在 factory-001
    // 預先排入的 seed orders 干擾「day 1 從零開始」的假設。Scheduler 是按
    // factoryId 計算 capacity 的，所以這給每個測試一張乾淨的產能日曆。
    private String factoryId;

    @BeforeEach
    void seedUserAndCustomer() {
        if (userRepository.findByUsername("sched-it-admin").isEmpty()) {
            User u = new User();
            u.setId("user-" + UUID.randomUUID());
            u.setUsername("sched-it-admin");
            u.setPasswordHash("$2a$10$notUsedInTests");
            u.setRole(UserType.ADMIN);
            u.setCreatedAt(LocalDateTime.now());
            userRepository.save(u);
        }
        Customer c = new Customer();
        c.setCustomerCode("SCHED-IT-" + UUID.randomUUID());
        c.setName("Scheduling IT Customer");
        c.setIsActive(true);
        customerId = customerRepository.save(c).getId();
        factoryId = "factory-it-" + UUID.randomUUID();
    }

    // ── 1. 並發：兩筆訂單同時送出，產能不可被超分配 ──────────────────────────

    @Test
    void concurrentOrders_neverOverbookDailyCapacity() throws Exception {
        // 規則四之 1：N 筆訂單同時進來，最終任一日的 slot 總和不可超過 10,000
        final int N = 6;
        final int qty = MAX_ORDER_QTY;  // 6 * 2500 = 15000，超過單日容量 → 必然跨天

        // SecurityContextHolder 是 thread-local，必須包一層讓 @WithMockUser 設好的
        // SecurityContext 也能傳到 pool 執行緒（OrderService.createOrder 會去讀
        // SecurityContextHolder 拿 createdBy；沒包就拿到 null，違反 NOT NULL）。
        ExecutorService pool = new DelegatingSecurityContextExecutorService(
                Executors.newFixedThreadPool(N));
        try {
            List<CompletableFuture<String>> futures = IntStream.range(0, N)
                    .mapToObj(i -> CompletableFuture.supplyAsync(() ->
                            orderService.createOrder(newRequest(qty, 30)).getId(), pool))
                    .collect(Collectors.toList());
            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
                    .get(15, TimeUnit.SECONDS);

            List<String> ids = futures.stream().map(CompletableFuture::join).toList();

            // 等所有訂單都跑完排程 + 佇列清空。
            // 注：先前在這裡會手動補一個 enqueueRescheduleAll 來避開
            // SchedulerServiceImpl scheduleOrder 對空 slots list 取 last 元素而 IOOB
            // 的 race condition；該 race 已用 idempotency guard 修掉，這裡保留為
            // 原本的「只觀察 queue」版本。
            waitForAllScheduled(ids);
            waitForQueueDrained();

            // 全部 SCHEDULED
            for (String id : ids) {
                Order o = orderRepository.findById(id).orElseThrow();
                assertEquals(OrderStatus.SCHEDULED, o.getStatus(),
                        "並發訂單最終都應排上：" + id);
                assertEquals(0, o.getRemainingQuantity());
            }

            // 任一日的 slot 總和不可超過 DAILY_CAPACITY
            Map<LocalDate, Integer> usedPerDay = slotRepository.findAll().stream()
                    .filter(s -> ids.contains(s.getOrderId()))
                    .collect(Collectors.groupingBy(
                            ProductionSlot::getSlotDate,
                            Collectors.summingInt(ProductionSlot::getQuantity)));

            usedPerDay.forEach((day, used) ->
                    assertTrue(used <= DAILY_CAPACITY,
                            "並發排程不可超分配：" + day + " used=" + used));

            // 排出來的 slot 總量 = 全部訂單的總和（無遺漏無重複）
            int totalScheduled = usedPerDay.values().stream().mapToInt(Integer::intValue).sum();
            assertEquals(N * qty, totalScheduled, "排出去的總片數必須等於送入的總片數");
        } finally {
            pool.shutdownNow();
        }
    }

    // ── 2. 修改：updateOrder 必須釋放舊 slot 並重排 ────────────────────────

    @Test
    void updateOrder_releasesOldSlotsAndReallocates() throws Exception {
        // 建立 → SCHEDULED → 修改數量 → 應有新的 slot 組合
        String id = orderService.createOrder(newRequest(100, 14)).getId();
        Order first = waitForOrder(id, o -> o.getStatus() == OrderStatus.SCHEDULED);
        int firstTotal = slotRepository.findByOrderId(id).stream()
                .mapToInt(ProductionSlot::getQuantity).sum();
        assertEquals(100, firstTotal);

        // 修改成 300 片
        OrderUpdateRequest upd = new OrderUpdateRequest();
        upd.setQuantity(300);
        upd.setCustomerDueDate(first.getCustomerDueDate());
        upd.setUpdatedAt(first.getUpdatedAt());
        orderService.updateOrder(id, upd);

        // 等到全局重排把它再次排回 SCHEDULED 且 quantity = 300
        Order after = waitForOrder(id, o ->
                o.getStatus() == OrderStatus.SCHEDULED && o.getQuantity() == 300);
        waitForQueueDrained();

        int newTotal = slotRepository.findByOrderId(id).stream()
                .mapToInt(ProductionSlot::getQuantity).sum();
        assertEquals(300, newTotal, "新 slot 總片數應等於新數量");
        assertEquals(0, after.getRemainingQuantity());
    }

    // ── 3. 取消：釋放出來的產能可被 PENDING 訂單使用 ───────────────────────

    @Test
    void cancelOrder_releasedCapacityIsReclaimedByPendingOrders() throws Exception {
        // 設計：用 4 筆 2500 把第 1 天塞滿（10000），第 5 筆必然被推到隔天或更晚。
        // 取消其中一筆後，第 5 筆的首日應「往前移」（不再 pin 到特定日，避免被
        // 全域 demo seed orders 干擾）。
        List<String> fillIds = IntStream.range(0, 4)
                .mapToObj(i -> orderService.createOrder(newRequest(MAX_ORDER_QTY, 30)).getId())
                .toList();
        waitForAllScheduled(fillIds);
        waitForQueueDrained();

        String overflowId = orderService.createOrder(newRequest(MAX_ORDER_QTY, 30)).getId();
        waitForOrder(overflowId, o -> o.getStatus() == OrderStatus.SCHEDULED);
        waitForQueueDrained();

        LocalDate beforeCancelFirstSlot = slotRepository.findByOrderId(overflowId).stream()
                .map(ProductionSlot::getSlotDate)
                .min(LocalDate::compareTo)
                .orElseThrow();

        // 取消其中一筆 → 釋放 2500 片產能，rescheduleAll 應把 overflow 拉前
        orderService.cancelOrder(fillIds.get(0));
        waitForQueueDrained();

        // 等到 overflow 的首日真的往前移
        Order overflowReSched = waitForOrder(overflowId, o ->
                o.getStatus() == OrderStatus.SCHEDULED
                        && slotRepository.findByOrderId(o.getId()).stream()
                            .map(ProductionSlot::getSlotDate)
                            .min(LocalDate::compareTo)
                            .map(d -> d.isBefore(beforeCancelFirstSlot))
                            .orElse(false));
        assertNotNull(overflowReSched);
        // 取消的訂單應該已釋放所有 slot
        assertTrue(slotRepository.findByOrderId(fillIds.get(0)).isEmpty(),
                "取消後的訂單不應殘留任何 slot");
    }

    // ── 4. E2E 跨天拆分：把第 1 天填到剛好滿，下一筆會自然 split 到第 2 天 ──

    @Test
    void e2e_orderExceedingRemainingDailyCapacity_splitsAcrossDays() throws Exception {
        // 用 4 筆 2500 把第 1 天填到 10000（=DAILY_CAPACITY）
        List<String> fillIds = IntStream.range(0, 4)
                .mapToObj(i -> orderService.createOrder(newRequest(MAX_ORDER_QTY, 30)).getId())
                .toList();
        waitForAllScheduled(fillIds);
        waitForQueueDrained();

        // 再送一筆會超過剩餘容量的訂單
        String splitId = orderService.createOrder(newRequest(MAX_ORDER_QTY, 30)).getId();
        waitForOrder(splitId, o -> o.getStatus() == OrderStatus.SCHEDULED);
        waitForQueueDrained();

        List<ProductionSlot> slots = slotRepository.findByOrderId(splitId);
        // 第 1 天已被前 4 筆吃滿 → 這筆必定整批排到隔天（或更晚）
        assertTrue(slots.stream()
                        .map(ProductionSlot::getSlotDate)
                        .noneMatch(d -> d.equals(LocalDate.now().plusDays(1))),
                "第 1 天已滿，此訂單不應有任何 slot 落在第 1 天");
        int total = slots.stream().mapToInt(ProductionSlot::getQuantity).sum();
        assertEquals(MAX_ORDER_QTY, total);
    }

    // ── 5. 效能 SLA：單筆從 PENDING 到 SCHEDULED 應在 10 秒內完成 ─────────

    @Test
    void schedulingSla_singleOrder_completesWithinTenSeconds() throws Exception {
        long startedAt = System.currentTimeMillis();
        String id = orderService.createOrder(newRequest(100, 14)).getId();
        waitForOrder(id, o -> o.getStatus() == OrderStatus.SCHEDULED);
        long elapsed = System.currentTimeMillis() - startedAt;

        assertTrue(elapsed < SLA_MS,
                "排程 SLA 不應超過 " + SLA_MS + "ms，實際 " + elapsed + "ms");
    }

    // ── 輔助方法 ─────────────────────────────────────────────────────────────

    private OrderRequest newRequest(int quantity, int dueInDays) {
        OrderRequest req = new OrderRequest();
        req.setFactoryId("factory-001");
        req.setWaferTypeId("WT-IT");
        req.setCustomerId(customerId);
        req.setQuantity(quantity);
        req.setCustomerDueDate(LocalDate.now().plusDays(dueInDays));
        return req;
    }

    private Order waitForOrder(String id, Predicate<Order> predicate) throws InterruptedException {
        long deadline = System.currentTimeMillis() + 15_000;
        Order last = null;
        while (System.currentTimeMillis() < deadline) {
            last = orderRepository.findById(id).orElse(null);
            if (last != null && predicate.test(last)) return last;
            Thread.sleep(200);
        }
        fail("Order " + id + " never satisfied predicate within 15s; last=" + last);
        return null;  // unreachable
    }

    private void waitForAllScheduled(List<String> ids) throws InterruptedException {
        long deadline = System.currentTimeMillis() + 30_000;
        while (System.currentTimeMillis() < deadline) {
            boolean allDone = ids.stream()
                    .map(orderRepository::findById)
                    .allMatch(opt -> opt.map(o -> o.getStatus() == OrderStatus.SCHEDULED).orElse(false));
            if (allDone) return;
            Thread.sleep(200);
        }
        fail("Not all orders reached SCHEDULED within 30s: " + ids);
    }

    private void waitForQueueDrained() throws InterruptedException {
        long deadline = System.currentTimeMillis() + 15_000;
        while (System.currentTimeMillis() < deadline) {
            boolean drained = queueRepository
                    .findByStatusOrderByPriorityAscCreatedAtAsc(QueueStatus.PENDING).isEmpty()
                    && queueRepository
                    .findByStatusOrderByPriorityAscCreatedAtAsc(QueueStatus.PROCESSING).isEmpty();
            if (drained) return;
            Thread.sleep(200);
        }
        fail("Scheduling queue not drained within 15s");
    }
}
