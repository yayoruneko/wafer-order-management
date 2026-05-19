package com.semiconductor.woms.backend.controller;

import com.semiconductor.woms.backend.dto.ApiResponse;
import com.semiconductor.woms.backend.dto.UserResponse;
import com.semiconductor.woms.backend.dto.UserRoleRequest;
import com.semiconductor.woms.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.findAllUsers());
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<ApiResponse> updateUserRole(
            @PathVariable String id,
            @Valid @RequestBody UserRoleRequest request) {

        userService.updateUserRole(id, request.getRole());

        return ResponseEntity.ok(new ApiResponse(200, "使用者 " + id + " 的角色已更新為 " + request.getRole()));
    }
}