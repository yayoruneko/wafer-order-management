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

    // 後端A的 createOrder 會呼叫這個方法，把排程任務加入佇列
    public void enqueue(String orderId, SchedulingAction action) {
        SchedulingQueue task = new SchedulingQueue();
        task.setOrderId(orderId);
        task.setAction(action);
        task.setStatus(QueueStatus.PENDING);
        task.setPriority(100);
        schedulingQueueRepository.save(task);
    }
}