package com.example.backend_spring.controller;

import com.example.backend_spring.dto.user.ChangePasswordRequest;
import com.example.backend_spring.dto.user.UpdateProfileRequest;
import com.example.backend_spring.dto.user.UserProfileResponse;
import com.example.backend_spring.service.UserService;
import com.example.backend_spring.utils.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMe() {
        String username = SecurityUtils.getCurrentUsername();
        UserProfileResponse response = userService.getMe(username);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateMe(
            @Valid @RequestBody UpdateProfileRequest updateProfileRequest
    ) {
        String username = SecurityUtils.getCurrentUsername();
        UserProfileResponse response = userService.updateMe(username, updateProfileRequest);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @Valid @RequestBody ChangePasswordRequest changePasswordRequest
    ) {
        String username = SecurityUtils.getCurrentUsername();
        userService.changePassword(username, changePasswordRequest);
        return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công"));
    }

    @GetMapping("/activity")
    public ResponseEntity<?> getActivity() {
        return ResponseEntity.ok(userService.getActivity());
    }
}