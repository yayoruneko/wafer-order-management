package com.semiconductor.woms.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class DailySlotSummary {
    private Integer count;
    private List<SlotOrderInfo> delayedOrders;
}
