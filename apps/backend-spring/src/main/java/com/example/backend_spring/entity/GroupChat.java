package com.example.backend_spring.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "group_chats")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupChat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(nullable = false)
    private String channel;

    @Column(length = 255)
    private String attachmentName;

    @Column(length = 500)
    private String attachmentUrl;

    @Column(length = 20)
    private String attachmentType;

    @Column(length = 150)
    private String attachmentMimeType;

    private Long attachmentSize;

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "group_id")
    private StudyGroup group;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();

        if (this.channel == null || this.channel.isBlank()) {
            this.channel = "general";
        }
    }
}
