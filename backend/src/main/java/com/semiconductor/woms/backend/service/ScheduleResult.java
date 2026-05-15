package com.semiconductor.woms.backend.service;

import com.semiconductor.woms.backend.model.ProductionSlot;
import lombok.Data;

import java.util.List;

@Data
public class ScheduleResult {

    private boolean success;        // 是否排程成功
    private boolean delayed;        // 是否延誤
    private boolean unschedulable;  // 90天內是否無解
    private String orderId;
    private List<ProductionSlot> slots;

    // 排程成功（不管有沒有延誤）
    public static ScheduleResult success(String orderId, List<ProductionSlot> slots, boolean delayed) {
        ScheduleResult result = new ScheduleResult();
        result.setSuccess(true);
        result.setDelayed(delayed);
        result.setUnschedulable(false);
        result.setOrderId(orderId);
        result.setSlots(slots);
        return result;
    }

    // 90天內產能不足，無法排程
    public static ScheduleResult unschedulable(String orderId) {
        ScheduleResult result = new ScheduleResult();
        result.setSuccess(false);
        result.setDelayed(false);
        result.setUnschedulable(true);
        result.setOrderId(orderId);
        return result;
    }
}