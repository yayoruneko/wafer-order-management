package com.semiconductor.woms.backend.controller;

import com.semiconductor.woms.backend.service.SchedulingQueueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/scheduling")
@RequiredArgsConstructor
public class SchedulingController {

    private final SchedulingQueueService schedulingQueueService;

    @PostMapping("/reschedule-all")
    public ResponseEntity<Void> rescheduleAll() {
        schedulingQueueService.enqueueRescheduleAll();
        return ResponseEntity.accepted().build();
    }
}
