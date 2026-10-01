package com.example.backend_spring.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "study_groups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyGroup {

    public static final String VISIBILITY_PUBLIC = "PUBLIC";
    public static final String VISIBILITY_PRIVATE = "PRIVATE";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String subject;

    @Column(nullable = false, length = 20)
    private String visibility;

    private Integer memberCount;

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;

    @PrePersist
    public void prePersist() {
        if (this.memberCount == null) {
            this.memberCount = 1;
        }

        if (this.visibility == null || this.visibility.isBlank()) {
            this.visibility = VISIBILITY_PUBLIC;
        }

        this.visibility = this.visibility.trim().toUpperCase();
        this.createdAt = LocalDateTime.now();
    }
}