package com.example.backend_spring.dto.user;

import com.example.backend_spring.enums.Role;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileResponse {

    private Long id;
    private Long UserID;

    private String username;
    private String Username;

    private String email;
    private String Email;

    private String fullName;
    private String FullName;

    private String major;
    private String Major;

    private Role role;
    private Integer RoleID;

    private Boolean active;
    private String Status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
