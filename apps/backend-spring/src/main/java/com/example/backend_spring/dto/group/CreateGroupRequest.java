package com.example.backend_spring.dto.group;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateGroupRequest {

    @NotBlank(message = "Tên nhóm không được để trống")
    private String name;

    private String description;

    private String subject;

    private String visibility;
}