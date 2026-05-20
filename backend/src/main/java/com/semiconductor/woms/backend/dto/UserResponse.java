package com.semiconductor.woms.backend.dto;

import com.semiconductor.woms.backend.model.enums.UserType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private String id;
    private String username;
    private UserType role;
    private LocalDateTime createdAt;
}
