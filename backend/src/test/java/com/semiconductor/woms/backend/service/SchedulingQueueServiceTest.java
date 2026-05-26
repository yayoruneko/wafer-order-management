package com.semiconductor.woms.backend.service;

import com.semiconductor.woms.backend.model.QueueStatus;
import com.semiconductor.woms.backend.model.SchedulingAction;
import com.semiconductor.woms.backend.model.SchedulingQueue;
import com.semiconductor.woms.backend.repository.SchedulingQueueRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verify;

/**
 * 規則四之 1：所有訂單建立 / 修改 / 取消都會 enqueue 排程任務，
 * 此檔案保證 enqueue 出去的任務帶有正確的初始欄位。
 */
@ExtendWith(MockitoExtension.class)
class SchedulingQueueServiceTest {

    @Mock
    private SchedulingQueueRepository queueRepository;

    @InjectMocks
    private SchedulingQueueService schedulingQueueService;

    @Test
    void enqueue_savesTaskWithOrderIdActionPendingStatusAndDefaultPriority() {
        schedulingQueueService.enqueue("order-123", SchedulingAction.SCHEDULE_ORDER);

        ArgumentCaptor<SchedulingQueue> captor = ArgumentCaptor.forClass(SchedulingQueue.class);
        verify(queueRepository).save(captor.capture());

        SchedulingQueue task = captor.getValue();
        assertEquals("order-123", task.getOrderId());
        assertEquals(SchedulingAction.SCHEDULE_ORDER, task.getAction());
        assertEquals(QueueStatus.PENDING, task.getStatus());
        assertEquals(100, task.getPriority());
    }

    @Test
    void enqueueRescheduleAll_savesTaskWithNullOrderIdAndRescheduleAllAction() {
        // 規則：RESCHEDULE_ALL 任務本身不對應單一訂單，orderId 必須為 null
        schedulingQueueService.enqueueRescheduleAll();

        ArgumentCaptor<SchedulingQueue> captor = ArgumentCaptor.forClass(SchedulingQueue.class);
        verify(queueRepository).save(captor.capture());

        SchedulingQueue task = captor.getValue();
        assertNull(task.getOrderId(), "RESCHEDULE_ALL 不應該帶任何 orderId");
        assertEquals(SchedulingAction.RESCHEDULE_ALL, task.getAction());
        assertEquals(QueueStatus.PENDING, task.getStatus());
        assertEquals(100, task.getPriority());
    }
}
