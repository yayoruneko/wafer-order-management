package com.semiconductor.woms.backend.service;

import com.semiconductor.woms.backend.model.QueueStatus;
import com.semiconductor.woms.backend.model.SchedulingAction;
import com.semiconductor.woms.backend.model.SchedulingQueue;
import com.semiconductor.woms.backend.repository.SchedulingQueueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class QueuePoller {

    private final SchedulingQueueRepository queueRepository;
    private final SchedulerService schedulerService;
    private final SchedulingQueueService schedulingQueueService;

    /**
     * 應用程式啟動完成後立即執行一次，確保 demo data seed 完才更新狀態。
     * 之後每小時再定期執行。
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        schedulerService.updateOrderStatusesByDate();
    }

    @Scheduled(fixedRate = 3_600_000)
    public void periodicStatusUpdate() {
        schedulerService.updateOrderStatusesByDate();
    }

    /**
     * 每次只取一筆 PENDING 任務執行，確保任務序列化。
     * fixedDelay 保證上一次 poll() 結束後才會再次觸發，不會並發執行。
     * 若有任務卡在 PROCESSING（例如 app 重啟），優先跳過以免重複執行。
     */
    @Scheduled(fixedDelay = 500)
    public void poll() {
        // 若有任務仍在 PROCESSING，等下一輪再試（防止 app 重啟造成重複執行）
        List<SchedulingQueue> processing = queueRepository
                .findByStatusOrderByPriorityAscCreatedAtAsc(QueueStatus.PROCESSING);
        if (!processing.isEmpty()) {
            log.warn("Found {} task(s) still in PROCESSING state, skipping this poll cycle", processing.size());
            return;
        }

        // 每次只取優先度最高的那一筆
        List<SchedulingQueue> pending = queueRepository
                .findByStatusOrderByPriorityAscCreatedAtAsc(QueueStatus.PENDING);
        if (pending.isEmpty()) return;

        SchedulingQueue task = pending.get(0);
        task.setStatus(QueueStatus.PROCESSING);
        task.setProcessedAt(LocalDateTime.now());
        queueRepository.save(task);

        try {
            if (task.getAction() == SchedulingAction.SCHEDULE_ORDER) {
                ScheduleResult result = schedulerService.scheduleOrder(task.getOrderId());
                // PDF rule: if new order ends up delayed or unschedulable, trigger global reschedule
                // so EDD-optimal sorting can potentially free up earlier slots for this order
                if (result.isDelayed() || result.isUnschedulable()) {
                    schedulingQueueService.enqueueRescheduleAll();
                    log.info("Order {} is delayed/unschedulable after SCHEDULE_ORDER, enqueued RESCHEDULE_ALL", task.getOrderId());
                }
            } else if (task.getAction() == SchedulingAction.RESCHEDULE_ALL
                    || task.getAction() == SchedulingAction.CANCEL_ORDER) {
                schedulerService.rescheduleAll();
            }
            task.setStatus(QueueStatus.DONE);
            log.info("Done: task={} action={} order={}", task.getId(), task.getAction(), task.getOrderId());
        } catch (Exception e) {
            task.setStatus(QueueStatus.FAILED);
            log.error("Failed: task={} action={} error={}", task.getId(), task.getAction(), e.getMessage());
        }

        queueRepository.save(task);
    }
}
