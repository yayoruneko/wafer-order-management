package com.semiconductor.woms.backend.config;

import com.semiconductor.woms.backend.model.Order;
import com.semiconductor.woms.backend.model.ProductionSlot;
import com.semiconductor.woms.backend.model.User;
import com.semiconductor.woms.backend.model.enums.OrderStatus;
import com.semiconductor.woms.backend.model.enums.UserType;
import com.semiconductor.woms.backend.repository.OrderRepository;
import com.semiconductor.woms.backend.repository.ProductionSlotRepository;
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
    @Autowired private ProductionSlotRepository productionSlotRepository;
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

        LocalDate today = LocalDate.now();

        // A few IN_PRODUCTION orders (already being produced, no scheduler needed)
        // Each entry: {customerId, qty, daysFromToday}
        Object[][] inProdSeeds = {
            {"customer-001", 2500, -12},
            {"customer-002", 2000, -8},
            {"customer-003", 1500, -4},
        };
        // Matching slot splits: {dayOffset, slotQty} pairs per order
        int[][][] inProdSlots = {
            {{-14, 1000}, {-13, 1000}, {-12, 500}},
            {{-9,  1000}, {-8,  1000}},
            {{-5,  800},  {-4,  700}},
        };
        for (int i = 0; i < inProdSeeds.length; i++) {
            Object[] seed = inProdSeeds[i];
            Order order = new Order();
            order.setFactoryId("factory-001");
            order.setWaferTypeId("wafer-type-001");
            order.setCustomerId((String) seed[0]);
            order.setCreatedBy("user-admin-001");
            order.setQuantity((Integer) seed[1]);
            LocalDate due = today.plusDays((Integer) seed[2]);
            order.setCustomerDueDate(due);
            order.setStatus(OrderStatus.PENDING);
            order = orderRepository.save(order);
            order.setStatus(OrderStatus.IN_PRODUCTION);
            order.setRemainingQuantity(0);
            order.setExpectedDueDate(due);
            order.setLastSlotDate(due);
            Order savedOrder = orderRepository.save(order);
            for (int[] slotDef : inProdSlots[i]) {
                ProductionSlot slot = new ProductionSlot();
                slot.setOrderId(savedOrder.getId());
                slot.setFactoryId("factory-001");
                slot.setSlotDate(today.plusDays(slotDef[0]));
                slot.setQuantity(slotDef[1]);
                productionSlotRepository.save(slot);
            }
        }

        // PENDING orders with future due dates spread across ~10 weeks.
        // Using relative offsets from today so dates never go stale.
        // Max 4 orders per day (factory capacity = 10,000; max order = 2,500 → 4 fit per day).
        // Each due-date window is distinct enough to avoid capacity overflow at startup.
        Object[][] seeds = {
            // {customerId, qty, daysFromToday}
            {"customer-001", 2500,  6},
            {"customer-002", 2000,  8},
            {"customer-003", 1500, 10},
            {"customer-004", 2500, 11},
            {"customer-005", 2500, 13},
            {"customer-001", 2500, 15},
            {"customer-002", 2000, 17},
            {"customer-003", 1500, 19},
            {"customer-004", 2500, 21},
            {"customer-005", 2500, 23},
            {"customer-001", 2000, 25},
            {"customer-002", 1800, 27},
            {"customer-003", 1200, 29},
            {"customer-004", 2500, 31},
            {"customer-005", 2000, 33},
            {"customer-001", 2500, 36},
            {"customer-002", 1500, 39},
            {"customer-003", 2000, 42},
            {"customer-004", 2500, 45},
            {"customer-005", 1000, 48},
            {"customer-001", 2500, 51},
            {"customer-002", 1800, 54},
            {"customer-003", 2000, 57},
            {"customer-004", 2500, 60},
            {"customer-005", 1200, 63},
        };

        for (Object[] seed : seeds) {
            Order order = new Order();
            order.setFactoryId("factory-001");
            order.setWaferTypeId("wafer-type-001");
            order.setCustomerId((String) seed[0]);
            order.setCreatedBy("user-admin-001");
            order.setQuantity((Integer) seed[1]);
            order.setCustomerDueDate(today.plusDays((Integer) seed[2]));
            order.setStatus(OrderStatus.PENDING);
            orderRepository.save(order);
        }

        // Enqueue a single RESCHEDULE_ALL so the first scheduling pass
        // uses EDD-optimal order — no intermediate per-order delay states.
        schedulingQueueService.enqueueRescheduleAll();
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
