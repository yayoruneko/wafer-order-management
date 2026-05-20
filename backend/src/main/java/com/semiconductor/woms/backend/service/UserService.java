package com.semiconductor.woms.backend.service;

import com.semiconductor.woms.backend.dto.UserResponse;
import com.semiconductor.woms.backend.model.User;
import com.semiconductor.woms.backend.model.enums.UserType;
import com.semiconductor.woms.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public List<UserResponse> findAllUsers() {
        return userRepository.findAll().stream()
                .map(u -> new UserResponse(u.getId(), u.getUsername(), u.getRole(), u.getCreatedAt()))
                .collect(Collectors.toList());
    }

    public void updateUserRole(String userId, String roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到使用者 ID: " + userId));

        if (user.getRole() == UserType.SUPER_ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "無法變更 SUPER_ADMIN 的角色");
        }

        try {
            UserType newRole = UserType.valueOf(roleName.toUpperCase());
            if (newRole == UserType.SUPER_ADMIN) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "無法將使用者提升為 SUPER_ADMIN");
            }
            user.setRole(newRole);
            userRepository.save(user);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "無效的角色名稱: " + roleName);
        }
    }
}