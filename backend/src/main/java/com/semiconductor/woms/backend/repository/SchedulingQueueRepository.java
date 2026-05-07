package com.semiconductor.woms.backend.repository;

import com.semiconductor.woms.backend.model.SchedulingQueue;
import com.semiconductor.woms.backend.model.QueueStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SchedulingQueueRepository extends JpaRepository<SchedulingQueue, String> {

    // 查詢所有等待執行的任務，依優先順序和建立時間排序
    List<SchedulingQueue> findByStatusOrderByPriorityAscCreatedAtAsc(QueueStatus status);
}