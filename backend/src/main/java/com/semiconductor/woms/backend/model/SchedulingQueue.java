package com.semiconductor.woms.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "scheduling_queue")
@Data
public class SchedulingQueue {

    @Id
    private String id;

    @Column(name = "order_id")
    private String orderId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SchedulingAction action;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QueueStatus status = QueueStatus.PENDING;

    @Column(nullable = false)
    private Integer priority = 100;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @PrePersist
    protected void onCreate() {
        id = UUID.randomUUID().toString();
        createdAt = LocalDateTime.now();
    }
}
