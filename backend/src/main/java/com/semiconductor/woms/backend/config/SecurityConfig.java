package com.semiconductor.woms.backend.config;

import com.semiconductor.woms.backend.security.JwtAccessDeniedHandler;
import com.semiconductor.woms.backend.security.JwtAuthenticationEntryPoint;
import com.semiconductor.woms.backend.security.JwtAuthenticationFilter;
import io.swagger.v3.oas.models.PathItem;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private JwtAuthenticationEntryPoint unauthorizedHandler;

    @Autowired
    private JwtAccessDeniedHandler accessDeniedHandler;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(unauthorizedHandler) // 沒 Token
                        .accessDeniedHandler(accessDeniedHandler)      // 有 Token 但權限不對
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/error").permitAll()

                        // 使用者管理
                        .requestMatchers("/api/users/**").hasAuthority("SUPER_ADMIN")

                        // 訂單相關
                        .requestMatchers(HttpMethod.GET, "/api/orders/**").hasAnyAuthority("VIEWER", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/orders/**").hasAnyAuthority("ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/orders/**").hasAnyAuthority("ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/orders/**").hasAnyAuthority("ADMIN", "SUPER_ADMIN")

                        // 排程與用戶管理
                        .requestMatchers("/scheduling/reschedule-all").hasAnyAuthority("ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/users/**").hasAuthority("SUPER_ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/users/*/role").hasAuthority("SUPER_ADMIN")

                        // 其他所有請求都必須登入
                        .anyRequest().authenticated()
                );
//                .oauth2Login(oauth2 -> oauth2
//                        .successHandler(oAuth2SuccessHandler()) // 處理 SSO 邏輯
//                );;

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
