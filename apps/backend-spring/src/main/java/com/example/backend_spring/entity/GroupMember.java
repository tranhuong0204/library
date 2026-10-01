package com.example.backend_spring.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "group_members",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"group_id", "user_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupMember {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_APPROVED = "APPROVED";
    public static final String STATUS_REJECTED = "REJECTED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime joinedAt;

    @Column(nullable = false, length = 20)
    private String status;

    @ManyToOne
    @JoinColumn(name = "group_id")
    private StudyGroup group;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @PrePersist
    public void prePersist() {
        this.joinedAt = LocalDateTime.now();

        if (this.status == null || this.status.isBlank()) {
            this.status = STATUS_APPROVED;
        }

        this.status = this.status.trim().toUpperCase();
    }
}