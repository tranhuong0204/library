package com.example.backend_spring.controller;

import com.example.backend_spring.dto.AuthResponse;
import com.example.backend_spring.dto.ForgotPasswordRequest;
import com.example.backend_spring.dto.LoginRequest;
import com.example.backend_spring.dto.RegisterRequest;
import com.example.backend_spring.dto.ResetPasswordRequest;
import com.example.backend_spring.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request
    ) {

        return ResponseEntity.ok(
                authService.register(request)
        );
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {

        return ResponseEntity.ok(
                authService.login(request)
        );
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {

        return ResponseEntity.ok(
                authService.forgotPassword(request)
        );
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) {

        return ResponseEntity.ok(
                authService.resetPassword(request)
        );
    }
}