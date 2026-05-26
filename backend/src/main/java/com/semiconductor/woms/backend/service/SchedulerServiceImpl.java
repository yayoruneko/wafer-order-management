package com.semiconductor.woms.backend.service;

import com.semiconductor.woms.backend.model.DailyCapacityUsage;
import com.semiconductor.woms.backend.model.Order;
import com.semiconductor.woms.backend.model.ProductionSlot;
import com.semiconductor.woms.backend.model.enums.OrderStatus;
import com.semiconductor.woms.backend.repository.DailyCapacityUsageRepository;
import com.semiconductor.woms.backend.repository.OrderRepository;
import com.semiconductor.woms.backend.repository.ProductionSlotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SchedulerServiceImpl implements SchedulerService {

    private static final int MAX_LOOKAHEAD_DAYS = 90;
    private static final int DAILY_CAPACITY = 10000;

    private final DailyCapacityUsageRepository capacityRepo;
    private final ProductionSlotRepository slotRepo;
    private final OrderRepository orderRepo;

    @Override
    @Transactional
    public ScheduleResult scheduleOrder(String orderId) {
        var order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        // Idempotency guard. A SCHEDULE_ORDER task can race with a RESCHEDULE_ALL
        // task that already handled this order: the queued SCHEDULE_ORDER then fires
        // on an already-scheduled (or cancelled / in-production / completed) order
        // with remainingQuantity == 0. Treat it as a no-op rather than crashing on
        // the empty `slots` list at `slots.get(slots.size() - 1)` below.
        if (order.getStatus() != OrderStatus.PENDING) {
            List<ProductionSlot> existing = slotRepo.findByOrderId(orderId);
            return ScheduleResult.success(orderId, existing,
                    Boolean.TRUE.equals(order.getIsDelayed()));
        }

        int remaining = order.getRemainingQuantity();
        LocalDate cursor = LocalDate.now().plusDays(1);
        LocalDate deadline = cursor.plusDays(MAX_LOOKAHEAD_DAYS);
        List<ProductionSlot> slots = new ArrayList<>();

        // 逐天找剩餘產能，填入 slot
        while (remaining > 0 && !cursor.isAfter(deadline)) {
            int available = getAvailableCapacity(order.getFactoryId(), cursor);
            if (available > 0) {
                int toSchedule = Math.min(available, remaining);

                ProductionSlot slot = new ProductionSlot();
                slot.setOrderId(orderId);
                slot.setFactoryId(order.getFactoryId());
                slot.setSlotDate(cursor);
                slot.setQuantity(toSchedule);
                slots.add(slot);

                updateCapacityUsage(order.getFactoryId(), cursor, toSchedule);
                remaining -= toSchedule;
            }
            cursor = cursor.plusDays(1);
        }

        // 90天內產能不足
        if (remaining > 0) {
            order.setRemainingQuantity(remaining);
            order.setScheduleWarning("90 天內總產能不足，目前最早可完成日為 " + cursor);
            orderRepo.save(order);
            return ScheduleResult.unschedulable(orderId);
        }

        // 儲存所有 slot
        slotRepo.saveAll(slots);

        LocalDate lastSlotDate = slots.get(slots.size() - 1).getSlotDate();
        boolean isDelayed = lastSlotDate.isAfter(order.getCustomerDueDate());
        int delayDays = isDelayed
                ? (int) ChronoUnit.DAYS.between(order.getCustomerDueDate(), lastSlotDate)
                : 0;

        order.setRemainingQuantity(0);
        order.setLastSlotDate(lastSlotDate);
        order.setExpectedDueDate(lastSlotDate);
        order.setIsDelayed(isDelayed);
        order.setDelayDays(delayDays);
        order.setScheduleWarning(isDelayed
                ? "排程日 " + lastSlotDate + " 晚於客戶要求交期 "
                  + order.getCustomerDueDate() + "，延誤 " + delayDays + " 天"
                : null);
        order.setStatus(OrderStatus.SCHEDULED);
        orderRepo.save(order);

        return ScheduleResult.success(orderId, slots, isDelayed);
    }

    @Override
    @Transactional
    public void rescheduleAll() {
        // 1. 抓 PENDING + SCHEDULED 訂單，依 EDD 升序、相同交期按 createdAt FIFO 排序
        List<Order> orders = orderRepo
                .findByStatusIn(List.of(OrderStatus.PENDING, OrderStatus.SCHEDULED))
                .stream()
                .sorted(Comparator.comparing(Order::getCustomerDueDate)
                        .thenComparing(Order::getCreatedAt))
                .toList();

        if (orders.isEmpty()) return;

        // 2. 釋放所有 SCHEDULED 訂單的 slot，歸還產能，重置為 PENDING
        for (Order order : orders) {
            if (order.getStatus() == OrderStatus.SCHEDULED) {
                List<ProductionSlot> slots = slotRepo.findByOrderId(order.getId());
                for (ProductionSlot slot : slots) {
                    decrementCapacityUsage(slot.getFactoryId(), slot.getSlotDate(), slot.getQuantity());
                }
                slotRepo.deleteByOrderId(order.getId());

                order.setRemainingQuantity(order.getQuantity());
                order.setStatus(OrderStatus.PENDING);
                order.setLastSlotDate(null);
                order.setExpectedDueDate(null);
                order.setIsDelayed(false);
                order.setDelayDays(0);
                order.setScheduleWarning(null);
                orderRepo.save(order);
            }
        }

        // 3. 依 EDD+FIFO 順序逐筆重新排程
        for (Order order : orders) {
            scheduleOrder(order.getId());
        }
    }

    @Override
    public void releaseCapacity(String factoryId, LocalDate date, int quantity) {
        decrementCapacityUsage(factoryId, date, quantity);
    }

    @Override
    @Transactional
    public void updateOrderStatusesByDate() {
        LocalDate today = LocalDate.now();

        // SCHEDULED → IN_PRODUCTION：有 slot 日期 <= 今天，代表生產已開始
        List<String> startedOrderIds = slotRepo.findOrderIdsWithSlotsOnOrBefore(today);
        if (!startedOrderIds.isEmpty()) {
            orderRepo.findByStatusIn(List.of(OrderStatus.SCHEDULED)).stream()
                    .filter(o -> startedOrderIds.contains(o.getId()))
                    .forEach(o -> {
                        o.setStatus(OrderStatus.IN_PRODUCTION);
                        orderRepo.save(o);
                    });
        }

        // IN_PRODUCTION → COMPLETED：lastSlotDate < 今天，代表所有生產批次已完成
        orderRepo.findByStatus(OrderStatus.IN_PRODUCTION).stream()
                .filter(o -> o.getLastSlotDate() != null && o.getLastSlotDate().isBefore(today))
                .forEach(o -> {
                    o.setStatus(OrderStatus.COMPLETED);
                    orderRepo.save(o);
                });
    }

    @Override
    public int getAvailableCapacity(String factoryId, LocalDate date) {
        return capacityRepo.findByFactoryIdAndSlotDate(factoryId, date)
                .map(usage -> DAILY_CAPACITY - usage.getUsedQuantity())
                .orElse(DAILY_CAPACITY);
    }

    // 更新每日產能使用量（加）
    private void updateCapacityUsage(String factoryId, LocalDate date, int quantity) {
        DailyCapacityUsage usage = capacityRepo
                .findByFactoryIdAndSlotDate(factoryId, date)
                .orElseGet(() -> {
                    DailyCapacityUsage u = new DailyCapacityUsage();
                    u.setFactoryId(factoryId);
                    u.setSlotDate(date);
                    u.setUsedQuantity(0);
                    return u;
                });
        usage.setUsedQuantity(usage.getUsedQuantity() + quantity);
        capacityRepo.save(usage);
    }

    // 歸還產能（減）：釋放 slot 時呼叫
    private void decrementCapacityUsage(String factoryId, LocalDate date, int quantity) {
        capacityRepo.findByFactoryIdAndSlotDate(factoryId, date).ifPresent(usage -> {
            int newUsed = usage.getUsedQuantity() - quantity;
            if (newUsed <= 0) {
                capacityRepo.delete(usage);
            } else {
                usage.setUsedQuantity(newUsed);
                capacityRepo.save(usage);
            }
        });
    }
}