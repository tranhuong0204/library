package com.example.backend_spring.dto.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AiChatRequest {

    @NotBlank(message = "Vui lòng nhập câu hỏi")
    @Size(max = 5000, message = "Câu hỏi không được vượt quá 5000 ký tự")
    private String message;

    private String conversationId;
}