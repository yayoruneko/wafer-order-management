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