package com.example.backend_spring.dto.forum;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreatePostRequest {

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 250, message = "Tiêu đề không được vượt quá 250 ký tự")
    private String title;

    @NotBlank(message = "Nội dung không được để trống")
    private String content;

    private Long categoryId;
}
