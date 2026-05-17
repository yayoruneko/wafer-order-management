package com.semiconductor.woms.backend.service;

import com.semiconductor.woms.backend.dto.OrderRequest;
import com.semiconductor.woms.backend.dto.OrderResponse;
import com.semiconductor.woms.backend.dto.OrderSlotResponse;
import com.semiconductor.woms.backend.model.Order;
import com.semiconductor.woms.backend.model.ProductionSlot;
import com.semiconductor.woms.backend.model.SchedulingAction;
import com.semiconductor.woms.backend.model.User;
import com.semiconductor.woms.backend.model.enums.OrderStatus;
import com.semiconductor.woms.backend.repository.CustomerRepository;
import com.semiconductor.woms.backend.repository.OrderRepository;
import com.semiconductor.woms.backend.repository.UserRepository;
import com.semiconductor.woms.backend.repository.ProductionSlotRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

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
    private UserRepository userRepository;

    @Autowired
    private SchedulingQueueService schedulingQueueService;


    @Autowired
    private ProductionSlotRepository productionSlotRepository;

    @Transactional
    public OrderResponse createOrder(OrderRequest request) {

        if (request.getQuantity() < 25 || request.getQuantity() > 2500) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "數量必須在 25 到 2500 之間");
        }

        if (request.getCustomerDueDate().isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "交期已過，無法新增此訂單");
        }

        customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到此客戶"));

        Order order = new Order();
        order.setFactoryId(request.getFactoryId());
        order.setWaferTypeId(request.getWaferTypeId());
        order.setCustomerId(request.getCustomerId());
        order.setQuantity(request.getQuantity());
        order.setCustomerDueDate(request.getCustomerDueDate());

        String currentUsername = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getName();

        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "當前登入用戶不存在"));

        order.setCreatedBy(user.getId());

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


    @Transactional
    public OrderResponse updateOrder(String id, OrderRequest request) {

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到欲更新的訂單 ID: " + id));

        if (request.getQuantity() < 25 || request.getQuantity() > 2500) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "數量必須在 25 到 2500 之間");
        }

        order.setQuantity(request.getQuantity());
        order.setCustomerDueDate(request.getCustomerDueDate());
        order.setFactoryId(request.getFactoryId());
        order.setWaferTypeId(request.getWaferTypeId());

        Order updatedOrder = orderRepository.save(order);

        // 如果數量或交期變了，通常需要重新排程
        schedulingQueueService.enqueue(updatedOrder.getId(), SchedulingAction.RESCHEDULE_ALL);

        return convertToResponse(updatedOrder);
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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到訂單 ID: " + id));

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "該訂單已經是取消狀態");
        }
        order.setCancelledFromStatus(order.getStatus());
        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
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
