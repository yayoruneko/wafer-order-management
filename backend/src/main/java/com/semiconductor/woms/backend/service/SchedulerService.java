package com.semiconductor.woms.backend.service;

import java.time.LocalDate;

public interface SchedulerService {

    // 排程單筆訂單
    ScheduleResult scheduleOrder(String orderId);

    // 全局重排所有訂單
    void rescheduleAll();

    // 查詢某工廠某天剩餘產能
    int getAvailableCapacity(String factoryId, LocalDate date);
}