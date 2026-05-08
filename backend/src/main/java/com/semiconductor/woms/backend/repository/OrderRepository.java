package com.semiconductor.woms.backend.repository;

import com.semiconductor.woms.backend.model.Order;
import com.semiconductor.woms.backend.model.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {

    List<Order> findByFactoryId(String factoryId);

    List<Order> findByStatus(OrderStatus status);

    List<Order> findByIsDelayedTrue();

    List<Order> findByCustomerId(String customerId);
}
