package com.semiconductor.woms.backend.controller;

import com.semiconductor.woms.backend.dto.AuthResponse;
import com.semiconductor.woms.backend.dto.LoginRequest;
import com.semiconductor.woms.backend.dto.RefreshRequest;
import com.semiconductor.woms.backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * 帳密登入：成功後回傳 Access & Refresh Token
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest loginRequest) {
        AuthResponse response = authService.login(
                loginRequest.getUsername(),
                loginRequest.getPassword()
        );
        return ResponseEntity.ok(response);
    }

    /**
     * 刷新 Token：前端 Access Token 過期時呼叫
     */
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refresh(@RequestBody RefreshRequest refreshRequest) {
        String newAccessToken = authService.refresh(refreshRequest.getRefreshToken());
        return ResponseEntity.ok(Collections.singletonMap("accessToken", newAccessToken));
    }

    /**
     * 登出：前端清除 session，後端目前無狀態 (stateless JWT) 故直接回 200
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.ok().build();
    }
}