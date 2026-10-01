package com.example.backend_spring.controller;

import com.example.backend_spring.dto.forum.CreateCommentRequest;
import com.example.backend_spring.dto.forum.CreatePostRequest;
import com.example.backend_spring.service.ForumService;
import com.example.backend_spring.utils.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/forum")
@RequiredArgsConstructor
public class ForumController {

    private final ForumService forumService;

    @GetMapping("/categories")
    public ResponseEntity<?> getCategories() {
        return ResponseEntity.ok(forumService.getCategories());
    }

    @PostMapping("/categories")
    public ResponseEntity<?> createCategory(
            @RequestBody Map<String, Object> request
    ) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(forumService.createCategory(request, username));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<?> updateCategory(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request
    ) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(forumService.updateCategory(id, request, username));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<?> deleteCategory(
            @PathVariable Long id
    ) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(forumService.deleteCategory(id, username));
    }

    @GetMapping("/posts")
    public ResponseEntity<?> getPosts(@RequestParam(required = false) Long categoryId) {
        String username = SecurityUtils.getOptionalUsername();
        return ResponseEntity.ok(forumService.getPosts(categoryId, username));
    }

    @GetMapping("/posts/{id}")
    public ResponseEntity<?> getPostById(
            @PathVariable Long id
    ) {
        String username = SecurityUtils.getOptionalUsername();
        return ResponseEntity.ok(forumService.getPostById(id, username));
    }

    @PostMapping(value = "/posts", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createPost(
            @Valid @RequestBody CreatePostRequest request
    ) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(forumService.createPost(request, username));
    }

    @PostMapping(value = "/posts", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createPostWithAttachment(
            @RequestParam String title,
            @RequestParam String content,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) MultipartFile attachment
    ) {
        CreatePostRequest request = new CreatePostRequest();
        request.setTitle(title);
        request.setContent(content);
        request.setCategoryId(categoryId);
        return ResponseEntity.ok(forumService.createPost(request, attachment, SecurityUtils.getCurrentUsername()));
    }

    @PutMapping("/posts/{id}")
    public ResponseEntity<?> updatePost(
            @PathVariable Long id,
            @Valid @RequestBody CreatePostRequest request
    ) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(forumService.updatePost(id, request, username));
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<?> deleteOwnPost(@PathVariable Long id) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(forumService.deleteOwnPost(id, username));
    }

    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<?> addComment(
            @PathVariable Long postId,
            @Valid @RequestBody CreateCommentRequest request
    ) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(forumService.addComment(postId, request, username));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long commentId) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(forumService.deleteComment(commentId, username));
    }

    @PostMapping("/posts/{id}/like")
    public ResponseEntity<?> likePost(
            @PathVariable Long id
    ) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(forumService.likePost(id, username));
    }

    @DeleteMapping("/posts/{id}/like")
    public ResponseEntity<?> unlikePost(
            @PathVariable Long id
    ) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(forumService.unlikePost(id, username));
    }

    @PostMapping("/comments/{commentId}/like")
    public ResponseEntity<?> likeComment(
            @PathVariable Long commentId
    ) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(forumService.likeComment(commentId, username));
    }

    @DeleteMapping("/comments/{commentId}/like")
    public ResponseEntity<?> unlikeComment(
            @PathVariable Long commentId
    ) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(forumService.unlikeComment(commentId, username));
    }

    @PostMapping("/posts/{postId}/report")
    public ResponseEntity<?> reportPost(
            @PathVariable Long postId,
            @RequestBody Map<String, Object> request
    ) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(forumService.reportPost(postId, request, username));
    }

    @PostMapping("/comments/{commentId}/report")
    public ResponseEntity<?> reportComment(
            @PathVariable Long commentId,
            @RequestBody Map<String, Object> request
    ) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(forumService.reportComment(commentId, request, username));
    }
}
