package com.example.backend_spring.service;

import com.example.backend_spring.dto.notification.NotificationResponse;
import com.example.backend_spring.entity.Notification;
import com.example.backend_spring.entity.User;
import com.example.backend_spring.enums.Role;
import com.example.backend_spring.exception.ForbiddenException;
import com.example.backend_spring.exception.ResourceNotFoundException;
import com.example.backend_spring.repository.NotificationRepository;
import com.example.backend_spring.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public List<NotificationResponse> getNotifications(String username) {
        User user = getUserByUsername(username);

        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public NotificationResponse markAsRead(Long id, String username) {
        User user = getUserByUsername(username);

        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo"));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Bạn không có quyền cập nhật thông báo này");
        }

        notification.setReadStatus(true);
        Notification saved = notificationRepository.save(notification);

        return toResponse(saved);
    }

    public Map<String, Object> markAllAsRead(String username) {
        User user = getUserByUsername(username);

        List<Notification> notifications =
                notificationRepository.findByUserIdAndReadStatusFalse(user.getId());

        notifications.forEach(notification -> notification.setReadStatus(true));

        notificationRepository.saveAll(notifications);

        return Map.of("message", "Đã đánh dấu tất cả thông báo là đã đọc");
    }

    public Map<String, Object> deleteNotification(Long id, String username) {
        User user = getUserByUsername(username);

        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo"));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Bạn không có quyền xóa thông báo này");
        }

        notificationRepository.delete(notification);

        return Map.of("message", "Đã xóa thông báo");
    }

    public NotificationResponse createNotification(
            User user,
            String title,
            String message,
            String type
    ) {
        if (user == null) {
            throw new ResourceNotFoundException("Không tìm thấy người nhận thông báo");
        }

        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .readStatus(false)
                .build();

        Notification saved = notificationRepository.save(notification);

        return toResponse(saved);
    }

    public List<NotificationResponse> createNotificationForAdminsAndOwner(
            User owner,
            String title,
            String message,
            String type
    ) {
        List<User> recipients = new ArrayList<>();

        if (owner != null) {
            recipients.add(owner);
        }

        List<User> admins = userRepository.findByRole(Role.ADMIN);
        recipients.addAll(admins);

        Set<Long> sentUserIds = new HashSet<>();
        List<NotificationResponse> responses = new ArrayList<>();

        for (User recipient : recipients) {
            if (recipient == null || recipient.getId() == null) {
                continue;
            }

            if (!sentUserIds.add(recipient.getId())) {
                continue;
            }

            responses.add(createNotification(recipient, title, message, type));
        }

        return responses;
    }

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
    }

    private NotificationResponse toResponse(Notification notification) {
        Boolean isRead = notification.getReadStatus() != null && notification.getReadStatus();

        return NotificationResponse.builder()
                .id(notification.getId())
                .NotifID(notification.getId())

                .title(notification.getTitle())
                .Title(notification.getTitle())

                .message(notification.getMessage())
                .Message(notification.getMessage())

                .type(notification.getType())
                .Type(notification.getType())

                .isRead(isRead)
                .IsRead(isRead)

                .createdAt(notification.getCreatedAt())
                .CreatedAt(notification.getCreatedAt())
                .build();
    }
}
