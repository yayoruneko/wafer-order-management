package com.semiconductor.woms.backend.service;

import com.semiconductor.woms.backend.dto.AuthResponse; // 需建立此 DTO 包含雙 Token
import com.semiconductor.woms.backend.model.User;
import com.semiconductor.woms.backend.repository.UserRepository;
import com.semiconductor.woms.backend.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    /**
     * 驗證帳密並發放雙 Token
     */
    public AuthResponse login(String username, String password) {
        // 1. 查找使用者 (從 user 表)
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "帳號或密碼錯誤"));

        // 2. 驗證 BCrypt 密碼 (password_hash)
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "帳號或密碼錯誤");
        }

        // 3. 簽發 Access Token 與 Refresh Token
        String accessToken = jwtUtils.generateAccessToken(user.getUsername(), user.getRole().name());
        String refreshToken = jwtUtils.generateRefreshToken(user.getUsername());

        return new AuthResponse(accessToken, refreshToken, user.getUsername(), user.getRole());
    }

    /**
     * 驗證 Refresh Token 並發放新的 Access Token
     */
    public String refresh(String refreshToken) {
        // 1. 驗證 Refresh Token 的合法性與是否過期
        if (refreshToken != null && jwtUtils.validateJwtToken(refreshToken)) {
            String username = jwtUtils.getUserNameFromJwtToken(refreshToken);

            // 2. 重新從資料庫確認使用者狀態
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "使用者不存在"));

            // 3. 簽發新的 Access Token
            return jwtUtils.generateAccessToken(user.getUsername(), user.getRole().name());
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Refresh Token 無效或已過期");
    }
}