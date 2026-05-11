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
    void 數量小於當日剩餘產能_應該只產生一個slot且remainingQuantity歸零() {
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
    void 數量超過當日剩餘產能_應該拆分到下一天且remainingQuantity正確扣減() {
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
    void 拆分後lastSlotDate等於交期_isDelayed為false且scheduleWarning為null() {
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
    void 拆分後lastSlotDate超過交期_isDelayed為true且scheduleWarning有內容() {
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
    void 總產能不足_狀態維持PENDING且scheduleWarning有內容() {
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
}