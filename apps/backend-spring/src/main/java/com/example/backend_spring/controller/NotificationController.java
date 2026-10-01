package com.example.backend_spring.controller;

import com.example.backend_spring.service.NotificationService;
import com.example.backend_spring.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<?> getNotifications() {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(notificationService.getNotifications(username));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable Long id
    ) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(notificationService.markAsRead(id, username));
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead() {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(notificationService.markAllAsRead(username));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(
            @PathVariable Long id
    ) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(notificationService.deleteNotification(id, username));
    }
}