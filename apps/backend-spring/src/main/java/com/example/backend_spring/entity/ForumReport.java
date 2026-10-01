package com.example.backend_spring.entity;

import com.example.backend_spring.enums.ReportStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "forum_reports",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_forum_report_target_reporter",
                columnNames = {"targetType", "targetId", "reporterId"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForumReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    private Long postId;

    @Column(length = 20)
    private String targetType;

    private Long targetId;

    private Long commentId;

    private Long parentPostId;

    @Column(length = 500)
    private String commentContentPreview;

    @Column(length = 255)
    private String postTitle;

    @Column(length = 500)
    private String postContentPreview;

    @Column(nullable = false)
    private Long reporterId;

    @Column(length = 100)
    private String reporterUsername;

    @Column(nullable = false, length = 150)
    private String reason;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ReportStatus status;

    private LocalDateTime createdAt;

    private LocalDateTime resolvedAt;

    @Column(length = 100)
    private String resolvedBy;

    @Column(length = 1000)
    private String adminNote;

    @PrePersist
    public void prePersist() {
        if (this.status == null) {
            this.status = ReportStatus.PENDING;
        }

        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
