package com.example.backend_spring.entity;

import com.example.backend_spring.enums.Role;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String username;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(length = 150)
    private String fullName;

    @Column(length = 150)
    private String major;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(nullable = false)
    private Boolean active;

    @Column(length = 255)
    private String resetPasswordToken;

    private LocalDateTime resetPasswordTokenExpiry;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (Role.ADMIN.equals(this.role) || Role.LIBRARIAN.equals(this.role) || this.active == null) {
            this.active = true;
        }

        if (this.role == null) {
            this.role = Role.USER;
        }

        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        if (Role.ADMIN.equals(this.role) || Role.LIBRARIAN.equals(this.role)) {
            this.active = true;
        }
        this.updatedAt = LocalDateTime.now();
    }
}
