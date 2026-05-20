package com.semiconductor.woms.backend.repository;

import com.semiconductor.woms.backend.model.OrderHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderHistoryRepository extends JpaRepository<OrderHistory, String> {
    List<OrderHistory> findByOrderIdOrderByChangedAtDesc(String orderId);
}
