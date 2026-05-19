package com.semiconductor.woms.backend.dto;

import lombok.Data;

@Data
public class OrderStatsResponse {
    private int total;
    private int inProduction;
    private int delayed;
    private long totalWafers;
    private int allCount;
    private int delayedCount;
    private int inProductionCount;
    private int mineCount;
}
