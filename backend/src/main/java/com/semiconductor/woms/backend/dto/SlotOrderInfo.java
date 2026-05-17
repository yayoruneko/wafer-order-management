package com.semiconductor.woms.backend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class SlotOrderInfo {
    private String orderId;
    private String customerName;
    private String customerCode;
    private LocalDate requestedDate;
    private LocalDate rescheduledDate;
    private Integer delayDays;
    private Integer qty;
    private String scheduleWarning;
    private Boolean isDelayed;
}
