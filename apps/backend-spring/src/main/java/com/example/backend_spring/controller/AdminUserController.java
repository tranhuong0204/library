package com.example.backend_spring.controller;

import com.example.backend_spring.entity.User;
import com.example.backend_spring.enums.Role;
import com.example.backend_spring.exception.BadRequestException;
import com.example.backend_spring.exception.ResourceNotFoundException;
import com.example.backend_spring.repository.UserRepository;
import com.example.backend_spring.service.AdminUserDeletionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminUserDeletionService adminUserDeletionService;

    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        List<Map<String, Object>> users = userRepository.findAll()
                .stream()
                .map(this::toUserMap)
                .toList();

        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        return ResponseEntity.ok(toUserMap(user));
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> request) {
        String username = getString(request, "username");
        String email = getString(request, "email");
        String password = getString(request, "password");
        String fullName = getString(request, "fullName");
        String roleText = getString(request, "role");

        if (username.isBlank()) {
            throw new BadRequestException("Username không được để trống");
        }

        if (email.isBlank()) {
            throw new BadRequestException("Email không được để trống");
        }

        if (password.isBlank()) {
            throw new BadRequestException("Mật khẩu không được để trống");
        }

        if (password.length() < 6) {
            throw new BadRequestException("Mật khẩu phải có ít nhất 6 ký tự");
        }

        if (isUsernameExists(username, null)) {
            throw new BadRequestException("Username đã tồn tại");
        }

        if (isEmailExists(email, null)) {
            throw new BadRequestException("Email đã tồn tại");
        }

        Role role = parseRole(roleText);

        User user = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(password))
                .fullName(fullName)
                .role(role)
                .active(true)
                .build();

        User savedUser = userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Tạo người dùng thành công");
        response.put("user", toUserMap(savedUser));

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        String username = getString(request, "username");
        String email = getString(request, "email");
        String fullName = getString(request, "fullName");
        String password = getString(request, "password");
        String roleText = getString(request, "role");

        if (username.isBlank()) {
            throw new BadRequestException("Username không được để trống");
        }

        if (email.isBlank()) {
            throw new BadRequestException("Email không được để trống");
        }

        if (!password.isBlank() && password.length() < 6) {
            throw new BadRequestException("Mật khẩu mới phải có ít nhất 6 ký tự");
        }

        if (isUsernameExists(username, id)) {
            throw new BadRequestException("Username đã tồn tại");
        }

        if (isEmailExists(email, id)) {
            throw new BadRequestException("Email đã tồn tại");
        }

        user.setUsername(username);
        user.setEmail(email);
        user.setFullName(fullName);

        if (!password.isBlank()) {
            user.setPassword(passwordEncoder.encode(password));
        }

        if (!roleText.isBlank()) {
            user.setRole(parseRole(roleText));
        }

        User savedUser = userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Cập nhật người dùng thành công");
        response.put("user", toUserMap(savedUser));

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        adminUserDeletionService.deleteUser(id);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Xóa người dùng thành công");
        response.put("deletedId", id);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateUserStatus(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        if (Role.ADMIN.equals(user.getRole())) {
            throw new BadRequestException("Tài khoản quản trị luôn hoạt động và không thể bị khóa");
        }

        Boolean enabled = getBoolean(request.get("enabled"));

        if (enabled == null) {
            String status = getString(request, "status");
            enabled = status.equalsIgnoreCase("ACTIVE")
                    || status.equalsIgnoreCase("ENABLED")
                    || status.equalsIgnoreCase("TRUE")
                    || status.equalsIgnoreCase("1");
        }

        user.setActive(enabled);
        User savedUser = userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("message", enabled ? "Đã mở khóa người dùng" : "Đã khóa người dùng");
        response.put("user", toUserMap(savedUser));

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        String roleText = getString(request, "role");
        String roleIdText = getString(request, "roleId");

        Role role = parseRole(!roleText.isBlank() ? roleText : roleIdText);
        user.setRole(role);
        if (Role.ADMIN.equals(role)) {
            user.setActive(true);
        }

        User savedUser = userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Cập nhật vai trò thành công");
        response.put("user", toUserMap(savedUser));

        return ResponseEntity.ok(response);
    }

    private Map<String, Object> toUserMap(User user) {
        Map<String, Object> item = new HashMap<>();

        item.put("id", user.getId());
        item.put("UserID", user.getId());
        item.put("userId", user.getId());

        item.put("username", user.getUsername());
        item.put("Username", user.getUsername());

        item.put("email", user.getEmail());
        item.put("Email", user.getEmail());

        item.put("fullName", user.getFullName());
        item.put("FullName", user.getFullName());

        item.put("role", user.getRole() != null ? user.getRole().name() : Role.USER.name());
        item.put("Role", user.getRole() != null ? user.getRole().name() : Role.USER.name());
        item.put("roleName", user.getRole() != null ? user.getRole().name() : Role.USER.name());
        item.put("RoleName", user.getRole() != null ? user.getRole().name() : Role.USER.name());

        item.put("active", Boolean.TRUE.equals(user.getActive()));
        item.put("Active", Boolean.TRUE.equals(user.getActive()));
        item.put("enabled", Boolean.TRUE.equals(user.getActive()));
        item.put("Enabled", Boolean.TRUE.equals(user.getActive()));
        item.put("status", Boolean.TRUE.equals(user.getActive()) ? "ACTIVE" : "LOCKED");
        item.put("Status", Boolean.TRUE.equals(user.getActive()) ? "ACTIVE" : "LOCKED");

        item.put("createdAt", user.getCreatedAt());
        item.put("CreatedAt", user.getCreatedAt());
        item.put("updatedAt", user.getUpdatedAt());
        item.put("UpdatedAt", user.getUpdatedAt());

        return item;
    }

    private String getString(Map<String, Object> request, String key) {
        Object value = request.get(key);
        return value == null ? "" : String.valueOf(value).trim();
    }

    private Boolean getBoolean(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof Boolean booleanValue) {
            return booleanValue;
        }

        String text = String.valueOf(value).trim();

        if (text.equalsIgnoreCase("true")
                || text.equalsIgnoreCase("1")
                || text.equalsIgnoreCase("ACTIVE")
                || text.equalsIgnoreCase("ENABLED")) {
            return true;
        }

        if (text.equalsIgnoreCase("false")
                || text.equalsIgnoreCase("0")
                || text.equalsIgnoreCase("LOCKED")
                || text.equalsIgnoreCase("DISABLED")) {
            return false;
        }

        return null;
    }

    private Role parseRole(String roleText) {
        if (roleText == null || roleText.isBlank()) {
            return Role.USER;
        }

        String normalized = roleText.trim().toUpperCase();

        if (normalized.equals("1")) {
            return Role.USER;
        }

        if (normalized.equals("2")) {
            return Role.ADMIN;
        }

        if (normalized.equals("3")) {
            return Role.LIBRARIAN;
        }

        if (normalized.startsWith("ROLE_")) {
            normalized = normalized.replace("ROLE_", "");
        }

        try {
            return Role.valueOf(normalized);
        } catch (Exception e) {
            return Role.USER;
        }
    }

    private boolean isUsernameExists(String username, Long currentUserId) {
        return userRepository.findAll()
                .stream()
                .anyMatch(user ->
                        user.getUsername() != null
                                && user.getUsername().equalsIgnoreCase(username)
                                && (currentUserId == null || !user.getId().equals(currentUserId))
                );
    }

    private boolean isEmailExists(String email, Long currentUserId) {
        return userRepository.findAll()
                .stream()
                .anyMatch(user ->
                        user.getEmail() != null
                                && user.getEmail().equalsIgnoreCase(email)
                                && (currentUserId == null || !user.getId().equals(currentUserId))
                );
    }
}
