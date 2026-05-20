package com.semiconductor.woms.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class OrderUpdateRequest {

    @NotNull
    @Min(25) @Max(2500)
    private Integer quantity;

    @NotNull
    private LocalDate customerDueDate;
}
