package com.example.backend_spring.dto.user;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProfileRequest {

    private String fullName;

    private String email;

    private String major;
}
