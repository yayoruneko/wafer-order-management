package com.semiconductor.woms.backend.service;

import com.semiconductor.woms.backend.dto.OrderRequest;
import com.semiconductor.woms.backend.dto.OrderResponse;
import com.semiconductor.woms.backend.model.Customer;
import com.semiconductor.woms.backend.model.Order;
import com.semiconductor.woms.backend.model.SchedulingAction;
import com.semiconductor.woms.backend.model.enums.OrderStatus;
import com.semiconductor.woms.backend.repository.CustomerRepository;
import com.semiconductor.woms.backend.repository.OrderRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
    private SchedulingQueueService schedulingQueueService;

    @InjectMocks
    private OrderService orderService;

    @Test
    void createOrder_rejectsQuantityBelowMin() {
        OrderRequest req = new OrderRequest();
        req.setFactoryId("FAB-001");
        req.setWaferTypeId("WT-001");
        req.setCustomerId("CUST-001");
        req.setQuantity(24);
        req.setCustomerDueDate(LocalDate.now().plusDays(1));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> orderService.createOrder(req));
        assertTrue(ex.getMessage().contains("25"));
        verifyNoInteractions(orderRepository);
    }

    @Test
    void createOrder_rejectsPastDueDate() {
        OrderRequest req = new OrderRequest();
        req.setFactoryId("FAB-001");
        req.setWaferTypeId("WT-001");
        req.setCustomerId("CUST-001");
        req.setQuantity(100);
        req.setCustomerDueDate(LocalDate.now().minusDays(1));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> orderService.createOrder(req));
        assertTrue(ex.getMessage().contains("交期"));
        verifyNoInteractions(orderRepository);
    }

    @Test
    void createOrder_savesOrderAndReturnsResponse() {
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
            // Simulate what JPA would set via @PrePersist.
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
        assertEquals("user-admin-001", saved.getCreatedBy());
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
}
