package com.semiconductor.woms.backend.service;

import com.semiconductor.woms.backend.model.User;
import com.semiconductor.woms.backend.model.enums.UserType;
import com.semiconductor.woms.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public List<User> findAllUsers() {
        return userRepository.findAll();
    }

    public void updateUserRole(String userId, String roleName) {
        // 1. 檢查使用者是否存在
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到使用者 ID: " + userId));

        try {
            // 2. 轉換角色字串為 Enum
            UserType newRole = UserType.valueOf(roleName.toUpperCase());

            user.setRole(newRole);
            userRepository.save(user);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "無效的角色名稱: " + roleName);
        }
    }
}