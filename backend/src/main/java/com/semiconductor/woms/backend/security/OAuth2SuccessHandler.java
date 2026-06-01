package com.semiconductor.woms.backend.security;

import com.semiconductor.woms.backend.model.User;
import com.semiconductor.woms.backend.model.enums.UserType;
import com.semiconductor.woms.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.UUID;

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private PasswordEncoder passwordEncoder;

    // 👇 讓 Spring 動態讀取前端的網址，預設是 localhost (走 Nginx 的 80 port)
    @Value("${woms.frontend.url:http://localhost}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        
        // 拿到 Google 的 Email
        String email = oAuth2User.getAttribute("email");
        
        // 1. 因為資料庫沒有 email 欄位，我們把 email 當作 username 去尋找
        User user = userRepository.findByUsername(email).orElseGet(() -> {
            
            // 2. 如果沒註冊過，自動幫他建立新帳號
            User newUser = new User();
            
            // ID 產生器 (如果是 UUID)
            newUser.setId(UUID.randomUUID().toString()); 
            
            // 將 Email 塞進 Username 欄位
            newUser.setUsername(email);
            
            // 隨便產生一組亂碼當作密碼 (因為他是用 Google 登入的)
            newUser.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
            
            // 給予最低權限 VIEWER
            newUser.setRole(UserType.VIEWER); 
            
            newUser.setCreatedAt(LocalDateTime.now());
            
            return userRepository.save(newUser);
        });

        // 3. 產生 JWT Token 
        String token = jwtUtils.generateAccessToken(user.getUsername(), user.getRole().name()); 
        
        // 4. 重導回前端 
        String targetUrl = "http://localhost:3000/oauth2/redirect?token=" + token;
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}