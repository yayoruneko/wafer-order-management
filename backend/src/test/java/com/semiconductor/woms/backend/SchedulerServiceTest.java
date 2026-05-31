package com.semiconductor.woms.backend;

import com.semiconductor.woms.backend.model.DailyCapacityUsage;
import com.semiconductor.woms.backend.model.Order;
import com.semiconductor.woms.backend.model.ProductionSlot;
import com.semiconductor.woms.backend.model.enums.OrderStatus;
import com.semiconductor.woms.backend.repository.DailyCapacityUsageRepository;
import com.semiconductor.woms.backend.repository.OrderRepository;
import com.semiconductor.woms.backend.repository.ProductionSlotRepository;
import com.semiconductor.woms.backend.service.ScheduleResult;
import com.semiconductor.woms.backend.service.SchedulerServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SchedulerServiceTest {

    @Mock
    private DailyCapacityUsageRepository capacityRepo;

    @Mock
    private ProductionSlotRepository slotRepo;

    @Mock
    private OrderRepository orderRepo;

    @InjectMocks
    private SchedulerServiceImpl schedulerService;

    private Order mockOrder;

    @BeforeEach
    void setUp() {
        mockOrder = new Order();
        mockOrder.setId("order-001");
        mockOrder.setFactoryId("factory-001");
        mockOrder.setCustomerDueDate(LocalDate.now().plusDays(10));
        mockOrder.setStatus(OrderStatus.PENDING);
    }

    // ── scheduleOrder (Week 1，保留原本測試) ───────────────────────────────────

    @Test
    void scheduleOrder_quantityFitsInToday_producesSingleSlotAndZerosRemaining() {
        mockOrder.setQuantity(500);
        mockOrder.setRemainingQuantity(500);

        when(orderRepo.findById("order-001")).thenReturn(Optional.of(mockOrder));
        when(capacityRepo.findByFactoryIdAndSlotDate(any(), any())).thenReturn(Optional.empty());
        when(slotRepo.saveAll(any())).thenAnswer(i -> i.getArgument(0));

        ScheduleResult result = schedulerService.scheduleOrder("order-001");

        assertTrue(result.isSuccess());
        assertEquals(1, result.getSlots().size());
        assertEquals(0, mockOrder.getRemainingQuantity());
    }

    @Test
    void scheduleOrder_quantityExceedsDailyCapacity_splitsAcrossDays() {
        mockOrder.setQuantity(800);
        mockOrder.setRemainingQuantity(800);

        DailyCapacityUsage tomorrowUsage = new DailyCapacityUsage();
        tomorrowUsage.setFactoryId("factory-001");
        tomorrowUsage.setSlotDate(LocalDate.now().plusDays(1));
        tomorrowUsage.setUsedQuantity(9500);

        when(orderRepo.findById("order-001")).thenReturn(Optional.of(mockOrder));
        when(capacityRepo.findByFactoryIdAndSlotDate(any(), eq(LocalDate.now().plusDays(1))))
                .thenReturn(Optional.of(tomorrowUsage));
        when(capacityRepo.findByFactoryIdAndSlotDate(any(), eq(LocalDate.now().plusDays(2))))
                .thenReturn(Optional.empty());
        when(slotRepo.saveAll(any())).thenAnswer(i -> i.getArgument(0));

        ScheduleResult result = schedulerService.scheduleOrder("order-001");

        assertTrue(result.isSuccess());
        assertEquals(2, result.getSlots().size());
        assertEquals(0, mockOrder.getRemainingQuantity());
    }

    @Test
    void scheduleOrder_lastSlotOnDueDate_isNotDelayedAndWarningIsNull() {
        mockOrder.setQuantity(500);
        mockOrder.setRemainingQuantity(500);
        mockOrder.setCustomerDueDate(LocalDate.now().plusDays(1));

        when(orderRepo.findById("order-001")).thenReturn(Optional.of(mockOrder));
        when(capacityRepo.findByFactoryIdAndSlotDate(any(), any())).thenReturn(Optional.empty());
        when(slotRepo.saveAll(any())).thenAnswer(i -> i.getArgument(0));

        ScheduleResult result = schedulerService.scheduleOrder("order-001");

        assertTrue(result.isSuccess());
        assertFalse(result.isDelayed());
        assertNull(mockOrder.getScheduleWarning());
    }

    @Test
    void scheduleOrder_lastSlotAfterDueDate_isDelayedAndWarningNotNull() {
        mockOrder.setQuantity(500);
        mockOrder.setRemainingQuantity(500);
        mockOrder.setCustomerDueDate(LocalDate.now().minusDays(1));

        when(orderRepo.findById("order-001")).thenReturn(Optional.of(mockOrder));
        when(capacityRepo.findByFactoryIdAndSlotDate(any(), any())).thenReturn(Optional.empty());
        when(slotRepo.saveAll(any())).thenAnswer(i -> i.getArgument(0));

        ScheduleResult result = schedulerService.scheduleOrder("order-001");

        assertTrue(result.isSuccess());
        assertTrue(result.isDelayed());
        assertNotNull(mockOrder.getScheduleWarning());
    }

    @Test
    void scheduleOrder_capacityExhaustedWithin90Days_returnsUnschedulable() {
        mockOrder.setQuantity(500);
        mockOrder.setRemainingQuantity(500);

        DailyCapacityUsage fullUsage = new DailyCapacityUsage();
        fullUsage.setUsedQuantity(10000);

        when(orderRepo.findById("order-001")).thenReturn(Optional.of(mockOrder));
        when(capacityRepo.findByFactoryIdAndSlotDate(any(), any()))
                .thenReturn(Optional.of(fullUsage));

        ScheduleResult result = schedulerService.scheduleOrder("order-001");

        assertFalse(result.isSuccess());
        assertTrue(result.isUnschedulable());
        assertNotNull(mockOrder.getScheduleWarning());
    }

    @Test
    void scheduleOrder_throwsWhenOrderNotFound() {
        when(orderRepo.findById("no-such-id")).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> schedulerService.scheduleOrder("no-such-id"));
    }

    @Test
    void scheduleOrder_setsStatusToScheduledOnSuccess() {
        mockOrder.setQuantity(500);
        mockOrder.setRemainingQuantity(500);

        when(orderRepo.findById("order-001")).thenReturn(Optional.of(mockOrder));
        when(capacityRepo.findByFactoryIdAndSlotDate(any(), any())).thenReturn(Optional.empty());
        when(slotRepo.saveAll(any())).thenAnswer(i -> i.getArgument(0));

        schedulerService.scheduleOrder("order-001");

        assertEquals(OrderStatus.SCHEDULED, mockOrder.getStatus());
    }

    @Test
    void scheduleOrder_setsExpectedDueDateEqualToLastSlotDate() {
        mockOrder.setQuantity(100);
        mockOrder.setRemainingQuantity(100);

        when(orderRepo.findById("order-001")).thenReturn(Optional.of(mockOrder));
        when(capacityRepo.findByFactoryIdAndSlotDate(any(), any())).thenReturn(Optional.empty());
        when(slotRepo.saveAll(any())).thenAnswer(i -> i.getArgument(0));

        schedulerService.scheduleOrder("order-001");

        assertNotNull(mockOrder.getLastSlotDate());
        assertNotNull(mockOrder.getExpectedDueDate());
        assertEquals(mockOrder.getLastSlotDate(), mockOrder.getExpectedDueDate());
    }

    @Test
    void scheduleOrder_calculatesDelayDaysCorrectly() {
        mockOrder.setQuantity(500);
        mockOrder.setRemainingQuantity(500);
        mockOrder.setCustomerDueDate(LocalDate.now().minusDays(2));

        when(orderRepo.findById("order-001")).thenReturn(Optional.of(mockOrder));
        when(capacityRepo.findByFactoryIdAndSlotDate(any(), any())).thenReturn(Optional.empty());
        when(slotRepo.saveAll(any())).thenAnswer(i -> i.getArgument(0));

        ScheduleResult result = schedulerService.scheduleOrder("order-001");

        assertTrue(result.isDelayed());
        assertTrue(mockOrder.getDelayDays() >= 2,
                "Expected delayDays >= 2, got: " + mockOrder.getDelayDays());
    }

    @Test
    void scheduleOrder_exactFitIntoAvailableCapacity_producesSingleSlot() {
        mockOrder.setQuantity(500);
        mockOrder.setRemainingQuantity(500);

        DailyCapacityUsage partialUsage = new DailyCapacityUsage();
        partialUsage.setFactoryId("factory-001");
        partialUsage.setSlotDate(LocalDate.now().plusDays(1));
        partialUsage.setUsedQuantity(9500);

        when(orderRepo.findById("order-001")).thenReturn(Optional.of(mockOrder));
        when(capacityRepo.findByFactoryIdAndSlotDate(any(), any()))
                .thenReturn(Optional.of(partialUsage));
        when(slotRepo.saveAll(any())).thenAnswer(i -> i.getArgument(0));

        ScheduleResult result = schedulerService.scheduleOrder("order-001");

        assertTrue(result.isSuccess());
        assertEquals(1, result.getSlots().size());
        assertEquals(0, mockOrder.getRemainingQuantity());
        assertEquals(LocalDate.now().plusDays(1), mockOrder.getLastSlotDate());
    }

    @Test
    void getAvailableCapacity_returnsFullCapacityWhenNoUsageRecord() {
        when(capacityRepo.findByFactoryIdAndSlotDate("factory-001", LocalDate.now()))
                .thenReturn(Optional.empty());

        int available = schedulerService.getAvailableCapacity("factory-001", LocalDate.now());

        assertEquals(10000, available);
    }

    @Test
    void getAvailableCapacity_returnsZeroWhenFullyBooked() {
        DailyCapacityUsage fullUsage = new DailyCapacityUsage();
        fullUsage.setUsedQuantity(10000);

        when(capacityRepo.findByFactoryIdAndSlotDate("factory-001", LocalDate.now()))
                .thenReturn(Optional.of(fullUsage));

        int available = schedulerService.getAvailableCapacity("factory-001", LocalDate.now());

        assertEquals(0, available);
    }

    // ── releaseCapacity (Week 2) ──────────────────────────────────────────────

    @Test
    void releaseCapacity_decrementsExistingUsage_whenQuantityPartial() {
        DailyCapacityUsage usage = new DailyCapacityUsage();
        usage.setUsedQuantity(800);

        when(capacityRepo.findByFactoryIdAndSlotDate("factory-001", LocalDate.now()))
                .thenReturn(Optional.of(usage));

        schedulerService.releaseCapacity("factory-001", LocalDate.now(), 300);

        ArgumentCaptor<DailyCapacityUsage> captor = ArgumentCaptor.forClass(DailyCapacityUsage.class);
        verify(capacityRepo).save(captor.capture());
        assertEquals(500, captor.getValue().getUsedQuantity());
        verify(capacityRepo, never()).delete(any());
    }

    @Test
    void releaseCapacity_deletesRecord_whenUsageDropsToZero() {
        DailyCapacityUsage usage = new DailyCapacityUsage();
        usage.setUsedQuantity(300);

        when(capacityRepo.findByFactoryIdAndSlotDate("factory-001", LocalDate.now()))
                .thenReturn(Optional.of(usage));

        schedulerService.releaseCapacity("factory-001", LocalDate.now(), 300);

        verify(capacityRepo).delete(usage);
        verify(capacityRepo, never()).save(any());
    }

    @Test
    void releaseCapacity_deletesRecord_whenReleaseExceedsUsage() {
        // 防止 usedQuantity 被設為負數
        DailyCapacityUsage usage = new DailyCapacityUsage();
        usage.setUsedQuantity(100);

        when(capacityRepo.findByFactoryIdAndSlotDate("factory-001", LocalDate.now()))
                .thenReturn(Optional.of(usage));

        schedulerService.releaseCapacity("factory-001", LocalDate.now(), 500);

        verify(capacityRepo).delete(usage);
        verify(capacityRepo, never()).save(any());
    }

    @Test
    void releaseCapacity_doesNothing_whenNoUsageRecord() {
        when(capacityRepo.findByFactoryIdAndSlotDate("factory-001", LocalDate.now()))
                .thenReturn(Optional.empty());

        schedulerService.releaseCapacity("factory-001", LocalDate.now(), 500);

        verify(capacityRepo, never()).save(any());
        verify(capacityRepo, never()).delete(any());
    }

    // ── rescheduleAll (Week 2) ────────────────────────────────────────────────

    @Test
    void rescheduleAll_doesNothing_whenNoOrdersExist() {
        when(orderRepo.findByStatusIn(anyList())).thenReturn(List.of());

        schedulerService.rescheduleAll();

        verify(slotRepo, never()).findByOrderId(any());
        verify(slotRepo, never()).deleteByOrderId(any());
        verify(orderRepo, never()).save(any());
    }

    @Test
    void rescheduleAll_releasesSlots_andResetsScheduledOrderToPending() {
        // 用 spy 阻擋 scheduleOrder()，專注驗證「釋放階段」
        SchedulerServiceImpl spy = Mockito.spy(
                new SchedulerServiceImpl(capacityRepo, slotRepo, orderRepo));
        doAnswer(inv -> null).when(spy).scheduleOrder(anyString());

        Order scheduledOrder = buildOrder("ord-s", OrderStatus.SCHEDULED, 500);

        ProductionSlot slot = new ProductionSlot();
        slot.setFactoryId("factory-001");
        slot.setSlotDate(LocalDate.now().plusDays(2));
        slot.setQuantity(500);

        DailyCapacityUsage usage = new DailyCapacityUsage();
        usage.setUsedQuantity(500);

        when(orderRepo.findByStatusIn(anyList())).thenReturn(List.of(scheduledOrder));
        when(slotRepo.findByOrderId("ord-s")).thenReturn(List.of(slot));
        when(capacityRepo.findByFactoryIdAndSlotDate("factory-001", LocalDate.now().plusDays(2)))
                .thenReturn(Optional.of(usage));

        spy.rescheduleAll();

        // slot 被刪除
        verify(slotRepo).deleteByOrderId("ord-s");

        // 訂單欄位被重置
        assertEquals(OrderStatus.PENDING, scheduledOrder.getStatus());
        assertEquals(500, scheduledOrder.getRemainingQuantity());
        assertNull(scheduledOrder.getLastSlotDate());
        assertNull(scheduledOrder.getExpectedDueDate());
        assertFalse(scheduledOrder.getIsDelayed());
        assertEquals(0, scheduledOrder.getDelayDays());
        assertNull(scheduledOrder.getScheduleWarning());
    }

    @Test
    void rescheduleAll_doesNotReleaseSlots_forPendingOrders() {
        SchedulerServiceImpl spy = Mockito.spy(
                new SchedulerServiceImpl(capacityRepo, slotRepo, orderRepo));
        doAnswer(inv -> null).when(spy).scheduleOrder(anyString());

        Order pendingOrder = buildOrder("ord-p", OrderStatus.PENDING, 500);
        when(orderRepo.findByStatusIn(anyList())).thenReturn(List.of(pendingOrder));

        spy.rescheduleAll();

        // PENDING 訂單沒有 slot 要釋放，不應呼叫這兩個方法
        verify(slotRepo, never()).findByOrderId(any());
        verify(slotRepo, never()).deleteByOrderId(any());
    }

    @Test
    void rescheduleAll_schedulesOrdersInEddAscendingOrder() {
        SchedulerServiceImpl spy = Mockito.spy(
                new SchedulerServiceImpl(capacityRepo, slotRepo, orderRepo));
        doAnswer(inv -> null).when(spy).scheduleOrder(anyString());

        // orderLate 交期較晚，orderEarly 交期較早
        Order orderLate = buildOrder("ord-late", OrderStatus.PENDING, 100);
        orderLate.setCustomerDueDate(LocalDate.now().plusDays(10));
        orderLate.setCreatedAt(LocalDateTime.now().minusHours(2));

        Order orderEarly = buildOrder("ord-early", OrderStatus.PENDING, 100);
        orderEarly.setCustomerDueDate(LocalDate.now().plusDays(3));
        orderEarly.setCreatedAt(LocalDateTime.now().minusHours(1));

        // 故意以「晚交期在前」的順序回傳，確認排序邏輯有作用
        when(orderRepo.findByStatusIn(anyList())).thenReturn(List.of(orderLate, orderEarly));

        spy.rescheduleAll();

        InOrder inOrder = inOrder(spy);
        inOrder.verify(spy).scheduleOrder("ord-early");  // 交期早的先排
        inOrder.verify(spy).scheduleOrder("ord-late");
    }

    @Test
    void rescheduleAll_sameDueDate_usesCreatedAtFifo() {
        SchedulerServiceImpl spy = Mockito.spy(
                new SchedulerServiceImpl(capacityRepo, slotRepo, orderRepo));
        doAnswer(inv -> null).when(spy).scheduleOrder(anyString());

        LocalDate sameDate = LocalDate.now().plusDays(5);

        Order orderFirst = buildOrder("ord-first", OrderStatus.PENDING, 100);
        orderFirst.setCustomerDueDate(sameDate);
        orderFirst.setCreatedAt(LocalDateTime.now().minusHours(3));  // 較早建立

        Order orderSecond = buildOrder("ord-second", OrderStatus.PENDING, 100);
        orderSecond.setCustomerDueDate(sameDate);
        orderSecond.setCreatedAt(LocalDateTime.now().minusHours(1)); // 較晚建立

        // 故意以「較晚在前」的順序回傳，確認 FIFO 排序有作用
        when(orderRepo.findByStatusIn(anyList())).thenReturn(List.of(orderSecond, orderFirst));

        spy.rescheduleAll();

        InOrder inOrder = inOrder(spy);
        inOrder.verify(spy).scheduleOrder("ord-first");   // createdAt 早的先排
        inOrder.verify(spy).scheduleOrder("ord-second");
    }

    @Test
    void rescheduleAll_callsScheduleOrder_forEachOrder() {
        SchedulerServiceImpl spy = Mockito.spy(
                new SchedulerServiceImpl(capacityRepo, slotRepo, orderRepo));
        doAnswer(inv -> null).when(spy).scheduleOrder(anyString());

        Order p1 = buildOrder("ord-1", OrderStatus.PENDING, 100);
        p1.setCreatedAt(LocalDateTime.now());
        Order p2 = buildOrder("ord-2", OrderStatus.PENDING, 200);
        p2.setCreatedAt(LocalDateTime.now());

        when(orderRepo.findByStatusIn(anyList())).thenReturn(List.of(p1, p2));

        spy.rescheduleAll();

        // 兩筆訂單都必須被排程
        verify(spy).scheduleOrder("ord-1");
        verify(spy).scheduleOrder("ord-2");
    }

    @Test
    void rescheduleAll_pendingOrder_isScheduledAfterRelease() {
        // 整合驗證：一筆 PENDING 訂單在全局重排後成功排程
        Order pendingOrder = buildOrder("ord-p", OrderStatus.PENDING, 100);
        pendingOrder.setCustomerDueDate(LocalDate.now().plusDays(5));

        when(orderRepo.findByStatusIn(anyList())).thenReturn(List.of(pendingOrder));
        when(orderRepo.findById("ord-p")).thenReturn(Optional.of(pendingOrder));
        when(capacityRepo.findByFactoryIdAndSlotDate(any(), any())).thenReturn(Optional.empty());
        when(slotRepo.saveAll(any())).thenAnswer(i -> i.getArgument(0));

        schedulerService.rescheduleAll();

        assertEquals(OrderStatus.SCHEDULED, pendingOrder.getStatus());
        assertEquals(0, pendingOrder.getRemainingQuantity());
        assertNotNull(pendingOrder.getLastSlotDate());
    }

    // ── updateOrderStatusesByDate ─────────────────────────────────────────────

    @Test
    void updateOrderStatusesByDate_scheduledOrderWithPastSlot_transitionsToInProduction() {
        Order scheduled = buildOrder("ord-s", OrderStatus.SCHEDULED, 500);
        scheduled.setLastSlotDate(LocalDate.now().plusDays(5));

        when(slotRepo.findOrderIdsWithSlotsOnOrBefore(LocalDate.now()))
                .thenReturn(List.of("ord-s"));
        when(orderRepo.findByStatusIn(List.of(OrderStatus.SCHEDULED)))
                .thenReturn(List.of(scheduled));
        when(orderRepo.findByStatus(OrderStatus.IN_PRODUCTION))
                .thenReturn(List.of());

        schedulerService.updateOrderStatusesByDate();

        assertEquals(OrderStatus.IN_PRODUCTION, scheduled.getStatus());
        verify(orderRepo).save(scheduled);
    }

    @Test
    void updateOrderStatusesByDate_scheduledOrderWithNoStartedSlots_staysScheduled() {
        Order scheduled = buildOrder("ord-s", OrderStatus.SCHEDULED, 500);

        when(slotRepo.findOrderIdsWithSlotsOnOrBefore(LocalDate.now()))
                .thenReturn(List.of());
        when(orderRepo.findByStatus(OrderStatus.IN_PRODUCTION))
                .thenReturn(List.of());

        schedulerService.updateOrderStatusesByDate();

        assertEquals(OrderStatus.SCHEDULED, scheduled.getStatus());
        verify(orderRepo, never()).save(any());
    }

    @Test
    void updateOrderStatusesByDate_inProductionOrderWithPastLastSlot_transitionsToCompleted() {
        Order inProd = buildOrder("ord-p", OrderStatus.IN_PRODUCTION, 500);
        inProd.setLastSlotDate(LocalDate.now().minusDays(1));

        when(slotRepo.findOrderIdsWithSlotsOnOrBefore(LocalDate.now()))
                .thenReturn(List.of());
        when(orderRepo.findByStatus(OrderStatus.IN_PRODUCTION))
                .thenReturn(List.of(inProd));

        schedulerService.updateOrderStatusesByDate();

        assertEquals(OrderStatus.COMPLETED, inProd.getStatus());
        verify(orderRepo).save(inProd);
    }

    @Test
    void updateOrderStatusesByDate_inProductionOrderWithFutureLastSlot_staysInProduction() {
        Order inProd = buildOrder("ord-p", OrderStatus.IN_PRODUCTION, 500);
        inProd.setLastSlotDate(LocalDate.now().plusDays(3));

        when(slotRepo.findOrderIdsWithSlotsOnOrBefore(LocalDate.now()))
                .thenReturn(List.of());
        when(orderRepo.findByStatus(OrderStatus.IN_PRODUCTION))
                .thenReturn(List.of(inProd));

        schedulerService.updateOrderStatusesByDate();

        assertEquals(OrderStatus.IN_PRODUCTION, inProd.getStatus());
        verify(orderRepo, never()).save(any());
    }

    @Test
    void updateOrderStatusesByDate_noOrders_doesNothing() {
        when(slotRepo.findOrderIdsWithSlotsOnOrBefore(LocalDate.now()))
                .thenReturn(List.of());
        when(orderRepo.findByStatus(OrderStatus.IN_PRODUCTION))
                .thenReturn(List.of());

        schedulerService.updateOrderStatusesByDate();

        verify(orderRepo, never()).save(any());
    }

    // ── 新增的邊界 / 規則測試 ────────────────────────────────────────────────
    // 對應 SCHEDULING_RULES.md 中尚未被涵蓋的細節：
    //  - cursor 從「明天」開始，今天不會被排入
    //  - lastSlotDate == customerDueDate 為邊界，不應視為延誤
    //  - 當日 available == 0 時應跳過、繼續往下一天
    //  - 90 天內產能不足時 status 必須維持 PENDING、不可變成 SCHEDULED
    //  - rescheduleAll 不應包含 IN_PRODUCTION 訂單
    //  - capacityRepo 的 usage 紀錄會在每個 slot 寫入時被更新

    @Test
    void scheduleOrder_neverSchedulesIntoToday_cursorStartsTomorrow() {
        mockOrder.setQuantity(500);
        mockOrder.setRemainingQuantity(500);

        when(orderRepo.findById("order-001")).thenReturn(Optional.of(mockOrder));
        when(capacityRepo.findByFactoryIdAndSlotDate(any(), any())).thenReturn(Optional.empty());
        when(slotRepo.saveAll(any())).thenAnswer(i -> i.getArgument(0));

        ScheduleResult result = schedulerService.scheduleOrder("order-001");

        // 規則：cursor 從 LocalDate.now().plusDays(1) 開始，今天絕不會出現在排程中
        assertTrue(result.getSlots().stream()
                .noneMatch(s -> s.getSlotDate().equals(LocalDate.now())),
                "今日不應該被排入任何 slot");
        assertEquals(LocalDate.now().plusDays(1), result.getSlots().get(0).getSlotDate());
    }

    @Test
    void scheduleOrder_lastSlotExactlyOnDueDate_isNotDelayed() {
        // 邊界：lastSlotDate == customerDueDate → 不算延誤（lastSlotDate.isAfter 為 false）
        mockOrder.setQuantity(500);
        mockOrder.setRemainingQuantity(500);
        mockOrder.setCustomerDueDate(LocalDate.now().plusDays(1));  // 明天，正好等於第一個 slot 日

        when(orderRepo.findById("order-001")).thenReturn(Optional.of(mockOrder));
        when(capacityRepo.findByFactoryIdAndSlotDate(any(), any())).thenReturn(Optional.empty());
        when(slotRepo.saveAll(any())).thenAnswer(i -> i.getArgument(0));

        ScheduleResult result = schedulerService.scheduleOrder("order-001");

        assertFalse(result.isDelayed(), "lastSlotDate 等於 customerDueDate 不應視為延誤");
        assertEquals(0, mockOrder.getDelayDays());
        assertEquals(mockOrder.getCustomerDueDate(), mockOrder.getLastSlotDate());
    }

    @Test
    void scheduleOrder_skipsDaysWithZeroCapacity_continuesToNextAvailableDay() {
        // 第一個目標日（明天）滿載 → 應跳過、改排到後天
        mockOrder.setQuantity(500);
        mockOrder.setRemainingQuantity(500);

        DailyCapacityUsage fullTomorrow = new DailyCapacityUsage();
        fullTomorrow.setUsedQuantity(10000);

        when(orderRepo.findById("order-001")).thenReturn(Optional.of(mockOrder));
        when(capacityRepo.findByFactoryIdAndSlotDate(any(), eq(LocalDate.now().plusDays(1))))
                .thenReturn(Optional.of(fullTomorrow));
        when(capacityRepo.findByFactoryIdAndSlotDate(any(), eq(LocalDate.now().plusDays(2))))
                .thenReturn(Optional.empty());
        when(slotRepo.saveAll(any())).thenAnswer(i -> i.getArgument(0));

        ScheduleResult result = schedulerService.scheduleOrder("order-001");

        assertTrue(result.isSuccess());
        assertEquals(1, result.getSlots().size(), "明天滿載應跳過，只在後天產生 1 個 slot");
        assertEquals(LocalDate.now().plusDays(2), result.getSlots().get(0).getSlotDate());
    }

    @Test
    void scheduleOrder_unschedulable_keepsStatusAsPending() {
        // 90 天內無解 → 不可把 status 改成 SCHEDULED
        mockOrder.setQuantity(500);
        mockOrder.setRemainingQuantity(500);

        DailyCapacityUsage full = new DailyCapacityUsage();
        full.setUsedQuantity(10000);

        when(orderRepo.findById("order-001")).thenReturn(Optional.of(mockOrder));
        when(capacityRepo.findByFactoryIdAndSlotDate(any(), any()))
                .thenReturn(Optional.of(full));

        schedulerService.scheduleOrder("order-001");

        assertEquals(OrderStatus.PENDING, mockOrder.getStatus(),
                "排程失敗時 status 必須維持 PENDING，不可變成 SCHEDULED");
        verify(slotRepo, never()).saveAll(any());
    }

    @Test
    void scheduleOrder_writesCapacityUsageOncePerSlotDay() {
        // 驗證 capacity 帳本：每個 slot 日都會寫入一筆 usage 紀錄
        mockOrder.setQuantity(800);
        mockOrder.setRemainingQuantity(800);

        DailyCapacityUsage almostFull = new DailyCapacityUsage();
        almostFull.setUsedQuantity(9500);

        when(orderRepo.findById("order-001")).thenReturn(Optional.of(mockOrder));
        when(capacityRepo.findByFactoryIdAndSlotDate(any(), eq(LocalDate.now().plusDays(1))))
                .thenReturn(Optional.of(almostFull));
        when(capacityRepo.findByFactoryIdAndSlotDate(any(), eq(LocalDate.now().plusDays(2))))
                .thenReturn(Optional.empty());
        when(slotRepo.saveAll(any())).thenAnswer(i -> i.getArgument(0));

        schedulerService.scheduleOrder("order-001");

        // 跨兩天 → capacityRepo.save 至少呼叫 2 次
        verify(capacityRepo, atLeast(2)).save(any(DailyCapacityUsage.class));
    }

    @Test
    void rescheduleAll_doesNotIncludeInProductionOrders() {
        // 規則 5：rescheduleAll 只動 PENDING/SCHEDULED，IN_PRODUCTION 不移動
        // 這裡藉由驗證 findByStatusIn 的呼叫參數確保查詢條件正確
        when(orderRepo.findByStatusIn(anyList())).thenReturn(List.of());

        schedulerService.rescheduleAll();

        ArgumentCaptor<List<OrderStatus>> captor = ArgumentCaptor.forClass(List.class);
        verify(orderRepo).findByStatusIn(captor.capture());
        List<OrderStatus> requested = captor.getValue();
        assertTrue(requested.contains(OrderStatus.PENDING));
        assertTrue(requested.contains(OrderStatus.SCHEDULED));
        assertFalse(requested.contains(OrderStatus.IN_PRODUCTION),
                "rescheduleAll 不應請求 IN_PRODUCTION 訂單");
        assertFalse(requested.contains(OrderStatus.COMPLETED));
        assertFalse(requested.contains(OrderStatus.CANCELLED));
    }

    @Test
    void getAvailableCapacity_returnsRemainingExactly_atBoundary() {
        // 邊界：usedQuantity = 9999 → 還剩 1
        DailyCapacityUsage almostFull = new DailyCapacityUsage();
        almostFull.setUsedQuantity(9999);

        when(capacityRepo.findByFactoryIdAndSlotDate("factory-001", LocalDate.now()))
                .thenReturn(Optional.of(almostFull));

        assertEquals(1, schedulerService.getAvailableCapacity("factory-001", LocalDate.now()));
    }

    @Test
    void scheduleOrder_alreadyScheduledOrder_isIdempotentNoOp() {
        // Regression: a stale SCHEDULE_ORDER task can fire on an order that a prior
        // RESCHEDULE_ALL already scheduled (status=SCHEDULED, remainingQuantity=0).
        // The old impl crashed with `Index -1 out of bounds for length 0` at
        // `slots.get(slots.size() - 1)`. Now it must be a no-op that returns the
        // existing slots without touching capacity / order state.
        mockOrder.setQuantity(500);
        mockOrder.setRemainingQuantity(0);
        mockOrder.setStatus(OrderStatus.SCHEDULED);
        mockOrder.setIsDelayed(false);

        ProductionSlot existing = new ProductionSlot();
        existing.setOrderId("order-001");
        existing.setSlotDate(LocalDate.now().plusDays(2));
        existing.setQuantity(500);

        when(orderRepo.findById("order-001")).thenReturn(Optional.of(mockOrder));
        when(slotRepo.findByOrderId("order-001")).thenReturn(List.of(existing));

        ScheduleResult result = schedulerService.scheduleOrder("order-001");

        assertTrue(result.isSuccess());
        assertFalse(result.isDelayed());
        assertEquals(1, result.getSlots().size(),
                "Should return the existing slots, not throw or wipe them");
        // No mutations: order is not re-saved, no slots saved, capacity untouched
        verify(orderRepo, never()).save(any());
        verify(slotRepo, never()).saveAll(any());
        verify(capacityRepo, never()).save(any());
        verify(capacityRepo, never()).delete(any());
    }

    @Test
    void scheduleOrder_alreadyScheduledOrderIsDelayed_propagatesDelayFlag() {
        // QueuePoller decides whether to enqueueRescheduleAll based on result.isDelayed().
        // After the idempotency guard, we must still report the actual delayed state
        // so a recovery RESCHEDULE_ALL doesn't get spuriously skipped (or fired forever).
        mockOrder.setQuantity(500);
        mockOrder.setRemainingQuantity(0);
        mockOrder.setStatus(OrderStatus.SCHEDULED);
        mockOrder.setIsDelayed(true);

        when(orderRepo.findById("order-001")).thenReturn(Optional.of(mockOrder));
        when(slotRepo.findByOrderId("order-001")).thenReturn(List.of());

        ScheduleResult result = schedulerService.scheduleOrder("order-001");

        assertTrue(result.isSuccess());
        assertTrue(result.isDelayed(), "Delayed flag must reflect the order's current state");
    }

    @Test
    void scheduleOrder_cancelledOrder_isNoOp() {
        // Defence-in-depth: SCHEDULE_ORDER must never re-allocate slots for a
        // CANCELLED order even if a stale task arrives.
        mockOrder.setQuantity(500);
        mockOrder.setRemainingQuantity(500);
        mockOrder.setStatus(OrderStatus.CANCELLED);

        when(orderRepo.findById("order-001")).thenReturn(Optional.of(mockOrder));
        when(slotRepo.findByOrderId("order-001")).thenReturn(List.of());

        schedulerService.scheduleOrder("order-001");

        verify(slotRepo, never()).saveAll(any());
        verify(orderRepo, never()).save(any());
        assertEquals(OrderStatus.CANCELLED, mockOrder.getStatus(),
                "Cancelled status must not flip to SCHEDULED");
    }

    // ── 邊界與爆量案例 ───────────────────────────────────────────────────────

    @Test
    void scheduleOrder_singleWaferFitsIntoOneRemainingSlot_atBoundary() {
        // 邊界：所有天都 used=9999、剩 1 片；單片訂單能在第一天就排上
        mockOrder.setQuantity(1);
        mockOrder.setRemainingQuantity(1);
        mockOrder.setCustomerDueDate(LocalDate.now().plusDays(10));

        DailyCapacityUsage near = new DailyCapacityUsage();
        near.setUsedQuantity(9999);

        when(orderRepo.findById("order-001")).thenReturn(Optional.of(mockOrder));
        when(capacityRepo.findByFactoryIdAndSlotDate(any(), any()))
                .thenReturn(Optional.of(near));
        when(slotRepo.saveAll(any())).thenAnswer(i -> i.getArgument(0));

        ScheduleResult result = schedulerService.scheduleOrder("order-001");

        assertTrue(result.isSuccess());
        assertEquals(1, result.getSlots().size());
        assertEquals(1, result.getSlots().get(0).getQuantity());
        assertEquals(LocalDate.now().plusDays(1), result.getSlots().get(0).getSlotDate());
    }

    @Test
    void scheduleOrder_spansFinalDayOfLookaheadWindow_isStillScheduled() {
        // 邊界：訂單剛好需要排到 lookahead 期間的最後一天才能完成
        // 前 89 天滿載，第 90 天空 → 訂單 500 片只能排在第 90 天
        mockOrder.setQuantity(500);
        mockOrder.setRemainingQuantity(500);
        mockOrder.setCustomerDueDate(LocalDate.now().plusDays(100));

        DailyCapacityUsage full = new DailyCapacityUsage();
        full.setUsedQuantity(10000);
        LocalDate lastDay = LocalDate.now().plusDays(91);  // tomorrow + 90 = day 91

        when(orderRepo.findById("order-001")).thenReturn(Optional.of(mockOrder));
        when(capacityRepo.findByFactoryIdAndSlotDate(any(), any())).thenAnswer(inv -> {
            LocalDate d = inv.getArgument(1);
            return d.equals(lastDay) ? Optional.empty() : Optional.of(full);
        });
        when(slotRepo.saveAll(any())).thenAnswer(i -> i.getArgument(0));

        ScheduleResult result = schedulerService.scheduleOrder("order-001");

        assertTrue(result.isSuccess(), "正好能在 lookahead 期內完成，不應 unschedulable");
        assertEquals(1, result.getSlots().size());
        assertEquals(lastDay, result.getSlots().get(0).getSlotDate());
    }

    @Test
    void scheduleOrder_needsOneDayPastLookaheadWindow_isUnschedulable() {
        // 邊界對照：前 90 天全滿，只有第 91 天空 → 已超出 lookahead → unschedulable
        mockOrder.setQuantity(500);
        mockOrder.setRemainingQuantity(500);
        mockOrder.setCustomerDueDate(LocalDate.now().plusDays(100));

        DailyCapacityUsage full = new DailyCapacityUsage();
        full.setUsedQuantity(10000);

        when(orderRepo.findById("order-001")).thenReturn(Optional.of(mockOrder));
        when(capacityRepo.findByFactoryIdAndSlotDate(any(), any())).thenAnswer(inv -> {
            LocalDate d = inv.getArgument(1);
            // 只有 deadline 之後才有空位
            return d.isAfter(LocalDate.now().plusDays(91))
                    ? Optional.empty() : Optional.of(full);
        });

        ScheduleResult result = schedulerService.scheduleOrder("order-001");

        assertTrue(result.isUnschedulable(),
                "lookahead 期內無解 → 必須 unschedulable，不可往更遠探");
        assertEquals(OrderStatus.PENDING, mockOrder.getStatus());
    }

    @Test
    void scheduleOrder_specDrift_delayReasonFieldNotImplemented() {
        // SCHEDULING_RULES.md §6 定義了 delayReason 列舉
        //   (CAPACITY_FULL / MANUAL_DATE_UNREACHABLE)，
        // 但 Order entity 目前沒有 delayReason 欄位，scheduleOrder 也不會設定它。
        // 這個測試把這份「規格 / 實作 漂移」標記出來：
        //   - 若未來補上 delayReason 欄位，這個測試會自動失敗，提示要更新測試
        //   - 若決定移除規則中這條，請刪掉這個測試
        mockOrder.setQuantity(500);
        mockOrder.setRemainingQuantity(500);
        mockOrder.setCustomerDueDate(LocalDate.now().minusDays(1));  // 必然 delayed

        when(orderRepo.findById("order-001")).thenReturn(Optional.of(mockOrder));
        when(capacityRepo.findByFactoryIdAndSlotDate(any(), any())).thenReturn(Optional.empty());
        when(slotRepo.saveAll(any())).thenAnswer(i -> i.getArgument(0));

        schedulerService.scheduleOrder("order-001");
        assertTrue(mockOrder.getIsDelayed());

        // 反向斷言：當前實作不應有 getDelayReason() 方法。
        // 如果哪天加上了，反射這裡會找到方法 → fail，提醒同步更新規則覆蓋的測試。
        boolean methodExists = java.util.Arrays.stream(mockOrder.getClass().getMethods())
                .anyMatch(m -> m.getName().equals("getDelayReason"));
        assertFalse(methodExists,
                "Order.getDelayReason() 已存在；請依 SCHEDULING_RULES.md §6 " +
                "為 CAPACITY_FULL / MANUAL_DATE_UNREACHABLE 新增正向測試，並移除此漂移標記");
    }

    @Test
    void releaseCapacity_decrementsToExactlyZero_deletesRecord() {
        // 邊界：剛好歸還等於 usedQuantity 的量 → 紀錄應被刪除
        DailyCapacityUsage usage = new DailyCapacityUsage();
        usage.setUsedQuantity(500);

        when(capacityRepo.findByFactoryIdAndSlotDate("factory-001", LocalDate.now()))
                .thenReturn(Optional.of(usage));

        schedulerService.releaseCapacity("factory-001", LocalDate.now(), 500);

        verify(capacityRepo).delete(usage);
        verify(capacityRepo, never()).save(any());
    }

    // ── 輔助方法 ───────────────────────────────────────────────────────────────

    private Order buildOrder(String id, OrderStatus status, int quantity) {
        Order o = new Order();
        o.setId(id);
        o.setFactoryId("factory-001");
        o.setCustomerId("cust-001");
        o.setCreatedBy("user-001");
        o.setQuantity(quantity);
        o.setRemainingQuantity(status == OrderStatus.SCHEDULED ? 0 : quantity);
        o.setStatus(status);
        o.setCustomerDueDate(LocalDate.now().plusDays(7));
        o.setIsDelayed(false);
        o.setDelayDays(0);
        o.setVersion(0);
        o.setCreatedAt(LocalDateTime.now().minusMinutes(10));
        o.setUpdatedAt(LocalDateTime.now().minusMinutes(10));
        return o;
    }
}