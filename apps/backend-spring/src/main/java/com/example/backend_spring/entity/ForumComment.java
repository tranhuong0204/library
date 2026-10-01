package com.example.backend_spring.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "forum_comments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForumComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    private LocalDateTime createdAt;

    private Integer likeCount;

    @ManyToOne
    @JoinColumn(name = "post_id")
    private ForumPost post;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private Long parentId;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();

        if (this.likeCount == null) {
            this.likeCount = 0;
        }
    }
}