package com.semiconductor.woms.backend.service;

import com.semiconductor.woms.backend.dto.OrderRequest;
import com.semiconductor.woms.backend.model.Customer;
import com.semiconductor.woms.backend.model.Order;
import com.semiconductor.woms.backend.model.User;
import com.semiconductor.woms.backend.model.enums.OrderStatus;
import com.semiconductor.woms.backend.model.enums.UserType;
import com.semiconductor.woms.backend.repository.CustomerRepository;
import com.semiconductor.woms.backend.repository.OrderRepository;
import com.semiconductor.woms.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
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
    private final UserRepository userRepository;
    private final TransactionTemplate tx;

    @Autowired
    OrderServiceDbIntegrationTest(
            OrderService orderService,
            OrderRepository orderRepository,
            CustomerRepository customerRepository,
            UserRepository userRepository,
            PlatformTransactionManager txManager
    ) {
        this.orderService = orderService;
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.tx = new TransactionTemplate(txManager);
    }

    @BeforeEach
    void setupTestUser() {
        if (userRepository.findByUsername("testadmin").isEmpty()) {
            User admin = new User();
            admin.setId("testadmin-" + UUID.randomUUID());
            admin.setUsername("testadmin");
            admin.setPasswordHash("$2a$10$notUsedInTests");
            admin.setRole(UserType.ADMIN);
            admin.setCreatedAt(LocalDateTime.now());
            userRepository.save(admin);
        }
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
    @WithMockUser(username = "testadmin", authorities = "ADMIN")
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

        assertTrue(cancelled.getVersion() > versionAfterCreate, "Expected version to increment");
        assertTrue(cancelled.getUpdatedAt().isAfter(updatedAtAfterCreate) || cancelled.getUpdatedAt().isEqual(updatedAtAfterCreate));
    }

    @Test
    @WithMockUser(username = "testadmin", authorities = "ADMIN")
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
