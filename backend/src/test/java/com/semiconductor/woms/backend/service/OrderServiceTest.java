package com.semiconductor.woms.backend.service;

import com.semiconductor.woms.backend.dto.OrderRequest;
import com.semiconductor.woms.backend.dto.OrderResponse;
import com.semiconductor.woms.backend.dto.OrderStatsResponse;
import com.semiconductor.woms.backend.dto.OrderUpdateRequest;
import com.semiconductor.woms.backend.model.Customer;
import com.semiconductor.woms.backend.model.Order;
import com.semiconductor.woms.backend.model.ProductionSlot;
import com.semiconductor.woms.backend.model.SchedulingAction;
import com.semiconductor.woms.backend.model.User;
import com.semiconductor.woms.backend.model.enums.OrderStatus;
import com.semiconductor.woms.backend.repository.CustomerRepository;
import com.semiconductor.woms.backend.repository.OrderHistoryRepository;
import com.semiconductor.woms.backend.repository.OrderRepository;
import com.semiconductor.woms.backend.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import com.semiconductor.woms.backend.repository.ProductionSlotRepository;
import org.springframework.data.domain.Sort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SchedulingQueueService schedulingQueueService;

    @Mock
    private ProductionSlotRepository productionSlotRepository;

    @Mock
    private OrderHistoryRepository orderHistoryRepository;

    @Mock
    private SchedulerService schedulerService;

    @InjectMocks
    private OrderService orderService;

    // ── createOrder ───────────────────────────────────────────────────────────

    @Test
    void createOrder_rejectsQuantityBelowMin() {
        OrderRequest req = buildCreateRequest(24, LocalDate.now().plusDays(1));
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> orderService.createOrder(req));
        assertTrue(ex.getMessage().contains("25"));
        verifyNoInteractions(orderRepository);
    }

    @Test
    void createOrder_rejectsQuantityAboveMax() {
        OrderRequest req = buildCreateRequest(2501, LocalDate.now().plusDays(1));
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> orderService.createOrder(req));
        assertTrue(ex.getMessage().contains("2500"));
        verifyNoInteractions(orderRepository);
    }

    @Test
    void createOrder_rejectsUnknownCustomer() {
        OrderRequest req = buildCreateRequest(100, LocalDate.now().plusDays(1));
        req.setCustomerId("NONEXISTENT");
        when(customerRepository.findById("NONEXISTENT")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> orderService.createOrder(req));
        verify(orderRepository, never()).save(any());
    }

    @Test
    void createOrder_rejectsPastDueDate() {
        OrderRequest req = buildCreateRequest(100, LocalDate.now().minusDays(1));
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> orderService.createOrder(req));
        assertTrue(ex.getMessage().contains("交期"));
        verifyNoInteractions(orderRepository);
    }

    @Test
    void createOrder_savesOrderAndEnqueuesScheduleTask() {
        OrderRequest req = buildCreateRequest(100, LocalDate.now().plusDays(10));
        Customer customer = buildCustomer("CUST-001");
        when(customerRepository.findById("CUST-001")).thenReturn(Optional.of(customer));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            if (o.getId() == null) o.setId("generated-id");
            if (o.getCreatedAt() == null) o.setCreatedAt(LocalDateTime.now());
            if (o.getUpdatedAt() == null) o.setUpdatedAt(o.getCreatedAt());
            if (o.getRemainingQuantity() == null) o.setRemainingQuantity(o.getQuantity());
            return o;
        });

        OrderResponse res = orderService.createOrder(req);

        assertNotNull(res);
        assertEquals("generated-id", res.getId());
        assertEquals(100, res.getQuantity());
        assertEquals(OrderStatus.PENDING.name(), res.getStatus());
        verify(schedulingQueueService).enqueue("generated-id", SchedulingAction.SCHEDULE_ORDER);
    }

    @Test
    void createOrder_acceptsExactMinimumQuantity() {
        OrderRequest req = buildCreateRequest(25, LocalDate.now().plusDays(1));
        Customer customer = buildCustomer("CUST-001");
        when(customerRepository.findById("CUST-001")).thenReturn(Optional.of(customer));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            if (o.getId() == null) o.setId("id-min");
            if (o.getRemainingQuantity() == null) o.setRemainingQuantity(o.getQuantity());
            if (o.getCreatedAt() == null) o.setCreatedAt(LocalDateTime.now());
            if (o.getUpdatedAt() == null) o.setUpdatedAt(o.getCreatedAt());
            return o;
        });

        OrderResponse res = orderService.createOrder(req);
        assertEquals(25, res.getQuantity());
    }

    @Test
    void createOrder_acceptsExactMaximumQuantity() {
        OrderRequest req = buildCreateRequest(2500, LocalDate.now().plusDays(1));
        Customer customer = buildCustomer("CUST-001");
        when(customerRepository.findById("CUST-001")).thenReturn(Optional.of(customer));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            if (o.getId() == null) o.setId("id-max");
            if (o.getRemainingQuantity() == null) o.setRemainingQuantity(o.getQuantity());
            if (o.getCreatedAt() == null) o.setCreatedAt(LocalDateTime.now());
            if (o.getUpdatedAt() == null) o.setUpdatedAt(o.getCreatedAt());
            return o;
        });

        OrderResponse res = orderService.createOrder(req);
        assertEquals(2500, res.getQuantity());
    }

    @Test
    void createOrder_doesNotEnqueueWhenCustomerNotFound() {
        OrderRequest req = buildCreateRequest(100, LocalDate.now().plusDays(5));
        req.setCustomerId("GHOST");
        when(customerRepository.findById("GHOST")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> orderService.createOrder(req));
        verifyNoInteractions(schedulingQueueService);
    }

    // ── getAllOrders / getOrderById ────────────────────────────────────────────

    @Test
    void getAllOrders_returnsEmptyListWhenNoOrders() {
        when(orderRepository.findAll(any(Sort.class))).thenReturn(List.of());
        assertTrue(orderService.getAllOrders().isEmpty());
    }

    @Test
    void getAllOrders_returnsMappedOrdersWithCustomerInfo() {
        Order order = buildExistingOrder("o-99", OrderStatus.PENDING, 200, 200);
        Customer customer = buildCustomer("CUST-001");
        customer.setCustomerCode("CODE-XYZ");
        customer.setName("XYZ Corp");

        when(orderRepository.findAll(any(Sort.class))).thenReturn(List.of(order));
        when(customerRepository.findById("CUST-001")).thenReturn(Optional.of(customer));

        List<OrderResponse> result = orderService.getAllOrders();
        assertEquals(1, result.size());
        assertEquals("o-99", result.get(0).getId());
        assertEquals("CODE-XYZ", result.get(0).getCustomerCode());
        assertEquals("XYZ Corp", result.get(0).getCustomerName());
    }

    @Test
    void getOrderById_returnsResponseForExistingOrder() {
        Order order = buildExistingOrder("o-42", OrderStatus.PENDING, 150, 150);
        when(orderRepository.findById("o-42")).thenReturn(Optional.of(order));
        when(customerRepository.findById("CUST-001")).thenReturn(Optional.empty());

        OrderResponse res = orderService.getOrderById("o-42");
        assertEquals("o-42", res.getId());
        assertEquals(150, res.getQuantity());
        assertEquals("PENDING", res.getStatus());
    }

    @Test
    void getOrderById_throwsWhenMissing() {
        when(orderRepository.findById("missing")).thenReturn(Optional.empty());
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> orderService.getOrderById("missing"));
        assertTrue(ex.getMessage().contains("missing"));
    }

    // ── cancelOrder (Week 2) ──────────────────────────────────────────────────

    @Test
    void cancelOrder_throwsWhenOrderNotFound() {
        when(orderRepository.findById("ghost-id")).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> orderService.cancelOrder("ghost-id"));
        verify(orderRepository, never()).save(any());
    }

    @Test
    void cancelOrder_throwsWhenAlreadyCancelled() {
        Order order = buildExistingOrder("o-1", OrderStatus.CANCELLED, 100, 100);
        when(orderRepository.findById("o-1")).thenReturn(Optional.of(order));

        assertThrows(IllegalStateException.class, () -> orderService.cancelOrder("o-1"));
        verify(orderRepository, never()).save(any());
    }

    @Test
    void cancelOrder_recordsCancelledFromStatus() {
        Order order = buildExistingOrder("o-1", OrderStatus.IN_PRODUCTION, 100, 0);
        when(orderRepository.findById("o-1")).thenReturn(Optional.of(order));
        when(productionSlotRepository.findByOrderId("o-1")).thenReturn(List.of());
        when(orderRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        orderService.cancelOrder("o-1");

        assertEquals(OrderStatus.CANCELLED, order.getStatus());
        assertEquals(OrderStatus.IN_PRODUCTION, order.getCancelledFromStatus());
    }

    @Test
    void cancelOrder_releasesProductionSlots() {
        Order order = buildExistingOrder("o-1", OrderStatus.SCHEDULED, 500, 0);

        ProductionSlot slot1 = buildSlot("factory-001", LocalDate.now().plusDays(1), 300);
        ProductionSlot slot2 = buildSlot("factory-001", LocalDate.now().plusDays(2), 200);

        when(orderRepository.findById("o-1")).thenReturn(Optional.of(order));
        when(productionSlotRepository.findByOrderId("o-1")).thenReturn(List.of(slot1, slot2));
        when(orderRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        orderService.cancelOrder("o-1");

        // 產能必須被歸還兩次（每個 slot 一次）
        verify(schedulerService).releaseCapacity("factory-001", LocalDate.now().plusDays(1), 300);
        verify(schedulerService).releaseCapacity("factory-001", LocalDate.now().plusDays(2), 200);
        // slot 資料必須被刪除
        verify(productionSlotRepository).deleteByOrderId("o-1");
    }

    @Test
    void cancelOrder_triggersGlobalReschedule() {
        Order order = buildExistingOrder("o-1", OrderStatus.SCHEDULED, 100, 0);
        when(orderRepository.findById("o-1")).thenReturn(Optional.of(order));
        when(productionSlotRepository.findByOrderId("o-1")).thenReturn(List.of());
        when(orderRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        orderService.cancelOrder("o-1");

        verify(schedulingQueueService).enqueueRescheduleAll();
    }

    @Test
    void cancelOrder_clearsAllSchedulingFields() {
        Order order = buildExistingOrder("o-1", OrderStatus.SCHEDULED, 500, 0);
        order.setLastSlotDate(LocalDate.now().plusDays(3));
        order.setExpectedDueDate(LocalDate.now().plusDays(3));
        order.setIsDelayed(true);
        order.setDelayDays(2);
        order.setScheduleWarning("some warning");

        when(orderRepository.findById("o-1")).thenReturn(Optional.of(order));
        when(productionSlotRepository.findByOrderId("o-1")).thenReturn(List.of());
        when(orderRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        orderService.cancelOrder("o-1");

        assertNull(order.getLastSlotDate());
        assertNull(order.getExpectedDueDate());
        assertFalse(order.getIsDelayed());
        assertEquals(0, order.getDelayDays());
        assertNull(order.getScheduleWarning());
        assertEquals(order.getQuantity(), order.getRemainingQuantity());
    }

    @Test
    void cancelOrder_setsStatusToCancelled() {
        Order order = buildExistingOrder("o-1", OrderStatus.PENDING, 100, 100);
        when(orderRepository.findById("o-1")).thenReturn(Optional.of(order));
        when(productionSlotRepository.findByOrderId("o-1")).thenReturn(List.of());
        when(orderRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        orderService.cancelOrder("o-1");

        assertEquals(OrderStatus.CANCELLED, order.getStatus());
        verify(orderRepository).save(order);
    }

    // ── updateOrder (Week 2) ──────────────────────────────────────────────────

    @Test
    void updateOrder_throwsWhenOrderNotFound() {
        when(orderRepository.findById("ghost")).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class,
                () -> orderService.updateOrder("ghost", buildUpdateRequest(200, LocalDate.now().plusDays(5))));
    }

    @Test
    void updateOrder_throwsForCancelledOrder() {
        Order order = buildExistingOrder("o-1", OrderStatus.CANCELLED, 100, 100);
        when(orderRepository.findById("o-1")).thenReturn(Optional.of(order));

        assertThrows(IllegalStateException.class,
                () -> orderService.updateOrder("o-1", buildUpdateRequest(200, LocalDate.now().plusDays(5))));
        verify(orderRepository, never()).save(any());
    }

    @Test
    void updateOrder_throwsForCompletedOrder() {
        Order order = buildExistingOrder("o-1", OrderStatus.COMPLETED, 100, 0);
        when(orderRepository.findById("o-1")).thenReturn(Optional.of(order));

        assertThrows(IllegalStateException.class,
                () -> orderService.updateOrder("o-1", buildUpdateRequest(200, LocalDate.now().plusDays(5))));
        verify(orderRepository, never()).save(any());
    }

    @Test
    void updateOrder_throwsForPastDueDate() {
        Order order = buildExistingOrder("o-1", OrderStatus.PENDING, 100, 100);
        when(orderRepository.findById("o-1")).thenReturn(Optional.of(order));

        assertThrows(IllegalArgumentException.class,
                () -> orderService.updateOrder("o-1",
                        buildUpdateRequest(200, LocalDate.now().minusDays(1))));
        verify(orderRepository, never()).save(any());
    }

    @Test
    void updateOrder_updatesQuantityAndDueDateOnOrder() {
        Order order = buildExistingOrder("o-1", OrderStatus.SCHEDULED, 100, 0);
        LocalDate newDue = LocalDate.now().plusDays(15);

        when(orderRepository.findById("o-1")).thenReturn(Optional.of(order));
        when(productionSlotRepository.findByOrderId("o-1")).thenReturn(List.of());
        when(orderRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(customerRepository.findById(any())).thenReturn(Optional.empty());

        orderService.updateOrder("o-1", buildUpdateRequest(300, newDue));

        assertEquals(300, order.getQuantity());
        assertEquals(newDue, order.getCustomerDueDate());
    }

    @Test
    void updateOrder_resetsOrderToPending_andClearsSchedulingFields() {
        Order order = buildExistingOrder("o-1", OrderStatus.SCHEDULED, 100, 0);
        order.setLastSlotDate(LocalDate.now().plusDays(3));
        order.setIsDelayed(true);
        order.setDelayDays(2);

        when(orderRepository.findById("o-1")).thenReturn(Optional.of(order));
        when(productionSlotRepository.findByOrderId("o-1")).thenReturn(List.of());
        when(orderRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(customerRepository.findById(any())).thenReturn(Optional.empty());

        orderService.updateOrder("o-1", buildUpdateRequest(300, LocalDate.now().plusDays(10)));

        assertEquals(OrderStatus.PENDING, order.getStatus());
        assertEquals(300, order.getRemainingQuantity());  // 重置為新數量
        assertNull(order.getLastSlotDate());
        assertNull(order.getExpectedDueDate());
        assertFalse(order.getIsDelayed());
        assertEquals(0, order.getDelayDays());
        assertNull(order.getScheduleWarning());
    }

    @Test
    void updateOrder_releasesExistingSlots() {
        Order order = buildExistingOrder("o-1", OrderStatus.SCHEDULED, 500, 0);

        ProductionSlot slot1 = buildSlot("factory-001", LocalDate.now().plusDays(1), 300);
        ProductionSlot slot2 = buildSlot("factory-001", LocalDate.now().plusDays(2), 200);

        when(orderRepository.findById("o-1")).thenReturn(Optional.of(order));
        when(productionSlotRepository.findByOrderId("o-1")).thenReturn(List.of(slot1, slot2));
        when(orderRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(customerRepository.findById(any())).thenReturn(Optional.empty());

        orderService.updateOrder("o-1", buildUpdateRequest(400, LocalDate.now().plusDays(10)));

        verify(schedulerService).releaseCapacity("factory-001", LocalDate.now().plusDays(1), 300);
        verify(schedulerService).releaseCapacity("factory-001", LocalDate.now().plusDays(2), 200);
        verify(productionSlotRepository).deleteByOrderId("o-1");
    }

    @Test
    void updateOrder_triggersGlobalReschedule() {
        Order order = buildExistingOrder("o-1", OrderStatus.PENDING, 100, 100);
        when(orderRepository.findById("o-1")).thenReturn(Optional.of(order));
        when(productionSlotRepository.findByOrderId("o-1")).thenReturn(List.of());
        when(orderRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(customerRepository.findById(any())).thenReturn(Optional.empty());

        orderService.updateOrder("o-1", buildUpdateRequest(200, LocalDate.now().plusDays(10)));

        verify(schedulingQueueService).enqueueRescheduleAll();
    }

    @Test
    void updateOrder_returnsResponseWithUpdatedValues() {
        Order order = buildExistingOrder("o-1", OrderStatus.SCHEDULED, 100, 0);
        LocalDate newDue = LocalDate.now().plusDays(20);

        when(orderRepository.findById("o-1")).thenReturn(Optional.of(order));
        when(productionSlotRepository.findByOrderId("o-1")).thenReturn(List.of());
        when(orderRepository.save(any())).thenAnswer(i -> {
            Order saved = i.getArgument(0);
            saved.setUpdatedAt(LocalDateTime.now());
            return saved;
        });
        when(customerRepository.findById(any())).thenReturn(Optional.empty());

        OrderResponse res = orderService.updateOrder("o-1",
                buildUpdateRequest(350, newDue));

        assertEquals(350, res.getQuantity());
        assertEquals(newDue, res.getCustomerDueDate());
        assertEquals(OrderStatus.PENDING.name(), res.getStatus());
    }

    @Test
    void updateOrder_doesNotReleaseSlots_whenNoSlotsExist() {
        Order order = buildExistingOrder("o-1", OrderStatus.PENDING, 100, 100);
        when(orderRepository.findById("o-1")).thenReturn(Optional.of(order));
        when(productionSlotRepository.findByOrderId("o-1")).thenReturn(List.of());
        when(orderRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(customerRepository.findById(any())).thenReturn(Optional.empty());

        orderService.updateOrder("o-1", buildUpdateRequest(200, LocalDate.now().plusDays(5)));

        // slot 為空，releaseCapacity 不應被呼叫
        verify(schedulerService, never()).releaseCapacity(any(), any(), anyInt());
        // deleteByOrderId 仍然會被呼叫（對空集合操作，no-op）
        verify(productionSlotRepository).deleteByOrderId("o-1");
    }

    // ── 新增的邊界 / 規則測試 ────────────────────────────────────────────────
    // 對應 SCHEDULING_RULES.md 中尚未被涵蓋的細節：
    //  - 交期 == 今天 為邊界，應被拒絕（規則：必須晚於今日）
    //  - updateOrder 樂觀鎖：updatedAt 不一致應回 409（完全沒被測過）
    //  - updateOrder / cancelOrder：必須寫入 OrderHistory snapshot
    //  - getOrderSlots / getOrderHistory：訂單不存在時必須拋例外
    //  - getFilteredOrders: status / view 過濾條件
    //  - getOrderStats: 各狀態的計數

    @Test
    void createOrder_rejectsDueDateEqualToToday() {
        // 邊界：規則明確要求「交期必須晚於今日」，今天本身應被拒絕
        OrderRequest req = buildCreateRequest(100, LocalDate.now());
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> orderService.createOrder(req));
        assertTrue(ex.getMessage().contains("交期"));
        verifyNoInteractions(orderRepository);
    }

    @Test
    void updateOrder_throwsConflict_whenUpdatedAtMismatch() {
        // 規則四之 2：使用者帶上 updatedAt，後端比對不符即回 409
        Order order = buildExistingOrder("o-1", OrderStatus.SCHEDULED, 100, 0);
        order.setUpdatedAt(LocalDateTime.now());
        when(orderRepository.findById("o-1")).thenReturn(Optional.of(order));

        OrderUpdateRequest req = buildUpdateRequest(200, LocalDate.now().plusDays(7));
        req.setUpdatedAt(LocalDateTime.now().minusHours(1));  // 舊資料

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> orderService.updateOrder("o-1", req));
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        verify(orderRepository, never()).save(any());
        verify(schedulingQueueService, never()).enqueueRescheduleAll();
    }

    @Test
    void updateOrder_succeeds_whenUpdatedAtMatches() {
        Order order = buildExistingOrder("o-1", OrderStatus.SCHEDULED, 100, 0);
        LocalDateTime exact = LocalDateTime.now();
        order.setUpdatedAt(exact);

        when(orderRepository.findById("o-1")).thenReturn(Optional.of(order));
        when(productionSlotRepository.findByOrderId("o-1")).thenReturn(List.of());
        when(orderRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(customerRepository.findById(any())).thenReturn(Optional.empty());

        OrderUpdateRequest req = buildUpdateRequest(200, LocalDate.now().plusDays(7));
        req.setUpdatedAt(exact);  // 與 DB 一致

        assertDoesNotThrow(() -> orderService.updateOrder("o-1", req));
        verify(schedulingQueueService).enqueueRescheduleAll();
    }

    @Test
    void updateOrder_skipsOptimisticLockCheck_whenClientOmitsUpdatedAt() {
        // 前端沒帶 updatedAt 時，後端應視為「不檢查」，正常處理
        Order order = buildExistingOrder("o-1", OrderStatus.SCHEDULED, 100, 0);
        order.setUpdatedAt(LocalDateTime.now());

        when(orderRepository.findById("o-1")).thenReturn(Optional.of(order));
        when(productionSlotRepository.findByOrderId("o-1")).thenReturn(List.of());
        when(orderRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(customerRepository.findById(any())).thenReturn(Optional.empty());

        OrderUpdateRequest req = buildUpdateRequest(200, LocalDate.now().plusDays(7));
        // 注意：req.updatedAt 為 null
        assertDoesNotThrow(() -> orderService.updateOrder("o-1", req));
    }

    @Test
    void updateOrder_writesHistorySnapshotWithModifiedChangeType() {
        Order order = buildExistingOrder("o-1", OrderStatus.SCHEDULED, 100, 0);
        when(orderRepository.findById("o-1")).thenReturn(Optional.of(order));
        when(productionSlotRepository.findByOrderId("o-1")).thenReturn(List.of());
        when(orderRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(customerRepository.findById(any())).thenReturn(Optional.empty());

        orderService.updateOrder("o-1", buildUpdateRequest(200, LocalDate.now().plusDays(7)));

        ArgumentCaptor<com.semiconductor.woms.backend.model.OrderHistory> captor =
                ArgumentCaptor.forClass(com.semiconductor.woms.backend.model.OrderHistory.class);
        verify(orderHistoryRepository).save(captor.capture());
        assertEquals("o-1", captor.getValue().getOrderId());
        assertEquals(com.semiconductor.woms.backend.model.enums.ChangeType.MODIFIED,
                captor.getValue().getChangeType());
        // 快照應為「修改前」的數量
        assertEquals(100, captor.getValue().getSnapshotQuantity());
    }

    @Test
    void cancelOrder_writesHistorySnapshotWithCancelledChangeType() {
        Order order = buildExistingOrder("o-1", OrderStatus.SCHEDULED, 500, 0);
        when(orderRepository.findById("o-1")).thenReturn(Optional.of(order));
        when(productionSlotRepository.findByOrderId("o-1")).thenReturn(List.of());
        when(orderRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        orderService.cancelOrder("o-1");

        ArgumentCaptor<com.semiconductor.woms.backend.model.OrderHistory> captor =
                ArgumentCaptor.forClass(com.semiconductor.woms.backend.model.OrderHistory.class);
        verify(orderHistoryRepository).save(captor.capture());
        assertEquals(com.semiconductor.woms.backend.model.enums.ChangeType.CANCELLED,
                captor.getValue().getChangeType());
        // 快照保留取消「前」的狀態
        assertEquals("SCHEDULED", captor.getValue().getSnapshotStatus());
    }

    // ── getOrderSlots / getOrderHistory 邊界 ──────────────────────────────────

    @Test
    void getOrderSlots_throwsWhenOrderNotFound() {
        when(orderRepository.existsById("ghost")).thenReturn(false);
        assertThrows(RuntimeException.class, () -> orderService.getOrderSlots("ghost"));
        verify(productionSlotRepository, never()).findByOrderId(any());
    }

    @Test
    void getOrderSlots_returnsSlotsSortedBySlotDate() {
        when(orderRepository.existsById("o-1")).thenReturn(true);
        ProductionSlot later = buildSlot("factory-001", LocalDate.now().plusDays(5), 200);
        ProductionSlot earlier = buildSlot("factory-001", LocalDate.now().plusDays(1), 100);
        // 故意以亂序回傳，驗證 service 自己會排序
        when(productionSlotRepository.findByOrderId("o-1")).thenReturn(List.of(later, earlier));

        var slots = orderService.getOrderSlots("o-1");
        assertEquals(2, slots.size());
        assertEquals(LocalDate.now().plusDays(1), slots.get(0).getSlotDate());
        assertEquals(LocalDate.now().plusDays(5), slots.get(1).getSlotDate());
    }

    @Test
    void getOrderHistory_throwsWhenOrderNotFound() {
        when(orderRepository.existsById("ghost")).thenReturn(false);
        assertThrows(ResponseStatusException.class,
                () -> orderService.getOrderHistory("ghost"));
        verify(orderHistoryRepository, never()).findByOrderIdOrderByChangedAtDesc(any());
    }

    // ── getFilteredOrders / getOrderStats ────────────────────────────────────

    @Test
    void getFilteredOrders_viewDelayed_excludesCancelled() {
        // 規則：view=delayed 必須排除 CANCELLED（即使該訂單之前是 delayed）
        Order delayedScheduled = buildExistingOrder("o-d", OrderStatus.SCHEDULED, 100, 0);
        delayedScheduled.setIsDelayed(true);
        Order delayedButCancelled = buildExistingOrder("o-c", OrderStatus.CANCELLED, 100, 0);
        delayedButCancelled.setIsDelayed(true);

        when(orderRepository.findAll(any(Sort.class)))
                .thenReturn(List.of(delayedScheduled, delayedButCancelled));
        when(customerRepository.findAll()).thenReturn(List.of());
        when(userRepository.findAll()).thenReturn(List.of());

        List<OrderResponse> result = orderService.getFilteredOrders(
                null, null, null, null, null, "delayed");

        assertEquals(1, result.size());
        assertEquals("o-d", result.get(0).getId());
    }

    @Test
    void getFilteredOrders_viewInProduction_returnsOnlyInProduction() {
        Order inProd = buildExistingOrder("o-p", OrderStatus.IN_PRODUCTION, 100, 50);
        Order pending = buildExistingOrder("o-x", OrderStatus.PENDING, 100, 100);

        when(orderRepository.findAll(any(Sort.class))).thenReturn(List.of(inProd, pending));
        when(customerRepository.findAll()).thenReturn(List.of());
        when(userRepository.findAll()).thenReturn(List.of());

        List<OrderResponse> result = orderService.getFilteredOrders(
                null, null, null, null, null, "in_production");

        assertEquals(1, result.size());
        assertEquals("o-p", result.get(0).getId());
    }

    @Test
    void getFilteredOrders_statusFilter_returnsOnlyMatching() {
        Order pending = buildExistingOrder("o-1", OrderStatus.PENDING, 100, 100);
        Order scheduled = buildExistingOrder("o-2", OrderStatus.SCHEDULED, 100, 0);

        when(orderRepository.findAll(any(Sort.class))).thenReturn(List.of(pending, scheduled));
        when(customerRepository.findAll()).thenReturn(List.of());
        when(userRepository.findAll()).thenReturn(List.of());

        List<OrderResponse> result = orderService.getFilteredOrders(
                null, null, "SCHEDULED", null, null, null);

        assertEquals(1, result.size());
        assertEquals("o-2", result.get(0).getId());
    }

    @Test
    void getFilteredOrders_statusAll_returnsAllRegardlessOfStatus() {
        // status 為 "ALL" 在 controller 約定下相當於不過濾
        Order pending = buildExistingOrder("o-1", OrderStatus.PENDING, 100, 100);
        Order cancelled = buildExistingOrder("o-2", OrderStatus.CANCELLED, 100, 100);

        when(orderRepository.findAll(any(Sort.class))).thenReturn(List.of(pending, cancelled));
        when(customerRepository.findAll()).thenReturn(List.of());
        when(userRepository.findAll()).thenReturn(List.of());

        List<OrderResponse> result = orderService.getFilteredOrders(
                null, null, "ALL", null, null, null);
        assertEquals(2, result.size());
    }

    @Test
    void getOrderStats_excludesCancelledFromTotalWafers() {
        // 規則：totalWafers 只統計未取消的訂單
        Order a = buildExistingOrder("a", OrderStatus.SCHEDULED, 100, 0);
        Order b = buildExistingOrder("b", OrderStatus.IN_PRODUCTION, 200, 50);
        b.setIsDelayed(true);
        Order c = buildExistingOrder("c", OrderStatus.CANCELLED, 300, 300);

        when(orderRepository.findAll()).thenReturn(List.of(a, b, c));

        OrderStatsResponse stats = orderService.getOrderStats();
        assertEquals(3, stats.getTotal());
        assertEquals(1, stats.getInProduction());
        assertEquals(1, stats.getDelayed(),
                "CANCELLED + isDelayed 的訂單不應被視為延誤");
        assertEquals(300L, stats.getTotalWafers(),
                "CANCELLED 訂單的 quantity 不應計入 totalWafers");
    }

    // ── 輔助方法 ───────────────────────────────────────────────────────────────

    private OrderRequest buildCreateRequest(int quantity, LocalDate dueDate) {
        OrderRequest req = new OrderRequest();
        req.setFactoryId("FAB-001");
        req.setWaferTypeId("WT-001");
        req.setCustomerId("CUST-001");
        req.setQuantity(quantity);
        req.setCustomerDueDate(dueDate);
        return req;
    }

    private OrderUpdateRequest buildUpdateRequest(int quantity, LocalDate dueDate) {
        OrderUpdateRequest req = new OrderUpdateRequest();
        req.setQuantity(quantity);
        req.setCustomerDueDate(dueDate);
        return req;
    }

    private Order buildExistingOrder(String id, OrderStatus status, int quantity, int remainingQty) {
        Order o = new Order();
        o.setId(id);
        o.setFactoryId("factory-001");
        o.setWaferTypeId("WT-001");
        o.setCustomerId("CUST-001");
        o.setCreatedBy("user-001");
        o.setQuantity(quantity);
        o.setRemainingQuantity(remainingQty);
        o.setStatus(status);
        o.setCustomerDueDate(LocalDate.now().plusDays(10));
        o.setIsDelayed(false);
        o.setDelayDays(0);
        o.setVersion(0);
        o.setCreatedAt(LocalDateTime.now().minusMinutes(30));
        o.setUpdatedAt(LocalDateTime.now().minusMinutes(30));
        return o;
    }

    private ProductionSlot buildSlot(String factoryId, LocalDate date, int quantity) {
        ProductionSlot slot = new ProductionSlot();
        slot.setFactoryId(factoryId);
        slot.setSlotDate(date);
        slot.setQuantity(quantity);
        return slot;
    }

    private Customer buildCustomer(String id) {
        Customer c = new Customer();
        c.setId(id);
        c.setCustomerCode("CODE-001");
        c.setName("Test Customer");
        return c;
    }
}
