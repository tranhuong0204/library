package com.example.backend_spring.controller;

import com.example.backend_spring.dto.news.NewsRequest;
import com.example.backend_spring.service.NewsService;
import com.example.backend_spring.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/news")
@RequiredArgsConstructor
public class AdminNewsController {

    private final NewsService newsService;

    @GetMapping
    public ResponseEntity<?> getAllNews() {
        SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(newsService.getAllNewsForAdmin());
    }

    @PostMapping
    public ResponseEntity<?> createNews(
            @RequestBody NewsRequest newsRequest
    ) {
        SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(newsService.createNews(newsRequest));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateNews(
            @PathVariable Long id,
            @RequestBody NewsRequest newsRequest
    ) {
        SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(newsService.updateNews(id, newsRequest));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNews(
            @PathVariable Long id
    ) {
        SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(
                Map.of("message", newsService.deleteNews(id))
        );
    }
}