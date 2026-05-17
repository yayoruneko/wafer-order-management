package com.semiconductor.woms.backend.controller;

import com.semiconductor.woms.backend.dto.ApiResponse;
import com.semiconductor.woms.backend.dto.OrderRequest;
import com.semiconductor.woms.backend.dto.OrderResponse;
import com.semiconductor.woms.backend.dto.OrderSlotResponse;
import com.semiconductor.woms.backend.model.Order;
import com.semiconductor.woms.backend.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@RequestBody OrderRequest request) {
        OrderResponse response = orderService.createOrder(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable String id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> updateOrder(@PathVariable String id, @RequestBody OrderRequest request) {
        orderService.updateOrder(id, request);
        return ResponseEntity.ok(new ApiResponse(200,  "訂單 " + id + " 已成功更新"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> cancelOrder(@PathVariable String id) {
        orderService.cancelOrder(id);
        return ResponseEntity.ok(new ApiResponse(200,  "訂單 " + id + " 已成功取消"));
    }
}

    // GET /api/orders/{id}/slots - 取得訂單被分配的生產日期與數量
    @GetMapping("/{id}/slots")
    public ResponseEntity<List<OrderSlotResponse>> getOrderSlots(@PathVariable String id) {
        return ResponseEntity.ok(orderService.getOrderSlots(id));
    }

//    @GetMapping("/{id}/history")
//    public ResponseEntity<List<OrderHistoryResponse>> getOrderHistory(
//            @PathVariable String id) {
//        return ResponseEntity.ok(orderService.getOrderById(id));
//
//    }
}
