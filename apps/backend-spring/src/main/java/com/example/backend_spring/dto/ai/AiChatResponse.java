package com.example.backend_spring.dto.ai;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
public class AiChatResponse {

    private String message;

    private String conversationId;

    private String conversationTitle;

    private List<Map<String, Object>> messages;

    public AiChatResponse(String message, String conversationId) {
        this.message = message;
        this.conversationId = conversationId;
    }

    public AiChatResponse(
            String message,
            String conversationId,
            String conversationTitle,
            List<Map<String, Object>> messages
    ) {
        this.message = message;
        this.conversationId = conversationId;
        this.conversationTitle = conversationTitle;
        this.messages = messages;
    }
}