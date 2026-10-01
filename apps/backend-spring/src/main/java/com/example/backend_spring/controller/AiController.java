package com.example.backend_spring.controller;

import com.example.backend_spring.dto.ai.AiChatRequest;
import com.example.backend_spring.dto.ai.AiChatResponse;
import com.example.backend_spring.service.AiService;
import com.example.backend_spring.utils.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(
            @Valid @RequestBody AiChatRequest request
    ) {
        String username = SecurityUtils.getCurrentUsername();
        AiChatResponse response = aiService.chat(request, username);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/conversations")
    public ResponseEntity<?> getConversations() {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(aiService.getConversations(username));
    }

    @PostMapping("/conversations")
    public ResponseEntity<?> createConversation(
            @RequestBody(required = false) Map<String, String> body
    ) {
        String username = SecurityUtils.getCurrentUsername();

        String title = null;
        if (body != null) {
            title = body.get("title");
        }

        return ResponseEntity.ok(aiService.createConversation(username, title));
    }

    @DeleteMapping("/conversations/{conversationId}")
    public ResponseEntity<?> deleteConversation(
            @PathVariable Long conversationId
    ) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(aiService.deleteConversation(conversationId, username));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<?> getMessages(
            @PathVariable Long conversationId
    ) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(aiService.getMessages(conversationId, username));
    }

    @PostMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<AiChatResponse> sendMessage(
            @PathVariable Long conversationId,
            @Valid @RequestBody AiChatRequest request
    ) {
        String username = SecurityUtils.getCurrentUsername();

        AiChatResponse response = aiService.sendMessage(
                conversationId,
                request,
                username
        );

        return ResponseEntity.ok(response);
    }
}