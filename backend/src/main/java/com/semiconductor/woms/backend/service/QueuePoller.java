package com.semiconductor.woms.backend.service;

import com.semiconductor.woms.backend.model.QueueStatus;
import com.semiconductor.woms.backend.model.SchedulingAction;
import com.semiconductor.woms.backend.model.SchedulingQueue;
import com.semiconductor.woms.backend.repository.SchedulingQueueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    @Scheduled(fixedDelay = 5000)
    public void poll() {
        List<SchedulingQueue> tasks = queueRepository
                .findByStatusOrderByPriorityAscCreatedAtAsc(QueueStatus.PENDING);

        for (SchedulingQueue task : tasks) {
            task.setStatus(QueueStatus.PROCESSING);
            queueRepository.save(task);

            try {
                if (task.getAction() == SchedulingAction.SCHEDULE_ORDER) {
                    schedulerService.scheduleOrder(task.getOrderId());
                } else if (task.getAction() == SchedulingAction.RESCHEDULE_ALL) {
                    schedulerService.rescheduleAll();
                }
                task.setStatus(QueueStatus.DONE);
                task.setProcessedAt(LocalDateTime.now());
                log.info("Processed queue task {} for order {}", task.getId(), task.getOrderId());
            } catch (Exception e) {
                task.setStatus(QueueStatus.FAILED);
                task.setProcessedAt(LocalDateTime.now());
                log.error("Failed to process queue task {}: {}", task.getId(), e.getMessage());
            }

            queueRepository.save(task);
        }
    }
}
