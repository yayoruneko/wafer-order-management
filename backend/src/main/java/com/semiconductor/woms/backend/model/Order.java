package com.semiconductor.woms.backend.model;

import com.semiconductor.woms.backend.model.enums.OrderStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "orders")
public class Order {
    @Id
    private String id;

    @Column(name = "factory_id", nullable = false)
    private String factoryId;

    @Column(name = "wafer_type_id", nullable = false)
    private String waferTypeId;

    @Column(name = "customer_id", nullable = false)
    private String customerId;

    @Column(name = "created_by", nullable = false)
    private String createdBy;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "remaining_quantity", nullable = false)
    private Integer remainingQuantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.PENDING;

    @Column(name = "customer_due_date", nullable = false)
    private LocalDate customerDueDate;

    @Column(name = "last_slot_date")
    private LocalDate lastSlotDate;

    @Column(name = "expected_due_date")
    private LocalDate expectedDueDate;

    @Column(name = "is_delayed", nullable = false)
    private Boolean isDelayed = false;

    @Column(name = "delay_days", nullable = false)
    private Integer delayDays = 0;

    @Column(name = "schedule_warning")
    private String scheduleWarning;

    @Enumerated(EnumType.STRING)
    @Column(name = "cancelled_from_status")
    private OrderStatus cancelledFromStatus;

    @Version
    @Column(nullable = false)
    private Integer version = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        id = UUID.randomUUID().toString();
        remainingQuantity = quantity;
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

