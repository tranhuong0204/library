package com.example.backend_spring.controller;

import com.example.backend_spring.service.DocumentService;
import com.example.backend_spring.utils.SecurityUtils;
import com.example.backend_spring.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.FileSystemResource;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.nio.charset.StandardCharsets;
import java.io.IOException;
import java.security.MessageDigest;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @Value("${ai.service.api-key}")
    private String aiServiceApiKey;

    @GetMapping
    public ResponseEntity<?> getAllDocuments(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false, defaultValue = "") String q
    ) {
        return ResponseEntity.ok(documentService.getAllDocuments(categoryId, q));
    }

    // =========================
    // AI DOCUMENT TITLE RESOLVE
    // =========================
    // API này để ai-service tra cứu fileUrl/fileName -> title tài liệu.
    // Phải trả về Object có key "documents", không trả List trực tiếp.
    // Đặt trước @GetMapping("/{id}") để tránh nhầm "resolve-titles" thành id.

    @GetMapping("/resolve-titles")
    public ResponseEntity<?> resolveDocumentTitles(
            @RequestHeader(value = "X-Internal-Api-Key", required = false) String apiKey
    ) {
        validateInternalApiKey(apiKey);
        return ResponseEntity.ok(
                Map.of("documents", documentService.resolveDocumentTitles())
        );
    }

    @GetMapping("/ai-sync")
    public ResponseEntity<?> getDocumentsForAiSync(
            @RequestHeader(value = "X-Internal-Api-Key", required = false) String apiKey
    ) {
        validateInternalApiKey(apiKey);
        return ResponseEntity.ok(
                Map.of("documents", documentService.getDocumentsForAiSync())
        );
    }

    @GetMapping("/search-ai")
    public ResponseEntity<?> searchDocumentsForAi(
            @RequestHeader(value = "X-Internal-Api-Key", required = false) String apiKey,
            @RequestParam(required = false, defaultValue = "") String keyword
    ) {
        validateInternalApiKey(apiKey);
        return ResponseEntity.ok(
                Map.of("documents", documentService.searchDocumentsForAi(keyword))
        );
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createDocument(
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "author", required = false) String author,
            @RequestParam("categoryId") Long categoryId,
            @RequestParam("document") MultipartFile document,
            @RequestParam(value = "thumbnail", required = false) MultipartFile thumbnail
    ) {
        String username = SecurityUtils.getCurrentUsername();

        return ResponseEntity.ok(
                documentService.createDocument(
                        title,
                        description,
                        author,
                        categoryId,
                        document,
                        thumbnail,
                        username
                )
        );
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateDocument(
            @PathVariable Long id,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "author", required = false) String author,
            @RequestParam("categoryId") Long categoryId,
            @RequestParam(value = "document", required = false) MultipartFile document,
            @RequestParam(value = "thumbnail", required = false) MultipartFile thumbnail
    ) {
        String username = SecurityUtils.getCurrentUsername();

        return ResponseEntity.ok(
                documentService.updateDocument(
                        id,
                        title,
                        description,
                        author,
                        categoryId,
                        document,
                        thumbnail,
                        username
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDocumentById(@PathVariable Long id) {
        return ResponseEntity.ok(documentService.getDocumentById(id));
    }

    @GetMapping("/count-ai")
    public ResponseEntity<?> countDocumentsForAi(
            @RequestHeader(value = "X-Internal-Api-Key", required = false) String apiKey
    ) {
        validateInternalApiKey(apiKey);
        return ResponseEntity.ok(Map.of("count", documentService.countApprovedDocumentsForAi()));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<FileSystemResource> downloadDocument(@PathVariable Long id) throws IOException {
        DocumentService.DownloadedDocument downloaded = documentService.downloadDocument(id);
        FileSystemResource resource = new FileSystemResource(downloaded.filePath());

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(resource.contentLength())
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(downloaded.fileName(), StandardCharsets.UTF_8)
                        .build().toString())
                .header("X-Download-Count", String.valueOf(downloaded.downloadCount()))
                .body(resource);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDocument(
            @PathVariable Long id
    ) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(documentService.deleteDocument(id, username));
    }

    @GetMapping("/favorites")
    public ResponseEntity<?> getFavorites() {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(documentService.getFavorites(username));
    }

    @PostMapping("/{id}/favorite")
    public ResponseEntity<?> addFavorite(
            @PathVariable Long id
    ) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(documentService.addFavorite(id, username));
    }

    @DeleteMapping("/{id}/favorite")
    public ResponseEntity<?> removeFavorite(
            @PathVariable Long id
    ) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(documentService.removeFavorite(id, username));
    }

    // =========================
    // COMMENTS
    // =========================

    @GetMapping("/{id}/comments")
    public ResponseEntity<?> getDocumentComments(@PathVariable Long id) {
        return ResponseEntity.ok(documentService.getDocumentComments(id));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<?> createDocumentComment(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        String username = SecurityUtils.getCurrentUsername();
        String content = body.get("content");

        return ResponseEntity.ok(
                documentService.createDocumentComment(id, username, content)
        );
    }

    @DeleteMapping("/{documentId}/comments/{commentId}")
    public ResponseEntity<?> deleteDocumentComment(
            @PathVariable Long documentId,
            @PathVariable Long commentId
    ) {
        String username = SecurityUtils.getCurrentUsername();

        return ResponseEntity.ok(
                documentService.deleteDocumentComment(documentId, commentId, username)
        );
    }

    // =========================
    // RATINGS
    // =========================

    @GetMapping("/{id}/ratings")
    public ResponseEntity<?> getDocumentRating(@PathVariable Long id) {
        String username = SecurityUtils.getOptionalUsername();
        return ResponseEntity.ok(documentService.getDocumentRating(id, username));
    }

    @PostMapping("/{id}/ratings")
    public ResponseEntity<?> rateDocument(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> body
    ) {
        String username = SecurityUtils.getCurrentUsername();
        Integer rating = body.get("rating");

        return ResponseEntity.ok(
                documentService.rateDocument(id, username, rating)
        );
    }

    private void validateInternalApiKey(String providedKey) {
        if (providedKey == null || !MessageDigest.isEqual(
                providedKey.getBytes(StandardCharsets.UTF_8),
                aiServiceApiKey.getBytes(StandardCharsets.UTF_8)
        )) {
            throw new UnauthorizedException("Internal API key không hợp lệ.");
        }
    }
}
