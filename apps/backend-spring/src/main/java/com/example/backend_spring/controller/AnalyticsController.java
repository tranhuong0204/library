package com.example.backend_spring.controller;

import com.example.backend_spring.entity.AiConversation;
import com.example.backend_spring.entity.AiMessage;
import com.example.backend_spring.entity.Document;
import com.example.backend_spring.entity.User;
import com.example.backend_spring.repository.AiConversationRepository;
import com.example.backend_spring.repository.AiMessageRepository;
import com.example.backend_spring.repository.CategoryRepository;
import com.example.backend_spring.repository.DocumentRepository;
import com.example.backend_spring.repository.NewsRepository;
import com.example.backend_spring.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final AiConversationRepository aiConversationRepository;
    private final AiMessageRepository aiMessageRepository;
    private final CategoryRepository categoryRepository;
    private final NewsRepository newsRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboardStats() {
        List<User> users = userRepository.findAll();
        List<Document> documents = documentRepository.findAll();
        List<AiConversation> aiConversations = aiConversationRepository.findAll();
        List<AiMessage> aiMessages = aiMessageRepository.findAll();

        long totalUsers = users.size();
        long totalDocuments = documents.size();
        long totalAiConversations = aiConversations.size();
        long totalAiMessages = aiMessages.size();

        List<Map<String, Object>> trendingDocuments = documents
                .stream()
                .sorted(Comparator
                        .comparingInt(this::documentInteractionCount)
                        .reversed()
                        .thenComparing(Document::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(8)
                .map(this::toDocumentMap)
                .toList();

        long totalViews = documents.stream()
                .mapToLong(document -> safeInt(document.getViewCount()))
                .sum();
        long totalDownloads = documents.stream()
                .mapToLong(document -> safeInt(document.getDownloadCount()))
                .sum();

        Map<String, Object> counts = new HashMap<>();
        counts.put("users", totalUsers);
        counts.put("documents", totalDocuments);
        counts.put("posts", 0L);
        counts.put("groups", 0L);
        counts.put("categories", categoryRepository.count());
        counts.put("forumCategories", 0L);
        counts.put("news", newsRepository.count());
        counts.put("conversations", totalAiConversations);
        counts.put("aiMessages", totalAiMessages);
        counts.put("views", totalViews);
        counts.put("downloads", totalDownloads);

        Map<String, Object> response = new HashMap<>();
        response.put("counts", counts);
        response.put("totalUsers", totalUsers);
        response.put("totalDocuments", totalDocuments);
        response.put("totalForumPosts", 0L);
        response.put("totalGroups", 0L);
        response.put("totalViews", totalViews);
        response.put("totalDownloads", totalDownloads);
        response.put("totalAiConversations", totalAiConversations);
        response.put("totalAiMessages", totalAiMessages);
        response.put("recentDocuments", documents.stream()
                .sorted(Comparator.comparing(
                        Document::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .limit(5)
                .map(this::toDocumentMap)
                .toList());
        response.put("trendingDocuments", trendingDocuments);
        response.put("topDocuments", trendingDocuments);
        response.put("documentEngagement", trendingDocuments);
        response.put("systemGrowth", buildSystemGrowth(users, documents));
        response.put("aiActivity", buildAiActivity(aiConversations, aiMessages));

        return ResponseEntity.ok(response);
    }

    private List<Map<String, Object>> buildSystemGrowth(
            List<User> users,
            List<Document> documents
    ) {
        List<Map<String, Object>> result = new ArrayList<>();

        for (YearMonth month : recentMonths(6)) {
            Map<String, Object> item = new HashMap<>();
            item.put("month", month.toString());
            item.put("label", formatMonth(month));
            item.put("users", users.stream()
                    .filter(user -> isInMonth(user.getCreatedAt(), month))
                    .count());
            item.put("documents", documents.stream()
                    .filter(document -> isInMonth(document.getCreatedAt(), month))
                    .count());
            item.put("posts", 0L);
            result.add(item);
        }

        return result;
    }

    private List<Map<String, Object>> buildAiActivity(
            List<AiConversation> conversations,
            List<AiMessage> messages
    ) {
        List<Map<String, Object>> result = new ArrayList<>();

        for (YearMonth month : recentMonths(6)) {
            Map<String, Object> item = new HashMap<>();
            item.put("month", month.toString());
            item.put("label", formatMonth(month));
            item.put("conversations", conversations.stream()
                    .filter(conversation -> isInMonth(conversation.getCreatedAt(), month))
                    .count());
            item.put("questions", messages.stream()
                    .filter(message -> isInMonth(message.getCreatedAt(), month))
                    .filter(message -> "USER".equalsIgnoreCase(message.getRole()))
                    .count());
            item.put("answers", messages.stream()
                    .filter(message -> isInMonth(message.getCreatedAt(), month))
                    .filter(message -> "AI".equalsIgnoreCase(message.getRole())
                            || "ASSISTANT".equalsIgnoreCase(message.getRole()))
                    .count());
            result.add(item);
        }

        return result;
    }

    private List<YearMonth> recentMonths(int numberOfMonths) {
        YearMonth currentMonth = YearMonth.now();
        List<YearMonth> months = new ArrayList<>();

        for (int offset = numberOfMonths - 1; offset >= 0; offset--) {
            months.add(currentMonth.minusMonths(offset));
        }

        return months;
    }

    private boolean isInMonth(java.time.LocalDateTime dateTime, YearMonth month) {
        return dateTime != null && YearMonth.from(dateTime).equals(month);
    }

    private String formatMonth(YearMonth month) {
        return month.format(DateTimeFormatter.ofPattern("'T'M/yyyy", Locale.forLanguageTag("vi-VN")));
    }

    private int documentInteractionCount(Document document) {
        return safeInt(document.getViewCount()) + safeInt(document.getDownloadCount());
    }

    private Map<String, Object> toDocumentMap(Document document) {
        Map<String, Object> item = new HashMap<>();

        item.put("id", document.getId());
        item.put("DocID", document.getId());
        item.put("title", document.getTitle());
        item.put("Title", document.getTitle());
        item.put("author", document.getAuthor());
        item.put("Author", document.getAuthor());
        item.put("fileType", document.getFileType());
        item.put("FileType", document.getFileType());
        item.put("viewCount", safeInt(document.getViewCount()));
        item.put("ViewCount", safeInt(document.getViewCount()));
        item.put("downloadCount", safeInt(document.getDownloadCount()));
        item.put("DownloadCount", safeInt(document.getDownloadCount()));
        item.put("interactions", documentInteractionCount(document));
        item.put("createdAt", document.getCreatedAt());
        item.put("CreatedAt", document.getCreatedAt());

        if (document.getCategory() != null) {
            item.put("categoryId", document.getCategory().getId());
            item.put("CategoryID", document.getCategory().getId());
            item.put("categoryName", document.getCategory().getName());
            item.put("CategoryName", document.getCategory().getName());
        }

        return item;
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }
}
