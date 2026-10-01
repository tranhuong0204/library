package com.example.backend_spring.entity;

import com.example.backend_spring.enums.NewsStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "news")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class News {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "NVARCHAR(255)")
    private String title;

    @Column(unique = true, columnDefinition = "NVARCHAR(255)")
    private String slug;

    @Column(columnDefinition = "NVARCHAR(1000)")
    private String summary;

    @Column(columnDefinition = "LONGTEXT")
    private String content;

    @Column(columnDefinition = "TEXT")
    private String thumbnailUrl;

    @Column(columnDefinition = "NVARCHAR(100)")
    private String category;

    private Boolean featured;

    private Long viewCount;

    @Enumerated(EnumType.STRING)
    private NewsStatus status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.updatedAt == null) {
            this.updatedAt = this.createdAt;
        }

        if (this.viewCount == null) {
            this.viewCount = 0L;
        }

        if (this.featured == null) {
            this.featured = false;
        }

        if (this.status == null) {
            this.status = NewsStatus.PUBLISHED;
        }
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
