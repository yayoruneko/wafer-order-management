package com.semiconductor.woms.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "production_slots")
@Data
public class ProductionSlot {

    @Id
    private String id;

    @Column(name = "order_id", nullable = false)
    private String orderId;

    @Column(name = "factory_id", nullable = false)
    private String factoryId;

    @Column(name = "slot_date", nullable = false)
    private LocalDate slotDate;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        id = UUID.randomUUID().toString();
        createdAt = LocalDateTime.now();
    }
}