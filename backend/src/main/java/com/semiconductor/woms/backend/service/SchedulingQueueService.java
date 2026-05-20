package com.semiconductor.woms.backend.service;

import com.semiconductor.woms.backend.model.QueueStatus;
import com.semiconductor.woms.backend.model.SchedulingAction;
import com.semiconductor.woms.backend.model.SchedulingQueue;
import com.semiconductor.woms.backend.repository.SchedulingQueueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SchedulingQueueService {

    private final SchedulingQueueRepository schedulingQueueRepository;

    public void enqueue(String orderId, SchedulingAction action) {
        SchedulingQueue task = new SchedulingQueue();
        task.setOrderId(orderId);
        task.setAction(action);
        task.setStatus(QueueStatus.PENDING);
        task.setPriority(100);
        schedulingQueueRepository.save(task);
    }

    public void enqueueRescheduleAll() {
        SchedulingQueue task = new SchedulingQueue();
        task.setOrderId(null);
        task.setAction(SchedulingAction.RESCHEDULE_ALL);
        task.setStatus(QueueStatus.PENDING);
        task.setPriority(100);
        schedulingQueueRepository.save(task);
    }
}