package com.example.backend_spring.dto.group;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupChatResponse {

    private Long id;
    private Long ChatID;

    private String content;
    private String Content;

    private String channel;
    private String Channel;

    private Long groupId;
    private Long GroupID;

    private Long userId;
    private Long UserID;

    private String authorName;
    private String AuthorName;

    private String attachmentName;
    private String AttachmentName;

    private String attachmentUrl;
    private String AttachmentUrl;

    private String attachmentType;
    private String AttachmentType;

    private String attachmentMimeType;
    private String AttachmentMimeType;

    private Long attachmentSize;
    private Long AttachmentSize;

    private LocalDateTime createdAt;
    private LocalDateTime CreatedAt;
}
