package com.semiconductor.woms.backend.repository;

import com.semiconductor.woms.backend.model.Order;
import com.semiconductor.woms.backend.model.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;



@Repository
public interface OrderRepository extends JpaRepository<Order, String> {

    @Modifying
    @Transactional
    @Query("DELETE FROM Order o") 
    void truncateTable();
    List<Order> findByFactoryId(String factoryId);

    List<Order> findByStatus(OrderStatus status);

    List<Order> findByStatusIn(List<OrderStatus> statuses);

    List<Order> findByIsDelayedTrue();

    List<Order> findByCustomerId(String customerId);
}
