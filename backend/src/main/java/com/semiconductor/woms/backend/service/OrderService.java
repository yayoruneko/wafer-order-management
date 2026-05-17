package com.semiconductor.woms.backend.service;

import com.semiconductor.woms.backend.dto.OrderRequest;
import com.semiconductor.woms.backend.dto.OrderResponse;
import com.semiconductor.woms.backend.dto.OrderUpdateRequest;
import com.semiconductor.woms.backend.dto.OrderSlotResponse;
import com.semiconductor.woms.backend.model.Order;
import com.semiconductor.woms.backend.model.ProductionSlot;
import com.semiconductor.woms.backend.model.SchedulingAction;
import com.semiconductor.woms.backend.model.enums.OrderStatus;
import com.semiconductor.woms.backend.repository.CustomerRepository;
import com.semiconductor.woms.backend.repository.OrderRepository;
import com.semiconductor.woms.backend.repository.ProductionSlotRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private SchedulingQueueService schedulingQueueService;

    @Autowired
    private ProductionSlotRepository productionSlotRepository;

    @Autowired
    private SchedulerService schedulerService;

    @Transactional
    public OrderResponse createOrder(OrderRequest request) {
        if (request.getQuantity() < 25 || request.getQuantity() > 2500) {
            throw new IllegalArgumentException("數量必須在 25 到 2500 之間");
        }
        if (request.getCustomerDueDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("交期已過，無法新增此訂單");
        }

        customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new IllegalArgumentException("找不到此客戶"));

        Order order = new Order();
        order.setFactoryId(request.getFactoryId());
        order.setWaferTypeId(request.getWaferTypeId());
        order.setCustomerId(request.getCustomerId());
        order.setQuantity(request.getQuantity());
        order.setCustomerDueDate(request.getCustomerDueDate());
        order.setCreatedBy("user-admin-001"); // Week 3 換成 JWT SecurityContext

        Order savedOrder = orderRepository.save(order);

        // 串接後端B：把排程任務加入佇列
        schedulingQueueService.enqueue(savedOrder.getId(), SchedulingAction.SCHEDULE_ORDER);

        return convertToResponse(savedOrder);
    }

    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public OrderResponse getOrderById(String id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("找不到訂單 ID: " + id));
        return convertToResponse(order);
    }

    public List<OrderSlotResponse> getOrderSlots(String orderId) {
        if (!orderRepository.existsById(orderId)) {
            throw new RuntimeException("找不到訂單 ID: " + orderId);
        }
        return productionSlotRepository.findByOrderId(orderId).stream()
                .sorted(Comparator.comparing(ProductionSlot::getSlotDate))
                .map(slot -> {
                    OrderSlotResponse res = new OrderSlotResponse();
                    res.setId(slot.getId());
                    res.setOrderId(slot.getOrderId());
                    res.setFactoryId(slot.getFactoryId());
                    res.setSlotDate(slot.getSlotDate());
                    res.setQuantity(slot.getQuantity());
                    return res;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void cancelOrder(String id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("找不到訂單 ID: " + id));

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalStateException("訂單已取消");
        }

        // 釋放所有 ProductionSlot，歸還產能
        releaseSlots(order);

        order.setCancelledFromStatus(order.getStatus());
        order.setStatus(OrderStatus.CANCELLED);
        order.setRemainingQuantity(order.getQuantity());
        order.setLastSlotDate(null);
        order.setExpectedDueDate(null);
        order.setIsDelayed(false);
        order.setDelayDays(0);
        order.setScheduleWarning(null);
        orderRepository.save(order);

        // 觸發全局重排，讓其他 PENDING 訂單填入釋放的空位
        schedulingQueueService.enqueueRescheduleAll();
    }

    @Transactional
    public OrderResponse updateOrder(String id, OrderUpdateRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("找不到訂單 ID: " + id));

        if (order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.COMPLETED) {
            throw new IllegalStateException("已取消或已完成的訂單無法修改");
        }
        if (request.getCustomerDueDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("交期已過，無法修改");
        }

        // 釋放原有 slot，歸還產能
        releaseSlots(order);

        // 更新訂單資料，重置排程狀態
        order.setQuantity(request.getQuantity());
        order.setCustomerDueDate(request.getCustomerDueDate());
        order.setRemainingQuantity(request.getQuantity());
        order.setStatus(OrderStatus.PENDING);
        order.setLastSlotDate(null);
        order.setExpectedDueDate(null);
        order.setIsDelayed(false);
        order.setDelayDays(0);
        order.setScheduleWarning(null);
        Order saved = orderRepository.save(order);

        // 觸發全局重排
        schedulingQueueService.enqueueRescheduleAll();

        return convertToResponse(saved);
    }

    // 釋放訂單的所有 ProductionSlot，並歸還 DailyCapacityUsage
    private void releaseSlots(Order order) {
        List<ProductionSlot> slots = productionSlotRepository.findByOrderId(order.getId());
        for (ProductionSlot slot : slots) {
            schedulerService.releaseCapacity(order.getFactoryId(), slot.getSlotDate(), slot.getQuantity());
        }
        productionSlotRepository.deleteByOrderId(order.getId());
    }

    private OrderResponse convertToResponse(Order order) {
        OrderResponse res = new OrderResponse();
        res.setId(order.getId());
        res.setStatus(order.getStatus().name());
        res.setQuantity(order.getQuantity());
        res.setRemainingQuantity(order.getRemainingQuantity());
        res.setCustomerDueDate(order.getCustomerDueDate());
        res.setLastSlotDate(order.getLastSlotDate());
        res.setExpectedDueDate(order.getExpectedDueDate());
        res.setIsDelayed(order.getIsDelayed());
        res.setDelayDays(order.getDelayDays());
        res.setScheduleWarning(order.getScheduleWarning());
        res.setCustomerId(order.getCustomerId());
        res.setCreatedAt(order.getCreatedAt());
        res.setUpdatedAt(order.getUpdatedAt());

        // 從 Customer 表 join customerCode 和 customerName
        customerRepository.findById(order.getCustomerId()).ifPresent(customer -> {
            res.setCustomerCode(customer.getCustomerCode());
            res.setCustomerName(customer.getName());
        });

        return res;
    }
}
