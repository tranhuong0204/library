package com.example.backend_spring.utils;

import com.example.backend_spring.entity.User;
import com.example.backend_spring.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {

    public static String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("Thiếu token đăng nhập");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            return user.getUsername();
        }

        if (principal instanceof String username) {
            return username;
        }

        throw new UnauthorizedException("Thiếu token đăng nhập");
    }

    public static String getOptionalUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            return user.getUsername();
        }

        if (principal instanceof String username) {
            return "anonymousUser".equals(username) ? null : username;
        }

        return null;
    }
}
