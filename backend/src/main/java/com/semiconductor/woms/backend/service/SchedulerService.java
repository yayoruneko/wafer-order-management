package com.semiconductor.woms.backend.service;

import java.time.LocalDate;

public interface SchedulerService {

    // 排程單筆訂單
    ScheduleResult scheduleOrder(String orderId);

    // 全局重排所有訂單
    void rescheduleAll();

    // 查詢某工廠某天剩餘產能
    int getAvailableCapacity(String factoryId, LocalDate date);

    // 歸還產能（釋放 slot 時由 OrderService 呼叫）
    void releaseCapacity(String factoryId, LocalDate date, int quantity);

    // 依日期更新訂單狀態：SCHEDULED→IN_PRODUCTION、IN_PRODUCTION→COMPLETED
    void updateOrderStatusesByDate();
}