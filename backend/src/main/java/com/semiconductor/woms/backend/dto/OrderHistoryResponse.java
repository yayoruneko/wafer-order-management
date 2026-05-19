package com.semiconductor.woms.backend.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.time.LocalDate;

@Data
public class OrderHistoryResponse {
    private String id;
    private String orderId;
    private String changedBy;
    private String changedByUsername;
    private String changeType;
    private LocalDateTime changedAt;
    private Integer snapshotQuantity;
    private LocalDate snapshotCustomerDueDate;
    private String snapshotStatus;
    private LocalDate snapshotLastSlotDate;
    private Boolean snapshotIsDelayed;
    private Integer snapshotDelayDays;
    private String snapshotScheduleWarning;
}
