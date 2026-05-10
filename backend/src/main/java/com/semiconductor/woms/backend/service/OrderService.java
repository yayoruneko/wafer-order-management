package com.semiconductor.woms.backend.service;

import com.semiconductor.woms.backend.dto.OrderRequest;
import com.semiconductor.woms.backend.dto.OrderResponse;
import com.semiconductor.woms.backend.model.Order;
import com.semiconductor.woms.backend.model.enums.OrderStatus;
import com.semiconductor.woms.backend.repository.OrderRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Transactional
    public OrderResponse createOrder(OrderRequest request) {
        // 1. 業務邏輯驗證 (依據 PDF 文件需求)
        if (request.getQuantity() < 25 || request.getQuantity() > 2500) {
            throw new IllegalArgumentException("數量必須在 25 到 2500 之間");
        }
        if (request.getCustomerDueDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("交期已過");
        }

        // 2. DTO 轉 Entity
        Order order = new Order();
        order.setFactoryId(request.getFactoryId());
        order.setWaferTypeId(request.getWaferTypeId());
        order.setCustomerId(request.getCustomerId());
        order.setQuantity(request.getQuantity());
        order.setCustomerDueDate(request.getCustomerDueDate());
        order.setCreatedBy("user-admin-001"); // 實際應從 SecurityContext 取得

        // 3. 儲存 (JPA 會觸發 Order 內的 @PrePersist 自動生成 UUID 與日期)
        Order savedOrder = orderRepository.save(order);

        // 4. Entity 轉 Response DTO 回傳
        return convertToResponse(savedOrder);
    }

    public List<OrderResponse> getAllOrders() {
        // 這裡可以使用 JPA 的 findAll()
        // 或者使用你之前寫的 JDBC 複雜查詢: orderRepository.findAllOrderDetailsByJdbc();
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
    public void cancelOrder(String id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("找不到訂單 ID: " + id));

        // 記錄取消前的狀態 (對應你 Entity 中的 cancelledFromStatus)
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
        res.setCreatedAt(order.getCreatedAt());
        res.setCustomerId(order.getCustomerId());
        res.setExpectedDueDate(order.getExpectedDueDate());
        res.setLastSlotDate(order.getLastSlotDate());
        res.setIsDelayed(order.getIsDelayed());
        res.setScheduleWarning(order.getScheduleWarning());
        return res;
    }
}