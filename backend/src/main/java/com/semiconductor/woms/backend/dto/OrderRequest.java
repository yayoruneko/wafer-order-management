package com.semiconductor.woms.backend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class OrderRequest {
    @NotBlank
    private String customerId;

    @NotNull
    @Min(25) @Max(2500)
    private Integer quantity;

    @NotNull
    @Future
    private LocalDate customerDueDate;

    @NotBlank
    private String factoryId;

    @NotBlank
    private String waferTypeId;

}
