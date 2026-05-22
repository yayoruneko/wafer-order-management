package com.semiconductor.woms.backend.repository;

import com.semiconductor.woms.backend.model.ProductionSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ProductionSlotRepository extends JpaRepository<ProductionSlot, String> {

    // 查詢某筆訂單的所有 slot
    List<ProductionSlot> findByOrderId(String orderId);

    // 查詢某工廠某天的所有 slot
    List<ProductionSlot> findByFactoryIdAndSlotDate(String factoryId, LocalDate slotDate);

    // 查詢某工廠某日期區間的所有 slot
    List<ProductionSlot> findByFactoryIdAndSlotDateBetween(String factoryId, LocalDate from, LocalDate to);

    // 刪除某筆訂單的所有 slot（取消或修改訂單時用）
    void deleteByOrderId(String orderId);

    // 查詢第一個 slot 日期 <= today 的所有訂單 ID（生產已開始）
    @Query("SELECT DISTINCT s.orderId FROM ProductionSlot s WHERE s.slotDate <= :today")
    List<String> findOrderIdsWithSlotsOnOrBefore(@Param("today") LocalDate today);
}