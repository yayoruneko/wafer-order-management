package com.semiconductor.woms.backend.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class OrderSlotResponse {
    private String id;
    private String orderId;
    private String factoryId;
    private LocalDate slotDate;
    private Integer quantity;
}
