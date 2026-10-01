package com.example.backend_spring.dto.group;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SendMessageRequest {

    @NotBlank(message = "Nội dung tin nhắn không được để trống")
    private String content;

    private String channel;
}