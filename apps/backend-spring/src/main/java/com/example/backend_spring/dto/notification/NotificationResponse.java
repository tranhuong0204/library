package com.example.backend_spring.dto.notification;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {

    private Long id;
    private Long NotifID;

    private String title;
    private String Title;

    private String message;
    private String Message;

    private String type;
    private String Type;

    private Boolean isRead;
    private Boolean IsRead;

    private LocalDateTime createdAt;
    private LocalDateTime CreatedAt;
}