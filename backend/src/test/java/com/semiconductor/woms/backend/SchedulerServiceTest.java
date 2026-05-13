package com.semiconductor.woms.backend;

import com.semiconductor.woms.backend.model.DailyCapacityUsage;
import com.semiconductor.woms.backend.model.Order;
import com.semiconductor.woms.backend.model.enums.OrderStatus;
import com.semiconductor.woms.backend.repository.DailyCapacityUsageRepository;
import com.semiconductor.woms.backend.repository.OrderRepository;
import com.semiconductor.woms.backend.repository.ProductionSlotRepository;
import com.semiconductor.woms.backend.service.ScheduleResult;
import com.semiconductor.woms.backend.service.SchedulerServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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

        DailyCapacityUsage todayUsage = new DailyCapacityUsage();
        todayUsage.setFactoryId("factory-001");
        todayUsage.setSlotDate(LocalDate.now());
        todayUsage.setUsedQuantity(9500);

        when(orderRepo.findById("order-001")).thenReturn(Optional.of(mockOrder));
        when(capacityRepo.findByFactoryIdAndSlotDate(any(), eq(LocalDate.now())))
                .thenReturn(Optional.of(todayUsage));
        when(capacityRepo.findByFactoryIdAndSlotDate(any(), eq(LocalDate.now().plusDays(1))))
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
        mockOrder.setCustomerDueDate(LocalDate.now());

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

    // ── New test cases ────────────────────────────────────────────────────────

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
        // Due date 2 days ago → delayDays should be >= 2
        mockOrder.setQuantity(500);
        mockOrder.setRemainingQuantity(500);
        mockOrder.setCustomerDueDate(LocalDate.now().minusDays(2));

        when(orderRepo.findById("order-001")).thenReturn(Optional.of(mockOrder));
        when(capacityRepo.findByFactoryIdAndSlotDate(any(), any())).thenReturn(Optional.empty());
        when(slotRepo.saveAll(any())).thenAnswer(i -> i.getArgument(0));

        ScheduleResult result = schedulerService.scheduleOrder("order-001");

        assertTrue(result.isDelayed());
        assertTrue(mockOrder.getDelayDays() >= 2, "Expected delayDays >= 2, got: " + mockOrder.getDelayDays());
    }

    @Test
    void scheduleOrder_exactFitIntoAvailableCapacity_producesSingleSlot() {
        // available = 10000 - 9500 = 500; order qty = 500 → exact fit, no spill to next day
        mockOrder.setQuantity(500);
        mockOrder.setRemainingQuantity(500);

        DailyCapacityUsage partialUsage = new DailyCapacityUsage();
        partialUsage.setFactoryId("factory-001");
        partialUsage.setSlotDate(LocalDate.now());
        partialUsage.setUsedQuantity(9500);

        when(orderRepo.findById("order-001")).thenReturn(Optional.of(mockOrder));
        when(capacityRepo.findByFactoryIdAndSlotDate(any(), any()))
                .thenReturn(Optional.of(partialUsage));
        when(slotRepo.saveAll(any())).thenAnswer(i -> i.getArgument(0));

        ScheduleResult result = schedulerService.scheduleOrder("order-001");

        assertTrue(result.isSuccess());
        assertEquals(1, result.getSlots().size());
        assertEquals(0, mockOrder.getRemainingQuantity());
        assertEquals(LocalDate.now(), mockOrder.getLastSlotDate());
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
}
