package com.semiconductor.woms.backend.controller;

import com.semiconductor.woms.backend.dto.OrderHistoryResponse;
import com.semiconductor.woms.backend.dto.OrderRequest;
import com.semiconductor.woms.backend.dto.OrderResponse;
import com.semiconductor.woms.backend.model.Order;
import com.semiconductor.woms.backend.service.OrderService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@Tag(name = "order")
public class OrderController {

    @Autowired
    private OrderService orderService;

    // POST /api/orders - 新增訂單
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@RequestBody OrderRequest request) {
        OrderResponse response = orderService.createOrder(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // GET /api/orders - 取得所有訂單
    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    // GET /api/orders/{id} - 取得單一訂單
    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable String id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    // DELETE /api/orders/{id} - 取消訂單
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelOrder(@PathVariable String id) {
        orderService.cancelOrder(id);
        return ResponseEntity.noContent().build();
    }

//    @GetMapping("/{id}/history")
//    public ResponseEntity<List<OrderHistoryResponse>> getOrderHistory(
//            @PathVariable String id) {
//        return ResponseEntity.ok(orderService.getOrderById(id));
//
//    }
}
