package com.semiconductor.woms.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "daily_capacity_usage")
@Data
public class DailyCapacityUsage {

    @Id
    private String id;

    @Column(name = "factory_id", nullable = false)
    private String factoryId;

    @Column(name = "slot_date", nullable = false)
    private LocalDate slotDate;

    @Column(name = "used_quantity", nullable = false)
    private Integer usedQuantity = 0;

    @PrePersist
    protected void onCreate() {
        id = UUID.randomUUID().toString();
    }
}