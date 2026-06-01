package com.semiconductor.woms.backend.service;

import com.semiconductor.woms.backend.exception.CustomerNotFoundException;
import com.semiconductor.woms.backend.dto.OrderHistoryResponse;
import com.semiconductor.woms.backend.dto.OrderRequest;
import com.semiconductor.woms.backend.dto.OrderResponse;
import com.semiconductor.woms.backend.dto.OrderStatsResponse;
import com.semiconductor.woms.backend.dto.OrderUpdateRequest;
import com.semiconductor.woms.backend.dto.OrderSlotResponse;
import com.semiconductor.woms.backend.model.Customer;
import com.semiconductor.woms.backend.model.Order;
import com.semiconductor.woms.backend.model.OrderHistory;
import com.semiconductor.woms.backend.model.ProductionSlot;
import com.semiconductor.woms.backend.model.SchedulingAction;
import com.semiconductor.woms.backend.model.User;
import com.semiconductor.woms.backend.model.enums.ChangeType;
import com.semiconductor.woms.backend.model.enums.OrderStatus;
import com.semiconductor.woms.backend.repository.CustomerRepository;
import com.semiconductor.woms.backend.repository.OrderHistoryRepository;
import com.semiconductor.woms.backend.repository.OrderRepository;
import com.semiconductor.woms.backend.repository.UserRepository;
import com.semiconductor.woms.backend.repository.ProductionSlotRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.data.domain.Sort;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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
    private OrderHistoryRepository orderHistoryRepository;

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

        if (!request.getCustomerDueDate().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("交期必須晚於今日");
        }

        customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new CustomerNotFoundException("找不到此客戶 ID: " + request.getCustomerId()));

        Order order = new Order();
        order.setFactoryId(request.getFactoryId());
        order.setWaferTypeId(request.getWaferTypeId());
        order.setCustomerId(request.getCustomerId());
        order.setQuantity(request.getQuantity());
        order.setCustomerDueDate(request.getCustomerDueDate());

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            userRepository.findByUsername(auth.getName())
                    .ifPresent(user -> order.setCreatedBy(user.getId()));
        }

        Order savedOrder = orderRepository.save(order);

        if (savedOrder.getCreatedBy() != null) {
            orderHistoryRepository.save(
                    OrderHistory.snapshot(savedOrder, ChangeType.CREATED, savedOrder.getCreatedBy()));
        }

        schedulingQueueService.enqueue(savedOrder.getId(), SchedulingAction.SCHEDULE_ORDER);

        return convertToResponse(savedOrder);
    }

    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public List<OrderResponse> getFilteredOrders(String orderId, String customerName,
                                                  String status, LocalDate fromDate,
                                                  LocalDate toDate, String view) {
        List<Order> all = orderRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        Map<String, Customer> customerMap = customerRepository.findAll().stream()
                .collect(Collectors.toMap(Customer::getId, c -> c));
        Map<String, User> userMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, u -> u));
        String currentUserId = getCurrentUserId();

        String lOrderId  = orderId      != null ? orderId.toLowerCase()     : "";
        String lCustomer = customerName != null ? customerName.toLowerCase() : "";
        String lStatus   = (status != null && !status.equals("ALL")) ? status : "";

        return all.stream()
                .filter(o -> {
                    if ("delayed".equals(view))
                        return Boolean.TRUE.equals(o.getIsDelayed()) && o.getStatus() != OrderStatus.CANCELLED;
                    if ("in_production".equals(view))
                        return o.getStatus() == OrderStatus.IN_PRODUCTION;
                    if ("mine".equals(view))
                        return currentUserId == null || currentUserId.equals(o.getCreatedBy());
                    return true;
                })
                .filter(o -> lOrderId.isEmpty() || o.getId().toLowerCase().contains(lOrderId))
                .filter(o -> {
                    if (lCustomer.isEmpty()) return true;
                    Customer c = customerMap.get(o.getCustomerId());
                    if (c == null) return false;
                    return c.getName().toLowerCase().contains(lCustomer)
                            || c.getCustomerCode().toLowerCase().contains(lCustomer);
                })
                .filter(o -> lStatus.isEmpty() || o.getStatus().name().equals(lStatus))
                .filter(o -> fromDate == null || !o.getCustomerDueDate().isBefore(fromDate))
                .filter(o -> toDate   == null || !o.getCustomerDueDate().isAfter(toDate))
                .map(o -> convertToResponseWithCustomer(o, customerMap, userMap))
                .collect(Collectors.toList());
    }

    public OrderStatsResponse getOrderStats() {
        List<Order> all = orderRepository.findAll();
        String currentUserId = getCurrentUserId();

        int total        = all.size();
        int inProduction = (int) all.stream().filter(o -> o.getStatus() == OrderStatus.IN_PRODUCTION).count();
        int delayed      = (int) all.stream().filter(o -> Boolean.TRUE.equals(o.getIsDelayed()) && o.getStatus() != OrderStatus.CANCELLED).count();
        long totalWafers = all.stream().filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                .mapToLong(Order::getQuantity).sum();
        int mineCount    = currentUserId != null
                ? (int) all.stream().filter(o -> currentUserId.equals(o.getCreatedBy())).count()
                : total;

        OrderStatsResponse stats = new OrderStatsResponse();
        stats.setTotal(total);
        stats.setInProduction(inProduction);
        stats.setDelayed(delayed);
        stats.setTotalWafers(totalWafers);
        stats.setAllCount(total);
        stats.setDelayedCount(delayed);
        stats.setInProductionCount(inProduction);
        stats.setMineCount(mineCount);
        return stats;
    }

    public OrderResponse getOrderById(String id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("找不到訂單 ID: " + id));
        return convertToResponse(order);
    }

    @Transactional
    public OrderResponse updateOrder(String id, OrderUpdateRequest request) {

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到欲更新的訂單 ID: " + id));

        if (order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.COMPLETED) {
            throw new IllegalStateException("無法更新已取消或已完成的訂單");
        }

        // Optimistic locking：若前端帶了 updatedAt 且與目前資料不符，回 409
        if (request.getUpdatedAt() != null && order.getUpdatedAt() != null
                && !request.getUpdatedAt().equals(order.getUpdatedAt())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "訂單已被他人修改，請重新載入後再試");
        }

        if (!request.getCustomerDueDate().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("交期必須晚於今日");
        }

        String changedById = getCurrentUser().map(User::getId).orElse(order.getCreatedBy());

        List<ProductionSlot> existingSlots = productionSlotRepository.findByOrderId(id);
        for (ProductionSlot slot : existingSlots) {
            schedulerService.releaseCapacity(slot.getFactoryId(), slot.getSlotDate(), slot.getQuantity());
        }
        productionSlotRepository.deleteByOrderId(id);

        order.setQuantity(request.getQuantity());
        order.setCustomerDueDate(request.getCustomerDueDate());
        order.setRemainingQuantity(request.getQuantity());
        order.setStatus(OrderStatus.PENDING);
        order.setLastSlotDate(null);
        order.setExpectedDueDate(null);
        order.setIsDelayed(false);
        order.setDelayDays(0);
        order.setScheduleWarning(null);

        Order updatedOrder = orderRepository.save(order);

        if (changedById != null) {
            orderHistoryRepository.save(OrderHistory.snapshot(updatedOrder, ChangeType.MODIFIED, changedById));
        }

        schedulingQueueService.enqueueRescheduleAll();

        return convertToResponse(updatedOrder);
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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到訂單 ID: " + id));

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalStateException("該訂單已經是取消狀態");
        }

        String changedById = getCurrentUser().map(User::getId).orElse(order.getCreatedBy());

        releaseSlots(order);
        order.setCancelledFromStatus(order.getStatus());
        order.setStatus(OrderStatus.CANCELLED);
        order.setRemainingQuantity(order.getQuantity());
        order.setLastSlotDate(null);
        order.setExpectedDueDate(null);
        order.setIsDelayed(false);
        order.setDelayDays(0);
        order.setScheduleWarning(null);
        Order cancelledOrder = orderRepository.save(order);

        if (changedById != null) {
            orderHistoryRepository.save(OrderHistory.snapshot(cancelledOrder, ChangeType.CANCELLED, changedById));
        }

        schedulingQueueService.enqueueRescheduleAll();
    }

    public List<OrderHistoryResponse> getOrderHistory(String orderId) {
        if (!orderRepository.existsById(orderId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到訂單 ID: " + orderId);
        }
        Map<String, User> userMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, u -> u));
        return orderHistoryRepository.findByOrderIdOrderByChangedAtDesc(orderId).stream()
                .map(h -> {
                    OrderHistoryResponse res = new OrderHistoryResponse();
                    res.setId(h.getId());
                    res.setOrderId(h.getOrderId());
                    res.setChangedBy(h.getChangedBy());
                    User u = userMap.get(h.getChangedBy());
                    res.setChangedByUsername(u != null ? u.getUsername() : h.getChangedBy());
                    res.setChangeType(h.getChangeType().name());
                    res.setChangedAt(h.getChangedAt());
                    res.setSnapshotQuantity(h.getSnapshotQuantity());
                    res.setSnapshotCustomerDueDate(h.getSnapshotCustomerDueDate());
                    res.setSnapshotStatus(h.getSnapshotStatus());
                    res.setSnapshotLastSlotDate(h.getSnapshotLastSlotDate());
                    res.setSnapshotIsDelayed(h.getSnapshotIsDelayed());
                    res.setSnapshotDelayDays(h.getSnapshotDelayDays());
                    res.setSnapshotScheduleWarning(h.getSnapshotScheduleWarning());
                    return res;
                })
                .collect(Collectors.toList());
    }

    private void releaseSlots(Order order) {
        List<ProductionSlot> slots = productionSlotRepository.findByOrderId(order.getId());
        for (ProductionSlot slot : slots) {
            schedulerService.releaseCapacity(order.getFactoryId(), slot.getSlotDate(), slot.getQuantity());
        }
        productionSlotRepository.deleteByOrderId(order.getId());
    }

    private Optional<User> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return Optional.empty();
        return userRepository.findByUsername(auth.getName());
    }

    private String getCurrentUserId() {
        return getCurrentUser().map(User::getId).orElse(null);
    }

    private OrderResponse convertToResponseWithCustomer(Order order, Map<String, Customer> customerMap,
                                                         Map<String, User> userMap) {
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
        Customer c = customerMap.get(order.getCustomerId());
        if (c != null) {
            res.setCustomerCode(c.getCustomerCode());
            res.setCustomerName(c.getName());
        }
        if (order.getCreatedBy() != null) {
            User u = userMap.get(order.getCreatedBy());
            if (u != null) res.setCreatedByUsername(u.getUsername());
        }
        return res;
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

        customerRepository.findById(order.getCustomerId()).ifPresent(customer -> {
            res.setCustomerCode(customer.getCustomerCode());
            res.setCustomerName(customer.getName());
        });

        if (order.getCreatedBy() != null) {
            userRepository.findById(order.getCreatedBy())
                    .ifPresent(u -> res.setCreatedByUsername(u.getUsername()));
        }

        return res;
    }
}
