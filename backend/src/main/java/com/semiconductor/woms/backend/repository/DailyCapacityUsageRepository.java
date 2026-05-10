package com.semiconductor.woms.backend.repository;

import com.semiconductor.woms.backend.model.DailyCapacityUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface DailyCapacityUsageRepository extends JpaRepository<DailyCapacityUsage, String> {

    // 查詢某工廠某天的產能使用狀況
    Optional<DailyCapacityUsage> findByFactoryIdAndSlotDate(String factoryId, LocalDate slotDate);
}