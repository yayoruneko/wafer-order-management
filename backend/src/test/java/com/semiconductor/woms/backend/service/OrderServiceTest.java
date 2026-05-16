package com.semiconductor.woms.backend.service;

import com.semiconductor.woms.backend.dto.OrderRequest;
import com.semiconductor.woms.backend.dto.OrderResponse;
import com.semiconductor.woms.backend.model.Customer;
import com.semiconductor.woms.backend.model.Order;
import com.semiconductor.woms.backend.model.SchedulingAction;
import com.semiconductor.woms.backend.model.User;
import com.semiconductor.woms.backend.model.enums.OrderStatus;
import com.semiconductor.woms.backend.repository.CustomerRepository;
import com.semiconductor.woms.backend.repository.OrderRepository;
import com.semiconductor.woms.backend.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
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

    @InjectMocks
    private OrderService orderService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    private void setupSecurityContext() {
        User user = new User();
        user.setId("test-user-id");
        user.setUsername("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));

        SecurityContext sc = SecurityContextHolder.createEmptyContext();
        sc.setAuthentication(new UsernamePasswordAuthenticationToken(
                "testuser", null, List.of(new SimpleGrantedAuthority("ADMIN"))));
        SecurityContextHolder.setContext(sc);
    }

    @Test
    void createOrder_rejectsQuantityBelowMin() {
        OrderRequest req = new OrderRequest();
        req.setFactoryId("FAB-001");
        req.setWaferTypeId("WT-001");
        req.setCustomerId("CUST-001");
        req.setQuantity(24);
        req.setCustomerDueDate(LocalDate.now().plusDays(1));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> orderService.createOrder(req));
        assertTrue(ex.getMessage().contains("25"));
        verifyNoInteractions(orderRepository);
    }

    @Test
    void createOrder_rejectsQuantityAboveMax() {
        OrderRequest req = new OrderRequest();
        req.setFactoryId("FAB-001");
        req.setWaferTypeId("WT-001");
        req.setCustomerId("CUST-001");
        req.setQuantity(2501);
        req.setCustomerDueDate(LocalDate.now().plusDays(1));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> orderService.createOrder(req));
        assertTrue(ex.getMessage().contains("2500"));
        verifyNoInteractions(orderRepository);
    }

    @Test
    void createOrder_rejectsUnknownCustomer() {
        OrderRequest req = new OrderRequest();
        req.setFactoryId("FAB-001");
        req.setWaferTypeId("WT-001");
        req.setCustomerId("NONEXISTENT");
        req.setQuantity(100);
        req.setCustomerDueDate(LocalDate.now().plusDays(1));

        when(customerRepository.findById("NONEXISTENT")).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> orderService.createOrder(req));
        assertTrue(ex.getMessage().contains("找不到此客戶"));
        verify(orderRepository, never()).save(any());
    }

    @Test
    void createOrder_rejectsPastDueDate() {
        OrderRequest req = new OrderRequest();
        req.setFactoryId("FAB-001");
        req.setWaferTypeId("WT-001");
        req.setCustomerId("CUST-001");
        req.setQuantity(100);
        req.setCustomerDueDate(LocalDate.now().minusDays(1));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> orderService.createOrder(req));
        assertTrue(ex.getMessage().contains("交期"));
        verifyNoInteractions(orderRepository);
    }

    @Test
    void createOrder_savesOrderAndReturnsResponse() {
        setupSecurityContext();

        OrderRequest req = new OrderRequest();
        req.setFactoryId("FAB-001");
        req.setWaferTypeId("WT-001");
        req.setCustomerId("CUST-001");
        req.setQuantity(100);
        req.setCustomerDueDate(LocalDate.now().plusDays(10));

        Customer customer = new Customer();
        customer.setId("CUST-001");
        customer.setCustomerCode("CODE-001");
        customer.setName("Test Customer");
        when(customerRepository.findById("CUST-001")).thenReturn(Optional.of(customer));

        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            if (o.getId() == null) o.setId("generated-id");
            if (o.getCreatedAt() == null) o.setCreatedAt(LocalDateTime.now());
            if (o.getUpdatedAt() == null) o.setUpdatedAt(o.getCreatedAt());
            if (o.getRemainingQuantity() == null) o.setRemainingQuantity(o.getQuantity());
            return o;
        });

        OrderResponse res = orderService.createOrder(req);

        assertNotNull(res);
        assertEquals("generated-id", res.getId());
        assertEquals("CUST-001", res.getCustomerId());
        assertEquals(100, res.getQuantity());
        assertEquals(100, res.getRemainingQuantity());
        assertEquals(OrderStatus.PENDING.name(), res.getStatus());
        assertEquals(req.getCustomerDueDate(), res.getCustomerDueDate());

        ArgumentCaptor<Order> captor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository, times(1)).save(captor.capture());
        Order saved = captor.getValue();
        assertEquals("FAB-001", saved.getFactoryId());
        assertEquals("WT-001", saved.getWaferTypeId());
        assertEquals("CUST-001", saved.getCustomerId());
        assertEquals(100, saved.getQuantity());
        assertEquals("test-user-id", saved.getCreatedBy());
        verify(schedulingQueueService).enqueue("generated-id", SchedulingAction.SCHEDULE_ORDER);
    }

    @Test
    void cancelOrder_setsCancelledFieldsAndPersists() {
        Order order = new Order();
        order.setId("o-1");
        order.setFactoryId("FAB-001");
        order.setWaferTypeId("WT-001");
        order.setCustomerId("CUST-001");
        order.setCreatedBy("user");
        order.setQuantity(100);
        order.setRemainingQuantity(100);
        order.setCustomerDueDate(LocalDate.now().plusDays(10));
        order.setStatus(OrderStatus.IN_PRODUCTION);

        when(orderRepository.findById("o-1")).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        orderService.cancelOrder("o-1");

        assertEquals(OrderStatus.CANCELLED, order.getStatus());
        assertEquals(OrderStatus.IN_PRODUCTION, order.getCancelledFromStatus());
        verify(orderRepository).save(order);
    }

    @Test
    void getOrderById_throwsWhenMissing() {
        when(orderRepository.findById("missing")).thenReturn(Optional.empty());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> orderService.getOrderById("missing"));
        assertTrue(ex.getMessage().contains("missing"));
    }

    // ── Boundary: exact min/max quantity ──────────────────────────────────────

    @Test
    void createOrder_acceptsExactMinimumQuantity() {
        setupSecurityContext();

        OrderRequest req = new OrderRequest();
        req.setFactoryId("FAB-001");
        req.setWaferTypeId("WT-001");
        req.setCustomerId("CUST-001");
        req.setQuantity(25);
        req.setCustomerDueDate(LocalDate.now().plusDays(1));

        Customer customer = new Customer();
        customer.setId("CUST-001");
        customer.setCustomerCode("C-001");
        customer.setName("Test");
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
        assertEquals(25, res.getRemainingQuantity());
    }

    @Test
    void createOrder_acceptsExactMaximumQuantity() {
        setupSecurityContext();

        OrderRequest req = new OrderRequest();
        req.setFactoryId("FAB-001");
        req.setWaferTypeId("WT-001");
        req.setCustomerId("CUST-001");
        req.setQuantity(2500);
        req.setCustomerDueDate(LocalDate.now().plusDays(1));

        Customer customer = new Customer();
        customer.setId("CUST-001");
        customer.setCustomerCode("C-001");
        customer.setName("Test");
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
    void createOrder_acceptsDueDateToday() {
        setupSecurityContext();

        // Validation is isBefore(now), so today is allowed.
        OrderRequest req = new OrderRequest();
        req.setFactoryId("FAB-001");
        req.setWaferTypeId("WT-001");
        req.setCustomerId("CUST-001");
        req.setQuantity(100);
        req.setCustomerDueDate(LocalDate.now());

        Customer customer = new Customer();
        customer.setId("CUST-001");
        customer.setCustomerCode("C-001");
        customer.setName("Test");
        when(customerRepository.findById("CUST-001")).thenReturn(Optional.of(customer));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            if (o.getId() == null) o.setId("id-today");
            if (o.getRemainingQuantity() == null) o.setRemainingQuantity(o.getQuantity());
            if (o.getCreatedAt() == null) o.setCreatedAt(LocalDateTime.now());
            if (o.getUpdatedAt() == null) o.setUpdatedAt(o.getCreatedAt());
            return o;
        });

        assertDoesNotThrow(() -> orderService.createOrder(req));
    }

    // ── createOrder: enqueue must NOT fire when validation fails ──────────────

    @Test
    void createOrder_doesNotEnqueueWhenCustomerNotFound() {
        OrderRequest req = new OrderRequest();
        req.setFactoryId("FAB-001");
        req.setWaferTypeId("WT-001");
        req.setCustomerId("GHOST");
        req.setQuantity(100);
        req.setCustomerDueDate(LocalDate.now().plusDays(5));

        when(customerRepository.findById("GHOST")).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> orderService.createOrder(req));
        verifyNoInteractions(schedulingQueueService);
    }

    // ── getAllOrders ───────────────────────────────────────────────────────────

    @Test
    void getAllOrders_returnsEmptyListWhenNoOrders() {
        when(orderRepository.findAll()).thenReturn(List.of());
        List<OrderResponse> result = orderService.getAllOrders();
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void getAllOrders_returnsMappedOrdersWithCustomerInfo() {
        Order order = new Order();
        order.setId("o-99");
        order.setFactoryId("FAB-001");
        order.setWaferTypeId("WT-001");
        order.setCustomerId("CUST-001");
        order.setQuantity(200);
        order.setRemainingQuantity(200);
        order.setCustomerDueDate(LocalDate.now().plusDays(5));
        order.setStatus(OrderStatus.PENDING);
        order.setIsDelayed(false);
        order.setDelayDays(0);
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());

        Customer customer = new Customer();
        customer.setId("CUST-001");
        customer.setCustomerCode("CODE-XYZ");
        customer.setName("XYZ Corp");

        when(orderRepository.findAll()).thenReturn(java.util.List.of(order));
        when(customerRepository.findById("CUST-001")).thenReturn(Optional.of(customer));

        List<OrderResponse> result = orderService.getAllOrders();

        assertEquals(1, result.size());
        assertEquals("o-99", result.get(0).getId());
        assertEquals("CODE-XYZ", result.get(0).getCustomerCode());
        assertEquals("XYZ Corp", result.get(0).getCustomerName());
    }

    // ── getOrderById happy path ───────────────────────────────────────────────

    @Test
    void getOrderById_returnsResponseForExistingOrder() {
        Order order = new Order();
        order.setId("o-42");
        order.setFactoryId("FAB-001");
        order.setWaferTypeId("WT-001");
        order.setCustomerId("CUST-001");
        order.setQuantity(150);
        order.setRemainingQuantity(150);
        order.setCustomerDueDate(LocalDate.now().plusDays(7));
        order.setStatus(OrderStatus.PENDING);
        order.setIsDelayed(false);
        order.setDelayDays(0);
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());

        when(orderRepository.findById("o-42")).thenReturn(Optional.of(order));
        when(customerRepository.findById("CUST-001")).thenReturn(Optional.empty());

        OrderResponse res = orderService.getOrderById("o-42");
        assertEquals("o-42", res.getId());
        assertEquals(150, res.getQuantity());
        assertEquals("PENDING", res.getStatus());
    }

    // ── cancelOrder: not found ────────────────────────────────────────────────

    @Test
    void cancelOrder_throwsWhenOrderNotFound() {
        when(orderRepository.findById("ghost-id")).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> orderService.cancelOrder("ghost-id"));
        verify(orderRepository, never()).save(any());
    }
}
