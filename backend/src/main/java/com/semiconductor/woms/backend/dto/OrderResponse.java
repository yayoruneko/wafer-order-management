package com.semiconductor.woms.backend.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class OrderResponse {
    private String id;
    private String customerId;
    private String customerCode;
    private String customerName;
    private Integer quantity;
    private Integer remainingQuantity;
    private String status;
    private LocalDate customerDueDate;
    private LocalDate lastSlotDate;
    private LocalDate expectedDueDate;
    private Boolean isDelayed;
    private Integer delayDays;
    private String scheduleWarning;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdByUsername;
}
