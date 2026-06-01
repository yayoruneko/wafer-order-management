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

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * QueuePoller 是排程任務的執行器，目前完全沒有測試。
 *
 * 此檔案聚焦於規則四之 3 的關鍵不變量：
 *  - 若有 PROCESSING 中的任務，這一輪 poll 不應啟動新任務
 *  - SCHEDULE_ORDER 結果為 delayed 或 unschedulable 時必須補 enqueueRescheduleAll
 *  - 任務跑完應該變 DONE，例外時變 FAILED
 *  - CANCEL_ORDER 任務也走 rescheduleAll 流程
 */
@ExtendWith(MockitoExtension.class)
class QueuePollerTest {

    @Mock
    private SchedulingQueueRepository queueRepository;

    @Mock
    private SchedulerService schedulerService;

    @Mock
    private SchedulingQueueService schedulingQueueService;

    @InjectMocks
    private QueuePoller queuePoller;

    @Test
    void poll_skipsThisCycle_whenSomeTaskIsAlreadyProcessing() {
        // 防止 app 重啟時重複執行
        SchedulingQueue stuck = newTask(SchedulingAction.SCHEDULE_ORDER, "order-1");
        stuck.setStatus(QueueStatus.PROCESSING);

        when(queueRepository.findByStatusOrderByPriorityAscCreatedAtAsc(QueueStatus.PROCESSING))
                .thenReturn(List.of(stuck));

        queuePoller.poll();

        // 不應再查 PENDING、不應呼叫 schedulerService
        verify(queueRepository, never()).findByStatusOrderByPriorityAscCreatedAtAsc(QueueStatus.PENDING);
        verifyNoInteractions(schedulerService);
    }

    @Test
    void poll_returns_whenNoPendingTasks() {
        when(queueRepository.findByStatusOrderByPriorityAscCreatedAtAsc(QueueStatus.PROCESSING))
                .thenReturn(List.of());
        when(queueRepository.findByStatusOrderByPriorityAscCreatedAtAsc(QueueStatus.PENDING))
                .thenReturn(List.of());

        queuePoller.poll();

        verifyNoInteractions(schedulerService);
        verify(queueRepository, never()).save(any());
    }

    @Test
    void poll_scheduleOrderHappyPath_marksTaskDoneAndUpdatesStatuses() {
        SchedulingQueue task = newTask(SchedulingAction.SCHEDULE_ORDER, "order-1");

        when(queueRepository.findByStatusOrderByPriorityAscCreatedAtAsc(QueueStatus.PROCESSING))
                .thenReturn(List.of());
        when(queueRepository.findByStatusOrderByPriorityAscCreatedAtAsc(QueueStatus.PENDING))
                .thenReturn(List.of(task));
        when(schedulerService.scheduleOrder("order-1"))
                .thenReturn(ScheduleResult.success("order-1", List.of(), false));

        queuePoller.poll();

        // 任務最終狀態必須是 DONE
        ArgumentCaptor<SchedulingQueue> captor = ArgumentCaptor.forClass(SchedulingQueue.class);
        verify(queueRepository, atLeastOnce()).save(captor.capture());
        SchedulingQueue last = captor.getAllValues().get(captor.getAllValues().size() - 1);
        assertEquals(QueueStatus.DONE, last.getStatus());

        // 順利成功且未延誤 → 不應觸發額外的 RESCHEDULE_ALL
        verify(schedulingQueueService, never()).enqueueRescheduleAll();

        // poll 結束會推動「日期驅動的狀態轉換」
        verify(schedulerService).updateOrderStatusesByDate();
    }

    @Test
    void poll_scheduleOrderResultIsDelayed_enqueuesRescheduleAllForOptimization() {
        // PDF 規則：當新訂單排出來會延誤時，補一次全局重排，
        // 讓 EDD 排序有機會把先前訂單往後推、騰出更早的 slot
        SchedulingQueue task = newTask(SchedulingAction.SCHEDULE_ORDER, "order-1");

        when(queueRepository.findByStatusOrderByPriorityAscCreatedAtAsc(QueueStatus.PROCESSING))
                .thenReturn(List.of());
        when(queueRepository.findByStatusOrderByPriorityAscCreatedAtAsc(QueueStatus.PENDING))
                .thenReturn(List.of(task));
        when(schedulerService.scheduleOrder("order-1"))
                .thenReturn(ScheduleResult.success("order-1", List.of(), true));  // delayed=true

        queuePoller.poll();

        verify(schedulingQueueService).enqueueRescheduleAll();
    }

    @Test
    void poll_scheduleOrderResultIsUnschedulable_enqueuesRescheduleAll() {
        SchedulingQueue task = newTask(SchedulingAction.SCHEDULE_ORDER, "order-1");

        when(queueRepository.findByStatusOrderByPriorityAscCreatedAtAsc(QueueStatus.PROCESSING))
                .thenReturn(List.of());
        when(queueRepository.findByStatusOrderByPriorityAscCreatedAtAsc(QueueStatus.PENDING))
                .thenReturn(List.of(task));
        when(schedulerService.scheduleOrder("order-1"))
                .thenReturn(ScheduleResult.unschedulable("order-1"));

        queuePoller.poll();

        verify(schedulingQueueService).enqueueRescheduleAll();
    }

    @Test
    void poll_rescheduleAllAction_invokesRescheduleAll() {
        SchedulingQueue task = newTask(SchedulingAction.RESCHEDULE_ALL, null);

        when(queueRepository.findByStatusOrderByPriorityAscCreatedAtAsc(QueueStatus.PROCESSING))
                .thenReturn(List.of());
        when(queueRepository.findByStatusOrderByPriorityAscCreatedAtAsc(QueueStatus.PENDING))
                .thenReturn(List.of(task));

        queuePoller.poll();

        verify(schedulerService).rescheduleAll();
        verify(schedulerService, never()).scheduleOrder(anyString());
    }

    @Test
    void poll_cancelOrderAction_alsoInvokesRescheduleAll() {
        // 規則三：取消訂單最終會透過 rescheduleAll 釋放並重新分配
        SchedulingQueue task = newTask(SchedulingAction.CANCEL_ORDER, "order-1");

        when(queueRepository.findByStatusOrderByPriorityAscCreatedAtAsc(QueueStatus.PROCESSING))
                .thenReturn(List.of());
        when(queueRepository.findByStatusOrderByPriorityAscCreatedAtAsc(QueueStatus.PENDING))
                .thenReturn(List.of(task));

        queuePoller.poll();

        verify(schedulerService).rescheduleAll();
    }

    @Test
    void poll_taskThrows_marksAsFailedInsteadOfPropagating() {
        SchedulingQueue task = newTask(SchedulingAction.SCHEDULE_ORDER, "order-1");

        when(queueRepository.findByStatusOrderByPriorityAscCreatedAtAsc(QueueStatus.PROCESSING))
                .thenReturn(List.of());
        when(queueRepository.findByStatusOrderByPriorityAscCreatedAtAsc(QueueStatus.PENDING))
                .thenReturn(List.of(task));
        when(schedulerService.scheduleOrder("order-1"))
                .thenThrow(new RuntimeException("boom"));

        // 例外不能向外傳播，否則整個 @Scheduled 工作會卡死
        assertDoesNotThrow(() -> queuePoller.poll());

        ArgumentCaptor<SchedulingQueue> captor = ArgumentCaptor.forClass(SchedulingQueue.class);
        verify(queueRepository, atLeastOnce()).save(captor.capture());
        SchedulingQueue last = captor.getAllValues().get(captor.getAllValues().size() - 1);
        assertEquals(QueueStatus.FAILED, last.getStatus());
    }

    @Test
    void poll_setsTaskToProcessingBeforeRunning() {
        // 在執行 schedulerService 之前，任務應已被標為 PROCESSING 並寫回 DB。
        // 由於 poll() 對同一個物件 mutate 後又 save 一次，無法靠 ArgumentCaptor 比較
        // （捕到的兩次都是同一個引用），改為在 save 當下「凍結」當時的 status。
        SchedulingQueue task = newTask(SchedulingAction.RESCHEDULE_ALL, null);
        java.util.List<QueueStatus> statusHistory = new java.util.ArrayList<>();
        when(queueRepository.save(any(SchedulingQueue.class))).thenAnswer(inv -> {
            SchedulingQueue arg = inv.getArgument(0);
            statusHistory.add(arg.getStatus());
            return arg;
        });

        when(queueRepository.findByStatusOrderByPriorityAscCreatedAtAsc(QueueStatus.PROCESSING))
                .thenReturn(List.of());
        when(queueRepository.findByStatusOrderByPriorityAscCreatedAtAsc(QueueStatus.PENDING))
                .thenReturn(List.of(task));

        queuePoller.poll();

        // 第一次 save 應是 PROCESSING（且帶 processedAt），最後一次是 DONE
        assertEquals(QueueStatus.PROCESSING, statusHistory.get(0));
        assertEquals(QueueStatus.DONE, statusHistory.get(statusHistory.size() - 1));
        assertNotNull(task.getProcessedAt());
    }

    @Test
    void onApplicationReady_invokesStatusUpdate() {
        queuePoller.onApplicationReady();
        verify(schedulerService).updateOrderStatusesByDate();
    }

    private SchedulingQueue newTask(SchedulingAction action, String orderId) {
        SchedulingQueue q = new SchedulingQueue();
        q.setId("queue-" + action.name());
        q.setAction(action);
        q.setOrderId(orderId);
        q.setStatus(QueueStatus.PENDING);
        q.setPriority(100);
        return q;
    }
}
