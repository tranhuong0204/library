package com.example.backend_spring.service;

import com.example.backend_spring.dto.AuthResponse;
import com.example.backend_spring.dto.ForgotPasswordRequest;
import com.example.backend_spring.dto.LoginRequest;
import com.example.backend_spring.dto.RegisterRequest;
import com.example.backend_spring.dto.ResetPasswordRequest;
import com.example.backend_spring.entity.User;
import com.example.backend_spring.enums.Role;
import com.example.backend_spring.exception.BadRequestException;
import com.example.backend_spring.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PasswordResetMailService passwordResetMailService;

    public AuthResponse register(RegisterRequest request) {
        String username = request.getUsername() != null ? request.getUsername().trim() : "";
        String email = request.getEmail() != null ? request.getEmail().trim() : "";
        String password = request.getPassword() != null ? request.getPassword() : "";
        String fullName = request.getFullName() != null ? request.getFullName().trim() : "";

        if (userRepository.existsByUsername(username)) {
            throw new BadRequestException("Username đã tồn tại");
        }

        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email đã tồn tại");
        }

        User user = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(password))
                .fullName(fullName)
                .role(Role.USER)
                .active(true)
                .build();

        User savedUser = userRepository.save(user);
        String token = jwtService.generateToken(savedUser);

        return buildAuthResponse(savedUser, token);
    }

    public AuthResponse login(LoginRequest request) {
        String usernameOrEmail = request.getUsernameOrEmail() != null
                ? request.getUsernameOrEmail().trim()
                : "";

        User user = userRepository.findByUsernameOrEmail(usernameOrEmail, usernameOrEmail)
                .orElseThrow(() -> new BadRequestException("Tài khoản không tồn tại"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadRequestException("Mật khẩu không chính xác");
        }

        if (user.getActive() != null && !user.getActive()) {
            throw new BadRequestException("Tài khoản đã bị khóa");
        }

        String token = jwtService.generateToken(user);

        return buildAuthResponse(user, token);
    }

    public Map<String, Object> forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim() : "";

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null || Boolean.FALSE.equals(user.getActive())) {
            return genericForgotPasswordResponse();
        }

        String resetToken = UUID.randomUUID().toString();

        user.setResetPasswordToken(resetToken);
        user.setResetPasswordTokenExpiry(LocalDateTime.now().plusMinutes(30));

        userRepository.save(user);

        boolean emailDelivered = passwordResetMailService.sendResetLink(user.getEmail(), resetToken);
        Map<String, Object> response = new LinkedHashMap<>(genericForgotPasswordResponse());
        passwordResetMailService.developmentResetUrl(resetToken, emailDelivered)
                .ifPresent(url -> response.put("resetUrl", url));
        return response;
    }

    public Map<String, Object> resetPassword(ResetPasswordRequest request) {
        String token = request.getToken() != null ? request.getToken().trim() : "";
        String newPassword = request.getNewPassword() != null ? request.getNewPassword() : "";

        User user = userRepository.findByResetPasswordToken(token)
                .orElseThrow(() -> new BadRequestException("Token không hợp lệ hoặc không tồn tại"));

        LocalDateTime expiryTime = user.getResetPasswordTokenExpiry();

        if (expiryTime == null || expiryTime.isBefore(LocalDateTime.now())) {
            user.setResetPasswordToken(null);
            user.setResetPasswordTokenExpiry(null);
            userRepository.save(user);

            throw new BadRequestException("Token đã hết hạn. Vui lòng gửi lại yêu cầu quên mật khẩu");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetPasswordToken(null);
        user.setResetPasswordTokenExpiry(null);

        userRepository.save(user);

        return Map.of("message", "Đặt lại mật khẩu thành công");
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
    }

    private Map<String, Object> genericForgotPasswordResponse() {
        return Map.of(
                "message",
                "Nếu email tồn tại và tài khoản đang hoạt động, hướng dẫn đặt lại mật khẩu sẽ được gửi."
        );
    }
}
