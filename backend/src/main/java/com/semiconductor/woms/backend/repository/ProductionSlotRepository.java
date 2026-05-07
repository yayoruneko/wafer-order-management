package com.semiconductor.woms.backend.repository;

import com.semiconductor.woms.backend.model.ProductionSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ProductionSlotRepository extends JpaRepository<ProductionSlot, String> {

    // 查詢某筆訂單的所有 slot
    List<ProductionSlot> findByOrderId(String orderId);

    // 查詢某工廠某天的所有 slot
    List<ProductionSlot> findByFactoryIdAndSlotDate(String factoryId, LocalDate slotDate);

    // 刪除某筆訂單的所有 slot（取消或修改訂單時用）
    void deleteByOrderId(String orderId);
}