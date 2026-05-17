package com.semiconductor.woms.backend.controller;

import com.semiconductor.woms.backend.dto.DailySlotSummary;
import com.semiconductor.woms.backend.dto.SlotOrderInfo;
import com.semiconductor.woms.backend.model.ProductionSlot;
import com.semiconductor.woms.backend.repository.CustomerRepository;
import com.semiconductor.woms.backend.repository.OrderRepository;
import com.semiconductor.woms.backend.repository.ProductionSlotRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@RestController
@RequestMapping("/api/production")
@RequiredArgsConstructor
@Tag(name = "production")
public class ProductionController {

    private final ProductionSlotRepository slotRepo;
    private final OrderRepository orderRepo;
    private final CustomerRepository customerRepo;

    @GetMapping("/slots")
    public ResponseEntity<Map<String, DailySlotSummary>> getSlots(
            @RequestParam String factoryId,
            @RequestParam String yearMonth) {

        YearMonth ym = YearMonth.parse(yearMonth);
        LocalDate from = ym.atDay(1);
        LocalDate to = ym.atEndOfMonth();

        List<ProductionSlot> slots = slotRepo.findByFactoryIdAndSlotDateBetween(factoryId, from, to);

        Map<String, DailySlotSummary> result = new TreeMap<>();

        for (ProductionSlot slot : slots) {
            String iso = slot.getSlotDate().toString();
            DailySlotSummary entry = result.computeIfAbsent(iso, k -> {
                DailySlotSummary s = new DailySlotSummary();
                s.setCount(0);
                s.setOrders(new ArrayList<>());
                return s;
            });
            entry.setCount(entry.getCount() + slot.getQuantity());

            orderRepo.findById(slot.getOrderId()).ifPresent(order -> {
                boolean delayed = Boolean.TRUE.equals(order.getIsDelayed());
                SlotOrderInfo info = new SlotOrderInfo();
                info.setOrderId(order.getId());
                info.setRequestedDate(order.getCustomerDueDate());
                info.setRescheduledDate(order.getExpectedDueDate());
                info.setDelayDays(order.getDelayDays() == null ? 0 : order.getDelayDays());
                info.setQty(slot.getQuantity());
                info.setScheduleWarning(order.getScheduleWarning());
                info.setIsDelayed(delayed);
                customerRepo.findById(order.getCustomerId()).ifPresent(c -> {
                    info.setCustomerName(c.getName());
                    info.setCustomerCode(c.getCustomerCode());
                });
                entry.getOrders().add(info);
            });
        }

        return ResponseEntity.ok(result);
    }
}
