package com.example.backend_spring.dto;

import com.example.backend_spring.enums.Role;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String token;

    private String tokenType;

    private Long id;

    private String username;

    private String email;

    private String fullName;

    private Role role;
}