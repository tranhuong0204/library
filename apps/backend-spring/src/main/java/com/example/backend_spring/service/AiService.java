package com.example.backend_spring.service;

import com.example.backend_spring.dto.ai.AiChatRequest;
import com.example.backend_spring.dto.ai.AiChatResponse;
import com.example.backend_spring.entity.AiConversation;
import com.example.backend_spring.entity.AiMessage;
import com.example.backend_spring.entity.User;
import com.example.backend_spring.exception.BadRequestException;
import com.example.backend_spring.exception.ResourceNotFoundException;
import com.example.backend_spring.repository.AiConversationRepository;
import com.example.backend_spring.repository.AiMessageRepository;
import com.example.backend_spring.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

    @Value("${ai.service.base-url}")
    private String aiServiceBaseUrl;

    private final AiConversationRepository aiConversationRepository;
    private final AiMessageRepository aiMessageRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;

    private String getAiServiceUrl() {
        return aiServiceBaseUrl + "/api/chat";
    }

    private String getAiIngestUrl() {
        return aiServiceBaseUrl + "/api/ingest";
    }

    public AiChatResponse chat(AiChatRequest request, String username) {
        User user = getUserByUsername(username);

        Long conversationId = parseConversationId(request.getConversationId());

        AiConversation conversation;

        if (conversationId != null) {
            conversation = aiConversationRepository.findByIdAndUserId(conversationId, user.getId())
                    .orElseGet(() -> createConversationEntity(user, buildTitleFromMessage(request.getMessage())));
        } else {
            conversation = createConversationEntity(user, buildTitleFromMessage(request.getMessage()));
        }

        return sendMessage(conversation.getId(), request, username);
    }

    public List<Map<String, Object>> getConversations(String username) {
        User user = getUserByUsername(username);

        return aiConversationRepository.findByUserIdOrderByUpdatedAtDesc(user.getId())
                .stream()
                .map(conversation -> Map.<String, Object>of(
                        "id", conversation.getId(),
                        "conversationId", conversation.getId(),
                        "title", conversation.getTitle(),
                        "createdAt", conversation.getCreatedAt(),
                        "updatedAt", conversation.getUpdatedAt()
                ))
                .toList();
    }

    public Map<String, Object> createConversation(String username, String title) {
        User user = getUserByUsername(username);

        String finalTitle = title == null || title.trim().isEmpty()
                ? "Cuộc trò chuyện mới"
                : title.trim();

        AiConversation conversation = createConversationEntity(user, finalTitle);

        return Map.of(
                "id", conversation.getId(),
                "conversationId", conversation.getId(),
                "title", conversation.getTitle(),
                "createdAt", conversation.getCreatedAt(),
                "updatedAt", conversation.getUpdatedAt()
        );
    }

    @Transactional
    public Map<String, Object> deleteConversation(Long conversationId, String username) {
        User user = getUserByUsername(username);

        AiConversation conversation = aiConversationRepository.findByIdAndUserId(conversationId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cuộc trò chuyện"));

        aiMessageRepository.deleteByConversationId(conversation.getId());
        aiConversationRepository.delete(conversation);

        return Map.of("message", "Đã xóa cuộc trò chuyện");
    }

    public List<Map<String, Object>> getMessages(Long conversationId, String username) {
        User user = getUserByUsername(username);

        AiConversation conversation = aiConversationRepository.findByIdAndUserId(conversationId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cuộc trò chuyện"));

        return aiMessageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId())
                .stream()
                .map(message -> Map.<String, Object>of(
                        "id", message.getId(),
                        "role", message.getRole(),
                        "content", message.getContent(),
                        "createdAt", message.getCreatedAt()
                ))
                .toList();
    }

    public AiChatResponse sendMessage(
            Long conversationId,
            AiChatRequest request,
            String username
    ) {
        if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            throw new BadRequestException("Vui lòng nhập câu hỏi.");
        }

        User user = getUserByUsername(username);

        AiConversation conversation = aiConversationRepository.findByIdAndUserId(conversationId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cuộc trò chuyện"));

        String userMessage = request.getMessage().trim();

        AiMessage savedUserMessage = AiMessage.builder()
                .conversation(conversation)
                .role("USER")
                .content(userMessage)
                .build();

        aiMessageRepository.save(savedUserMessage);

        if (conversation.getTitle() == null
                || conversation.getTitle().isBlank()
                || "Đoạn chat mới".equalsIgnoreCase(conversation.getTitle())
                || "Cuộc trò chuyện mới".equalsIgnoreCase(conversation.getTitle())) {
            conversation.setTitle(buildTitleFromMessage(userMessage));
        }

        List<AiMessage> history =
                aiMessageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId());

        String aiAnswer = callAiService(
                userMessage,
                String.valueOf(conversation.getId()),
                history
        );

        AiMessage savedAiMessage = AiMessage.builder()
                .conversation(conversation)
                .role("AI")
                .content(aiAnswer)
                .build();

        aiMessageRepository.save(savedAiMessage);

        aiConversationRepository.save(conversation);

        return new AiChatResponse(
                aiAnswer,
                String.valueOf(conversation.getId())
        );
    }

    public void ingestDocument(Long documentId, String fileUrl, String title) {
        try {
            if (fileUrl == null || fileUrl.isBlank()) {
                return;
            }

            Map<String, Object> body = new HashMap<>();
            body.put("documentId", documentId == null ? "" : String.valueOf(documentId));
            body.put("fileUrl", fileUrl);
            body.put("title", title == null ? "" : title.trim());

            restTemplate.postForObject(getAiIngestUrl(), body, Map.class);
        } catch (Exception e) {
            log.error("Không thể ingest tài liệu vào AI: {}", e.getMessage());
        }
    }

    public void ingestDocument(String fileUrl, String title) {
        ingestDocument(null, fileUrl, title);
    }

    public void removeDocument(Long documentId) {
        try {
            if (documentId == null) {
                return;
            }

            String url = aiServiceBaseUrl + "/api/vector/document/" + documentId;
            restTemplate.delete(url);

        } catch (Exception e) {
            log.error("Không thể xóa vector AI cho documentId={}: {}", documentId, e.getMessage());
        }
    }

    private String callAiService(
            String message,
            String conversationId,
            List<AiMessage> history
    ) {
        try {
            Map<String, Object> body = new HashMap<>();

            List<Map<String, String>> historyPayload = history.stream()
                    .limit(Math.max(0, history.size() - 1))
                    .skip(Math.max(0, history.size() - 11))
                    .map(m -> Map.of(
                            "role", m.getRole(),
                            "content", m.getContent()
                    ))
                    .toList();

            body.put("message", message);
            body.put("conversationId", conversationId == null ? "" : conversationId);
            body.put("history", historyPayload);

            Map response = restTemplate.postForObject(getAiServiceUrl(), body, Map.class);

            if (response == null) {
                return "AI service không trả về dữ liệu.";
            }

            return response.get("message") != null
                    ? response.get("message").toString()
                    : "AI không có phản hồi.";
        } catch (Exception e) {
            return "Không kết nối được AI service. Hãy kiểm tra FastAPI ở port 8000 đã chạy chưa.";
        }
    }

    private AiConversation createConversationEntity(User user, String title) {
        AiConversation conversation = AiConversation.builder()
                .user(user)
                .title(title == null || title.trim().isEmpty() ? "Cuộc trò chuyện mới" : title.trim())
                .build();

        return aiConversationRepository.save(conversation);
    }

    private String buildTitleFromMessage(String message) {
        if (message == null || message.trim().isEmpty()) {
            return "Cuộc trò chuyện mới";
        }

        String cleanMessage = message.trim().replaceAll("\\s+", " ");

        if (cleanMessage.length() <= 45) {
            return cleanMessage;
        }

        return cleanMessage.substring(0, 45) + "...";
    }

    private Long parseConversationId(String conversationId) {
        if (conversationId == null || conversationId.trim().isEmpty()) {
            return null;
        }

        try {
            return Long.parseLong(conversationId.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
    }
}
