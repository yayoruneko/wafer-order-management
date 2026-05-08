package com.semiconductor.woms.backend.model;

import com.semiconductor.woms.backend.model.enums.ChangeType;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "order_history")
public class OrderHistory {
    @Id
    private String id;

    @Column(name = "order_id", nullable = false)
    private String orderId;

    @Column(name = "changed_by", nullable = false)
    private String changedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "change_type", nullable = false)
    private ChangeType changeType;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;

    // 以下為快照欄位，記錄變更前的狀態
    @Column(name = "snapshot_quantity")
    private Integer snapshotQuantity;

    @Column(name = "snapshot_customer_due_date")
    private LocalDate snapshotCustomerDueDate;

    @Column(name = "snapshot_status")
    private String snapshotStatus;

    @Column(name = "snapshot_last_slot_date")
    private LocalDate snapshotLastSlotDate;

    @Column(name = "snapshot_is_delayed")
    private Boolean snapshotIsDelayed;

    @Column(name = "snapshot_delay_days")
    private Integer snapshotDelayDays;

    @Column(name = "snapshot_schedule_warning")
    private String snapshotScheduleWarning;

    @PrePersist
    protected void onCreate() {
        id = UUID.randomUUID().toString();
        changedAt = LocalDateTime.now();
    }

    // 從 Order 快照當下狀態的靜態工廠方法，方便呼叫
    public static OrderHistory snapshot(Order order, ChangeType changeType, String changedBy) {
        OrderHistory h = new OrderHistory();
        h.setOrderId(order.getId());
        h.setChangedBy(changedBy);
        h.setChangeType(changeType);
        h.setSnapshotQuantity(order.getQuantity());
        h.setSnapshotCustomerDueDate(order.getCustomerDueDate());
        h.setSnapshotStatus(order.getStatus() != null ? order.getStatus().name() : null);
        h.setSnapshotLastSlotDate(order.getLastSlotDate());
        h.setSnapshotIsDelayed(order.getIsDelayed());
        h.setSnapshotDelayDays(order.getDelayDays());
        h.setSnapshotScheduleWarning(order.getScheduleWarning());
        return h;
    }
}


