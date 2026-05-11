package com.semiconductor.woms.backend.service;

import com.semiconductor.woms.backend.dto.OrderRequest;
import com.semiconductor.woms.backend.model.Customer;
import com.semiconductor.woms.backend.model.Order;
import com.semiconductor.woms.backend.model.enums.OrderStatus;
import com.semiconductor.woms.backend.repository.CustomerRepository;
import com.semiconductor.woms.backend.repository.OrderRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class OrderServiceDbIntegrationTest {

    private final OrderService orderService;
    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final TransactionTemplate tx;

    @Autowired
    OrderServiceDbIntegrationTest(
            OrderService orderService,
            OrderRepository orderRepository,
            CustomerRepository customerRepository,
            PlatformTransactionManager txManager
    ) {
        this.orderService = orderService;
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.tx = new TransactionTemplate(txManager);
    }

    private String createCustomerAndReturnId() {
        return tx.execute(status -> {
            Customer customer = new Customer();
            customer.setCustomerCode("CUST-IT-" + UUID.randomUUID());
            customer.setName("Integration Test Customer");
            customer.setIsActive(true);
            return customerRepository.save(customer).getId();
        });
    }

    private static OrderRequest newValidRequest(String customerId) {
        OrderRequest req = new OrderRequest();
        req.setFactoryId("FAB-IT");
        req.setWaferTypeId("WT-IT");
        req.setCustomerId(customerId);
        req.setQuantity(100);
        req.setCustomerDueDate(LocalDate.now().plusDays(10));
        return req;
    }

    @Test
    void createOrder_thenCancel_persistsStateTransitionsAndUpdatesVersion() {
        String customerId = createCustomerAndReturnId();
        String id = tx.execute(status -> orderService.createOrder(newValidRequest(customerId)).getId());
        assertNotNull(id);

        Integer versionAfterCreate = tx.execute(status -> orderRepository.findById(id).orElseThrow().getVersion());
        LocalDateTime updatedAtAfterCreate = tx.execute(status -> orderRepository.findById(id).orElseThrow().getUpdatedAt());

        tx.execute(status -> {
            orderService.cancelOrder(id);
            return null;
        });

        Order cancelled = tx.execute(status -> orderRepository.findById(id).orElseThrow());
        assertNotNull(cancelled);
        assertEquals(OrderStatus.CANCELLED, cancelled.getStatus());
        assertEquals(OrderStatus.PENDING, cancelled.getCancelledFromStatus());
        assertNotNull(cancelled.getUpdatedAt());

        // Version should bump on update (exact increment depends on provider, but it must be > previous).
        assertTrue(cancelled.getVersion() > versionAfterCreate, "Expected version to increment");
        assertTrue(cancelled.getUpdatedAt().isAfter(updatedAtAfterCreate) || cancelled.getUpdatedAt().isEqual(updatedAtAfterCreate));
    }

    @Test
    void createOrder_persistsDefaultsAndCanBeReloaded() {
        String customerId = createCustomerAndReturnId();
        String id = tx.execute(status -> orderService.createOrder(newValidRequest(customerId)).getId());

        Order reloaded = tx.execute(status -> orderRepository.findById(id).orElseThrow());
        assertNotNull(reloaded.getId());
        assertEquals(100, reloaded.getQuantity());
        assertEquals(100, reloaded.getRemainingQuantity());
        assertEquals(OrderStatus.PENDING, reloaded.getStatus());
        assertNotNull(reloaded.getCreatedAt());
        assertNotNull(reloaded.getUpdatedAt());
        assertEquals(0, reloaded.getVersion());
    }
}
