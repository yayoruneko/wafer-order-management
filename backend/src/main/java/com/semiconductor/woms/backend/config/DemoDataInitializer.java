package com.semiconductor.woms.backend.config;

import com.semiconductor.woms.backend.model.Order;
import com.semiconductor.woms.backend.model.SchedulingAction;
import com.semiconductor.woms.backend.model.User;
import com.semiconductor.woms.backend.model.enums.OrderStatus;
import com.semiconductor.woms.backend.model.enums.UserType;
import com.semiconductor.woms.backend.repository.OrderRepository;
import com.semiconductor.woms.backend.repository.UserRepository;
import com.semiconductor.woms.backend.service.SchedulingQueueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
public class DemoDataInitializer implements CommandLineRunner {

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private OrderRepository orderRepository;
    @Autowired private SchedulingQueueService schedulingQueueService;

    @Override
    public void run(String... args) {
        createIfAbsent("user-super-001", "superadmin", "password", UserType.SUPER_ADMIN);
        createIfAbsent("user-admin-001", "admin",      "password", UserType.ADMIN);
        createIfAbsent("user-viewer-001", "viewer",    "password", UserType.VIEWER);
        seedOrdersIfEmpty();
    }

    private void seedOrdersIfEmpty() {
        if (orderRepository.count() > 0) return;

        // Seed a few IN_PRODUCTION orders (past due dates, already being produced)
        Object[][] inProdSeeds = {
            {"customer-001", 2500, "2026-05-10"},
            {"customer-002", 2000, "2026-05-13"},
            {"customer-003", 1500, "2026-05-16"},
        };
        for (Object[] seed : inProdSeeds) {
            Order order = new Order();
            order.setFactoryId("factory-001");
            order.setWaferTypeId("wafer-type-001");
            order.setCustomerId((String) seed[0]);
            order.setCreatedBy("user-admin-001");
            order.setQuantity((Integer) seed[1]);
            order.setCustomerDueDate(LocalDate.parse((String) seed[2]));
            order.setStatus(OrderStatus.PENDING);
            order = orderRepository.save(order);
            order.setStatus(OrderStatus.IN_PRODUCTION);
            order.setExpectedDueDate(LocalDate.parse((String) seed[2]));
            order.setLastSlotDate(LocalDate.parse((String) seed[2]));
            orderRepository.save(order);
        }

        // {customerId, qty, dueDate}
        // Group A: 5 orders due 05/19 (today) — 4 fit in day-1 capacity, 5th overflows → DELAYED
        // Group B: 4 orders due 05/20 — overflow from A fills day-2, 1 overflows → DELAYED
        // Groups C-G: comfortable due dates spread across late May to June
        Object[][] seeds = {
            {"customer-001", 2500, "2026-05-19"},
            {"customer-002", 2500, "2026-05-19"},
            {"customer-003", 2500, "2026-05-19"},
            {"customer-004", 2500, "2026-05-19"},
            {"customer-005", 2500, "2026-05-19"}, // DELAYED: overflows to 05/20
            {"customer-001", 2500, "2026-05-20"},
            {"customer-002", 2500, "2026-05-20"},
            {"customer-003", 2500, "2026-05-20"},
            {"customer-004", 2500, "2026-05-20"}, // DELAYED: overflows to 05/21
            {"customer-005", 1500, "2026-05-23"},
            {"customer-001", 2000, "2026-05-25"},
            {"customer-002", 1800, "2026-05-27"},
            {"customer-003", 1200, "2026-05-29"},
            {"customer-004", 2500, "2026-05-31"},
            {"customer-005", 2000, "2026-06-03"},
            {"customer-001", 2500, "2026-06-06"},
            {"customer-002", 1500, "2026-06-09"},
            {"customer-003", 2000, "2026-06-12"},
            {"customer-004", 2500, "2026-06-16"},
            {"customer-005", 1000, "2026-06-19"},
            {"customer-001", 2500, "2026-06-22"},
            {"customer-002", 1800, "2026-06-24"},
            {"customer-003", 2000, "2026-06-26"},
            {"customer-004", 2500, "2026-06-28"},
            {"customer-005", 1200, "2026-06-30"},
        };

        for (Object[] seed : seeds) {
            Order order = new Order();
            order.setFactoryId("factory-001");
            order.setWaferTypeId("wafer-type-001");
            order.setCustomerId((String) seed[0]);
            order.setCreatedBy("user-admin-001");
            order.setQuantity((Integer) seed[1]);
            order.setCustomerDueDate(LocalDate.parse((String) seed[2]));
            order.setStatus(OrderStatus.PENDING);
            order = orderRepository.save(order);
            schedulingQueueService.enqueue(order.getId(), SchedulingAction.SCHEDULE_ORDER);
        }
    }

    private void createIfAbsent(String id, String username, String password, UserType role) {
        if (userRepository.findByUsername(username).isPresent()) return;
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(role);
        user.setCreatedAt(LocalDateTime.now());
        userRepository.save(user);
    }
}
