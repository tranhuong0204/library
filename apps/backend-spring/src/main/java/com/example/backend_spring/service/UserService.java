package com.example.backend_spring.service;

import com.example.backend_spring.dto.user.ChangePasswordRequest;
import com.example.backend_spring.dto.user.UpdateProfileRequest;
import com.example.backend_spring.dto.user.UserProfileResponse;
import com.example.backend_spring.entity.User;
import com.example.backend_spring.exception.BadRequestException;
import com.example.backend_spring.exception.ResourceNotFoundException;
import com.example.backend_spring.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserProfileResponse getMe(String username) {
        User user = findByUsername(username);
        return toProfileResponse(user);
    }

    public UserProfileResponse updateMe(String username, UpdateProfileRequest request) {
        User user = findByUsername(username);

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String newEmail = request.getEmail().trim();

            if (!newEmail.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(newEmail)) {
                throw new BadRequestException("Email đã tồn tại");
            }

            user.setEmail(newEmail);
        }

        if (request.getMajor() != null) {
            user.setMajor(request.getMajor().trim());
        }

        User savedUser = userRepository.save(user);
        return toProfileResponse(savedUser);
    }

    public void changePassword(String username, ChangePasswordRequest request) {
        User user = findByUsername(username);

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new BadRequestException("Mật khẩu cũ không chính xác");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public List<Map<String, Object>> getActivity() {
        return List.of(
                Map.of(
                        "id", 1,
                        "title", "Đăng nhập hệ thống",
                        "description", "Bạn đã đăng nhập vào thư viện số",
                        "type", "LOGIN"
                ),
                Map.of(
                        "id", 2,
                        "title", "Xem thư viện",
                        "description", "Bạn đã truy cập trang thư viện",
                        "type", "VIEW"
                )
        );
    }

    private User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
    }

    private UserProfileResponse toProfileResponse(User user) {
        Integer roleId = user.getRole().name().equals("ADMIN") ? 1 : 3;

        return UserProfileResponse.builder()
                .id(user.getId())
                .UserID(user.getId())

                .username(user.getUsername())
                .Username(user.getUsername())

                .email(user.getEmail())
                .Email(user.getEmail())

                .fullName(user.getFullName())
                .FullName(user.getFullName())

                .major(user.getMajor())
                .Major(user.getMajor())

                .role(user.getRole())
                .RoleID(roleId)

                .active(user.getActive())
                .Status(user.getActive() ? "ACTIVE" : "INACTIVE")

                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
