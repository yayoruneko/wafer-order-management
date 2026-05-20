package com.semiconductor.woms.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserRoleRequest {

    @NotBlank(message = "角色名稱不能為空")
    private String role;
}