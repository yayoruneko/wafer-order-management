package com.semiconductor.woms.backend.model;

import com.semiconductor.woms.backend.model.enums.UserType;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
public class User {

    @Id
    private String id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserType role;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

//    //DB沒有
//    @Column(unique = true)
//    private String email;
}