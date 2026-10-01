package com.example.backend_spring.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "forum_posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForumPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 250)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    private String attachmentName;

    private String attachmentUrl;

    private String attachmentType;

    private String attachmentMimeType;

    private Long attachmentSize;

    private Integer viewCount;

    private Integer likeCount;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private ForumCategory category;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @PrePersist
    public void prePersist() {
        if (this.viewCount == null) {
            this.viewCount = 0;
        }

        if (this.likeCount == null) {
            this.likeCount = 0;
        }

        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
