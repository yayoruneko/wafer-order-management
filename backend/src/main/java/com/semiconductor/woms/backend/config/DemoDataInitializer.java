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

        // ── 1. COMPLETED orders (歷史訂單) ────────────────────────────────
        // {customerId, qty, dueDateOffset, lastSlotOffset}
        Object[][] completedSeeds = {
            {"customer-001", 2000, -35, -38},  // NVIDIA, finished early
            {"customer-002", 2500, -28, -30},  // AMD, finished early
            {"customer-003", 1500, -20, -21},  // Qualcomm, finished 1 day early
            {"customer-004", 2000, -14, -13},  // Apple, 1 day late
            {"customer-005", 1800,  -8,  -9},  // MTK, finished 1 day early
        };
        int[][][] completedSlots = {
            {{-40, 1000}, {-39, 700}, {-38, 300}},
            {{-32, 1000}, {-31, 1000}, {-30, 500}},
            {{-23, 800}, {-22, 400}, {-21, 300}},
            {{-16, 1000}, {-14, 700}, {-13, 300}},
            {{-12, 900}, {-10, 600}, {-9, 300}},
        };
        for (int i = 0; i < completedSeeds.length; i++) {
            Object[] seed = completedSeeds[i];
            LocalDate due      = today.plusDays((Integer) seed[2]);
            LocalDate lastSlot = today.plusDays((Integer) seed[3]);
            Order order = new Order();
            order.setFactoryId("factory-001");
            order.setWaferTypeId("wafer-type-001");
            order.setCustomerId((String) seed[0]);
            order.setCreatedBy("user-admin-001");
            order.setQuantity((Integer) seed[1]);
            order.setCustomerDueDate(due);
            order.setStatus(OrderStatus.PENDING);
            order = orderRepository.save(order);
            order.setStatus(OrderStatus.COMPLETED);
            order.setRemainingQuantity(0);
            order.setExpectedDueDate(lastSlot);
            order.setLastSlotDate(lastSlot);
            boolean late = lastSlot.isAfter(due);
            order.setIsDelayed(late);
            order.setDelayDays(late ? (int)(lastSlot.toEpochDay() - due.toEpochDay()) : 0);
            Order saved = orderRepository.save(order);
            for (int[] s : completedSlots[i]) {
                ProductionSlot slot = new ProductionSlot();
                slot.setOrderId(saved.getId());
                slot.setFactoryId("factory-001");
                slot.setSlotDate(today.plusDays(s[0]));
                slot.setQuantity(s[1]);
                productionSlotRepository.save(slot);
            }
        }

        // ── 2. IN_PRODUCTION orders (生產中) ──────────────────────────────
        // lastSlotDate = today → updateOrderStatusesByDate 不會轉成 COMPLETED
        // (轉換條件是 lastSlotDate < today，等號不觸發)
        // {customerId, qty, customerDueDateOffset}
        Object[][] inProdSeeds = {
            {"customer-001", 2000,  +5},  // NVIDIA, 進度正常
            {"customer-002", 2500,  +3},  // AMD, 進度正常
            {"customer-003", 1200,  -1},  // Qualcomm, 已逾期但仍在生產
            {"customer-004", 1800,  +8},  // Apple, 進度正常
        };
        int[][][] inProdSlots = {
            {{-3, 500}, {-2, 500}, {-1, 500}, {0, 500}},   // 2000 total
            {{-4, 1000}, {-2, 1000}, {0, 500}},             // 2500 total
            {{-3, 400}, {-1, 400}, {0, 400}},               // 1200 total (delayed)
            {{-2, 600}, {-1, 600}, {0, 600}},               // 1800 total
        };
        for (int i = 0; i < inProdSeeds.length; i++) {
            Object[] seed = inProdSeeds[i];
            LocalDate due = today.plusDays((Integer) seed[2]);
            Order order = new Order();
            order.setFactoryId("factory-001");
            order.setWaferTypeId("wafer-type-001");
            order.setCustomerId((String) seed[0]);
            order.setCreatedBy("user-admin-001");
            order.setQuantity((Integer) seed[1]);
            order.setCustomerDueDate(due);
            order.setStatus(OrderStatus.PENDING);
            order = orderRepository.save(order);
            order.setStatus(OrderStatus.IN_PRODUCTION);
            order.setRemainingQuantity(0);
            order.setExpectedDueDate(today);
            order.setLastSlotDate(today);
            boolean late = today.isAfter(due);
            order.setIsDelayed(late);
            order.setDelayDays(late ? (int)(today.toEpochDay() - due.toEpochDay()) : 0);
            Order saved = orderRepository.save(order);
            for (int[] s : inProdSlots[i]) {
                ProductionSlot slot = new ProductionSlot();
                slot.setOrderId(saved.getId());
                slot.setFactoryId("factory-001");
                slot.setSlotDate(today.plusDays(s[0]));
                slot.setQuantity(s[1]);
                productionSlotRepository.save(slot);
            }
        }

        // ── 3. PENDING – 緊湊訂單群 (容量溢出 → 排程後產生 3 筆 DELAYED) ──
        // 5 筆 due +1 天 + 5 筆 due +2 天，每筆 2500 片 = 共 25,000 片
        // 每日產能 10,000 → 2 天只能排 20,000 → 最後 3 筆溢出至第 3 天 (DELAYED)
        Object[][] tightSeeds = {
            {"customer-005", 2500, +1},
            {"customer-001", 2500, +1},
            {"customer-002", 2500, +1},
            {"customer-003", 2500, +1},
            {"customer-004", 2500, +1},
            {"customer-005", 2500, +2},
            {"customer-001", 2500, +2},
            {"customer-002", 2500, +2},
            {"customer-003", 2500, +2},
            {"customer-004", 2500, +2},
        };

        // ── 4. PENDING – 錯落分布在行事曆 (+8 到 +62 天) ─────────────────
        Object[][] spreadSeeds = {
            // 近期 (+8 to +14)
            {"customer-001", 2000,  +8},
            {"customer-002", 1500,  +9},
            {"customer-003", 2500, +10},
            {"customer-004", 2000, +12},
            {"customer-005", 1800, +14},
            // 中期 (+15 to +28)
            {"customer-001", 2500, +15},
            {"customer-002", 1200, +17},
            {"customer-003", 2000, +19},
            {"customer-004", 2500, +21},
            {"customer-005", 1500, +24},
            {"customer-001", 2000, +26},
            {"customer-002", 2500, +28},
            // 中後期 (+30 to +45)
            {"customer-003", 1800, +30},
            {"customer-004", 2000, +32},
            {"customer-005", 2500, +35},
            {"customer-001", 1500, +37},
            {"customer-002", 2000, +39},
            {"customer-003", 2500, +41},
            {"customer-004", 1800, +43},
            {"customer-005", 2000, +45},
            // 遠期 (+48 to +62)
            {"customer-001", 2500, +48},
            {"customer-002", 1800, +51},
            {"customer-003", 2000, +54},
            {"customer-004", 2500, +57},
            {"customer-005", 1200, +62},
        };

        for (Object[] seed : tightSeeds) {
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

        for (Object[] seed : spreadSeeds) {
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

        // 單次 RESCHEDULE_ALL：以 EDD 最佳排序一次性完成排程
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
