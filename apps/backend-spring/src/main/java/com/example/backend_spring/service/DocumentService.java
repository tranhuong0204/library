package com.example.backend_spring.service;

import com.example.backend_spring.dto.document.DocumentResponse;
import com.example.backend_spring.entity.Category;
import com.example.backend_spring.entity.Document;
import com.example.backend_spring.entity.DocumentComment;
import com.example.backend_spring.entity.DocumentFavorite;
import com.example.backend_spring.entity.DocumentRating;
import com.example.backend_spring.entity.User;
import com.example.backend_spring.enums.Role;
import com.example.backend_spring.exception.BadRequestException;
import com.example.backend_spring.exception.ForbiddenException;
import com.example.backend_spring.exception.ResourceNotFoundException;
import com.example.backend_spring.repository.CategoryRepository;
import com.example.backend_spring.repository.DocumentCommentRepository;
import com.example.backend_spring.repository.DocumentFavoriteRepository;
import com.example.backend_spring.repository.DocumentRatingRepository;
import com.example.backend_spring.repository.DocumentRepository;
import com.example.backend_spring.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.text.Normalizer;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentFavoriteRepository documentFavoriteRepository;
    private final DocumentCommentRepository documentCommentRepository;
    private final DocumentRatingRepository documentRatingRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final AiService aiService;

    private static final Pattern DIACRITICS_PATTERN = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");

    public List<DocumentResponse> getAllDocuments(Long categoryId, String keyword) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim();
        List<Document> documents = documentRepository.searchApprovedDocuments(
                normalizedKeyword,
                categoryId
        );

        return documents.stream()
                .map(this::toResponse)
                .toList();
    }

    public List<Map<String, Object>> resolveDocumentTitles() {
        return documentRepository.findAll()
                .stream()
                .map(document -> {
                    String fileUrl = document.getFileUrl() == null ? "" : document.getFileUrl();
                    String fileName = extractFileName(fileUrl);

                    String categoryName = document.getCategory() != null && document.getCategory().getName() != null
                            ? document.getCategory().getName()
                            : "";

                    return Map.<String, Object>of(
                            "id", document.getId(),
                            "documentId", document.getId(),
                            "title", document.getTitle() == null ? "" : document.getTitle(),
                            "author", document.getAuthor() == null ? "" : document.getAuthor(),
                            "description", document.getDescription() == null ? "" : document.getDescription(),
                            "fileUrl", fileUrl,
                            "fileName", fileName,
                            "categoryName", categoryName);
                })
                .toList();
    }

    public DocumentResponse getDocumentById(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu"));

        document.setViewCount(document.getViewCount() == null ? 1 : document.getViewCount() + 1);
        documentRepository.save(document);

        return toResponse(document);
    }

    public DownloadedDocument downloadDocument(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu"));

        if (document.getFileUrl() == null || !document.getFileUrl().startsWith("/uploads/")) {
            throw new ResourceNotFoundException("Không tìm thấy tệp tài liệu");
        }

        Path uploadRoot = Path.of("uploads").toAbsolutePath().normalize();
        Path filePath = uploadRoot.resolve(document.getFileUrl().replaceFirst("^/uploads/", "")).normalize();
        if (!filePath.startsWith(uploadRoot) || !Files.exists(filePath) || !Files.isRegularFile(filePath)) {
            throw new ResourceNotFoundException("Tệp tài liệu không còn tồn tại");
        }

        document.setDownloadCount((document.getDownloadCount() == null ? 0 : document.getDownloadCount()) + 1);
        documentRepository.save(document);

        String extension = getFileExtension(filePath.getFileName().toString());
        String fileName = document.getTitle().replaceAll("[\\\\/:*?\"<>|]", "_") + (extension.isBlank() ? "" : "." + extension);
        return new DownloadedDocument(filePath, fileName, document.getDownloadCount());
    }

    public DocumentResponse createDocument(
            String title,
            String description,
            String author,
            Long categoryId,
            MultipartFile documentFile,
            MultipartFile thumbnailFile,
            String username) {
        if (documentFile == null || documentFile.isEmpty()) {
            throw new BadRequestException("Vui lòng chọn tệp tài liệu");
        }

        User user = getAdminByUsername(username);

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục"));

        String documentUrl = saveFile(documentFile, "documents");
        String thumbnailUrl = null;

        if (thumbnailFile != null && !thumbnailFile.isEmpty()) {
            thumbnailUrl = saveFile(thumbnailFile, "thumbnails");
        }

        String originalName = documentFile.getOriginalFilename();
        String fileType = getFileExtension(originalName);

        Document document = Document.builder()
                .title(title)
                .description(description)
                .author(author)
                .category(category)
                .uploadedBy(user)
                .fileUrl(documentUrl)
                .coverUrl(thumbnailUrl)
                .fileType(fileType)
                .fileSize(documentFile.getSize())
                .viewCount(0)
                .downloadCount(0)
                .approved(true)
                .build();

        Document savedDocument = documentRepository.save(document);

        aiService.ingestDocument(
                savedDocument.getId(),
                savedDocument.getFileUrl(),
                savedDocument.getTitle());

        return toResponse(savedDocument);
    }

    public DocumentResponse updateDocument(
            Long documentId,
            String title,
            String description,
            String author,
            Long categoryId,
            MultipartFile documentFile,
            MultipartFile thumbnailFile,
            String username) {
        getAdminByUsername(username);

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu"));

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục"));

        boolean hasNewDocumentFile = documentFile != null && !documentFile.isEmpty();

        document.setTitle(title);
        document.setDescription(description);
        document.setAuthor(author);
        document.setCategory(category);

        if (hasNewDocumentFile) {
            deleteLocalFile(document.getFileUrl());

            String documentUrl = saveFile(documentFile, "documents");
            String originalName = documentFile.getOriginalFilename();
            String fileType = getFileExtension(originalName);

            document.setFileUrl(documentUrl);
            document.setFileType(fileType);
            document.setFileSize(documentFile.getSize());
        }

        if (thumbnailFile != null && !thumbnailFile.isEmpty()) {
            deleteLocalFile(document.getCoverUrl());

            String thumbnailUrl = saveFile(thumbnailFile, "thumbnails");
            document.setCoverUrl(thumbnailUrl);
        }

        Document updatedDocument = documentRepository.save(document);

        // Luôn đồng bộ lại AI sau khi cập nhật tài liệu.
        // Nếu đổi file: AI sẽ thay chunk cũ bằng chunk mới theo fileUrl/source.
        // Nếu chỉ đổi title/description/category: AI cũng cập nhật lại metadata hiển thị.
        aiService.ingestDocument(
                updatedDocument.getId(),
                updatedDocument.getFileUrl(),
                updatedDocument.getTitle());

        return toResponse(updatedDocument);
    }

    public List<DocumentResponse> getFavorites(String username) {
        User user = getUserByUsername(username);

        return documentFavoriteRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(DocumentFavorite::getDocument)
                .map(this::toResponse)
                .toList();
    }

    public Map<String, Object> addFavorite(Long documentId, String username) {
        User user = getUserByUsername(username);

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu"));

        boolean existed = documentFavoriteRepository.existsByUserIdAndDocumentId(user.getId(), documentId);

        if (existed) {
            return Map.of("message", "Tài liệu đã có trong danh sách yêu thích");
        }

        DocumentFavorite favorite = DocumentFavorite.builder()
                .user(user)
                .document(document)
                .build();

        documentFavoriteRepository.save(favorite);

        return Map.of("message", "Đã thêm vào yêu thích");
    }

    public Map<String, Object> removeFavorite(Long documentId, String username) {
        User user = getUserByUsername(username);

        DocumentFavorite favorite = documentFavoriteRepository
                .findByUserIdAndDocumentId(user.getId(), documentId)
                .orElseThrow(() -> new BadRequestException("Tài liệu chưa có trong yêu thích"));

        documentFavoriteRepository.delete(favorite);

        return Map.of("message", "Đã xóa khỏi yêu thích");
    }

    public Map<String, Object> deleteDocument(Long documentId, String username) {
        getAdminByUsername(username);
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu"));

        List<DocumentFavorite> favorites = documentFavoriteRepository.findByDocumentId(documentId);
        documentFavoriteRepository.deleteAll(favorites);

        List<DocumentComment> comments = documentCommentRepository.findByDocumentIdOrderByCreatedAtDesc(documentId);
        documentCommentRepository.deleteAll(comments);

        List<DocumentRating> ratings = documentRatingRepository.findByDocumentId(documentId);
        documentRatingRepository.deleteAll(ratings);

        deleteLocalFile(document.getFileUrl());
        deleteLocalFile(document.getCoverUrl());

        // Đồng bộ AI: xóa toàn bộ vector/chunk liên quan đến tài liệu này.
        // Đặt trước khi xóa DB để nếu AI lỗi thì vẫn không làm hỏng thao tác xóa tài liệu.
        aiService.removeDocument(documentId);

        documentRepository.delete(document);

        return Map.of("message", "Đã xóa tài liệu thành công");
    }

    public List<Map<String, Object>> getDocumentComments(Long documentId) {
        documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu"));

        return documentCommentRepository.findByDocumentIdOrderByCreatedAtDesc(documentId)
                .stream()
                .map(this::toDocumentCommentResponse)
                .toList();
    }

    public Map<String, Object> createDocumentComment(Long documentId, String username, String content) {
        if (content == null || content.trim().isEmpty()) {
            throw new BadRequestException("Nội dung bình luận không được để trống");
        }

        User user = getUserByUsername(username);

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu"));

        DocumentComment comment = DocumentComment.builder()
                .document(document)
                .user(user)
                .content(content.trim())
                .build();

        // Flush before responding so a following page load always observes the
        // newly created comment, even when it uses another DB connection.
        DocumentComment savedComment = documentCommentRepository.saveAndFlush(comment);

        return Map.of(
                "message", "Đã gửi bình luận",
                "comment", Map.of(
                        "id", savedComment.getId(),
                        "content", savedComment.getContent(),
                        "userId", user.getId(),
                        "username", user.getUsername(),
                        "fullName", user.getFullName(),
                        "createdAt", savedComment.getCreatedAt()));
    }

    public Map<String, Object> deleteDocumentComment(Long documentId, Long commentId, String username) {
        User user = getUserByUsername(username);

        DocumentComment comment = documentCommentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bình luận"));

        if (comment.getDocument() == null || !comment.getDocument().getId().equals(documentId)) {
            throw new BadRequestException("Bình luận không thuộc tài liệu này");
        }

        if (comment.getUser() == null || !comment.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Bạn không có quyền xóa bình luận này");
        }

        documentCommentRepository.delete(comment);

        return Map.of("message", "Đã xóa bình luận");
    }

    private Map<String, Object> toDocumentCommentResponse(DocumentComment comment) {
        Map<String, Object> response = new LinkedHashMap<>();
        User author = comment.getUser();
        String username = author != null && author.getUsername() != null
                ? author.getUsername()
                : "Ẩn danh";
        String fullName = author != null && author.getFullName() != null && !author.getFullName().isBlank()
                ? author.getFullName()
                : username;

        response.put("id", comment.getId());
        response.put("content", comment.getContent());
        response.put("userId", author != null ? author.getId() : 0L);
        response.put("username", username);
        response.put("fullName", fullName);
        response.put("createdAt", comment.getCreatedAt());
        return response;
    }

    public Map<String, Object> getDocumentRating(Long documentId, String username) {
        documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu"));

        Double averageRating = documentRatingRepository.getAverageRatingByDocumentId(documentId);
        Long ratingCount = documentRatingRepository.countByDocumentId(documentId);

        Integer myRating = null;

        if (username != null && !username.isBlank()) {
            User user = getUserByUsername(username);

            myRating = documentRatingRepository
                    .findByUserIdAndDocumentId(user.getId(), documentId)
                    .map(DocumentRating::getRating)
                    .orElse(null);
        }

        return Map.of(
                "averageRating", averageRating == null ? 0.0 : Math.round(averageRating * 10.0) / 10.0,
                "ratingCount", ratingCount == null ? 0 : ratingCount,
                "myRating", myRating == null ? 0 : myRating);
    }

    public Map<String, Object> rateDocument(Long documentId, String username, Integer rating) {
        if (rating == null || rating < 1 || rating > 5) {
            throw new BadRequestException("Đánh giá phải từ 1 đến 5 sao");
        }

        User user = getUserByUsername(username);

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu"));

        DocumentRating documentRating = documentRatingRepository
                .findByUserIdAndDocumentId(user.getId(), documentId)
                .orElse(
                        DocumentRating.builder()
                                .user(user)
                                .document(document)
                                .build());

        documentRating.setRating(rating);

        documentRatingRepository.save(documentRating);

        Double averageRating = documentRatingRepository.getAverageRatingByDocumentId(documentId);
        Long ratingCount = documentRatingRepository.countByDocumentId(documentId);

        return Map.of(
                "message", "Đã lưu đánh giá",
                "averageRating", averageRating == null ? 0.0 : Math.round(averageRating * 10.0) / 10.0,
                "ratingCount", ratingCount == null ? 0 : ratingCount,
                "myRating", rating);
    }

    private String saveFile(MultipartFile file, String folderName) {
        try {
            Path uploadDir = Path.of("uploads", folderName);

            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            String originalName = file.getOriginalFilename();
            String extension = getFileExtension(originalName);
            String fileName = UUID.randomUUID() + (extension.isBlank() ? "" : "." + extension);

            Path targetPath = uploadDir.resolve(fileName);

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            return "/uploads/" + folderName + "/" + fileName;
        } catch (IOException e) {
            throw new RuntimeException("Không thể lưu file: " + e.getMessage());
        }
    }

    private void deleteLocalFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) {
            return;
        }

        if (!fileUrl.startsWith("/uploads/")) {
            return;
        }

        try {
            String relativePath = fileUrl.replaceFirst("^/uploads/", "");
            Path filePath = Path.of("uploads").resolve(relativePath);

            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.error("Không thể xóa file local: {} - {}", fileUrl, e.getMessage());
        }
    }

    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }

        return fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
    }

    private String extractFileName(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) {
            return "";
        }

        String cleanUrl = fileUrl.replace("\\", "/").trim();

        if (!cleanUrl.contains("/")) {
            return cleanUrl;
        }

        return cleanUrl.substring(cleanUrl.lastIndexOf("/") + 1);
    }

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
    }

    public record DownloadedDocument(Path filePath, String fileName, Integer downloadCount) { }

    private User getAdminByUsername(String username) {
        User user = getUserByUsername(username);
        if (!Role.ADMIN.equals(user.getRole())) {
            throw new ForbiddenException("Chỉ quản trị viên được phép quản lý tài liệu.");
        }
        return user;
    }

    // AI service gửi keyword đã được bỏ dấu tiếng Việt (xem
    // extract_document_search_terms trong apps/ai-service/services/document_service.py).
    // Nếu so khớp .contains() giữ nguyên dấu ở đây, keyword bỏ dấu sẽ KHÔNG BAO GIỜ
    // khớp với tiêu đề có dấu (vd. keyword "lap di dong" không khớp title "Lập trình
    // ứng dụng di động"), khiến AI báo sai là "chưa có tài liệu" dù tài liệu tồn tại.
    // Bỏ dấu cả hai vế trước khi so khớp để tính năng tìm tài liệu hoạt động đúng
    // với mọi tài liệu có tên tiếng Việt có dấu.
    private static String stripVietnameseAccents(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD);
        normalized = DIACRITICS_PATTERN.matcher(normalized).replaceAll("");
        return normalized.replace('đ', 'd').replace('Đ', 'D');
    }

    private static boolean matchesAiKeyword(String field, String normalizedKeyword) {
        if (field.contains(normalizedKeyword)) {
            return true;
        }

        // The AI removes punctuation and stop words before sending the query.
        // Therefore "lap trinh di dong" must match the real title
        // "Lập trình ứng dụng di động", even though "ung dung" occurs in
        // the middle of the title. Require every remaining term in the same
        // metadata field to retain precise matching without accents.
        String[] terms = normalizedKeyword.split("\\s+");
        return terms.length > 1 && java.util.Arrays.stream(terms)
                .allMatch(field::contains);
    }

    public List<Map<String, Object>> searchDocumentsForAi(String keyword) {
        String normalizedKeyword = stripVietnameseAccents(
                keyword == null ? "" : keyword.trim().toLowerCase());

        return documentRepository.findByApprovedTrueOrderByCreatedAtDesc()
                .stream()
                .filter(document -> {
                    if (normalizedKeyword.isBlank()) {
                        return false;
                    }

                    String title = stripVietnameseAccents(
                            document.getTitle() == null ? "" : document.getTitle().toLowerCase());
                    String description = stripVietnameseAccents(
                            document.getDescription() == null ? "" : document.getDescription().toLowerCase());
                    String author = stripVietnameseAccents(
                            document.getAuthor() == null ? "" : document.getAuthor().toLowerCase());
                    String categoryName = stripVietnameseAccents(
                            document.getCategory() != null && document.getCategory().getName() != null
                                    ? document.getCategory().getName().toLowerCase()
                                    : "");

                    return matchesAiKeyword(title, normalizedKeyword)
                            || matchesAiKeyword(description, normalizedKeyword)
                            || matchesAiKeyword(author, normalizedKeyword)
                            || matchesAiKeyword(categoryName, normalizedKeyword);
                })
                .map(document -> {
                    String fileUrl = document.getFileUrl() == null ? "" : document.getFileUrl();
                    String fileName = extractFileName(fileUrl);

                    String categoryName = document.getCategory() != null && document.getCategory().getName() != null
                            ? document.getCategory().getName()
                            : "";

                    return Map.<String, Object>of(
                            "id", document.getId() == null ? 0L : document.getId(),
                            "documentId", document.getId() == null ? 0L : document.getId(),
                            "title", document.getTitle() == null ? "" : document.getTitle(),
                            "author", document.getAuthor() == null ? "" : document.getAuthor(),
                            "description", document.getDescription() == null ? "" : document.getDescription(),
                            "fileUrl", fileUrl,
                            "fileName", fileName,
                            "fileType", document.getFileType() == null ? "" : document.getFileType(),
                            "categoryName", categoryName
                    );
                })
                .toList();
    }

    /** Count only documents visible to learners, matching the AI search scope. */
    public long countApprovedDocumentsForAi() {
        return documentRepository.countByApprovedTrue();
    }

    public List<Map<String, Object>> getDocumentsForAiSync() {
        return documentRepository.findByApprovedTrueOrderByCreatedAtDesc()
                .stream()
                .map(document -> {
                    String fileUrl = document.getFileUrl() == null ? "" : document.getFileUrl();
                    String fileName = extractFileName(fileUrl);

                    String categoryName = document.getCategory() != null && document.getCategory().getName() != null
                            ? document.getCategory().getName()
                            : "";

                    return Map.<String, Object>of(
                            "id", document.getId() == null ? 0L : document.getId(),
                            "documentId", document.getId() == null ? 0L : document.getId(),
                            "title", document.getTitle() == null ? "" : document.getTitle(),
                            "author", document.getAuthor() == null ? "" : document.getAuthor(),
                            "description", document.getDescription() == null ? "" : document.getDescription(),
                            "fileUrl", fileUrl,
                            "fileName", fileName,
                            "fileType", document.getFileType() == null ? "" : document.getFileType(),
                            "categoryName", categoryName
                    );
                })
                .toList();
    }

    private DocumentResponse toResponse(Document document) {
        Long categoryId = document.getCategory() != null ? document.getCategory().getId() : null;
        String categoryName = document.getCategory() != null ? document.getCategory().getName() : null;
        String uploadedByName = document.getUploadedBy() != null ? document.getUploadedBy().getFullName() : null;

        return DocumentResponse.builder()
                .id(document.getId())
                .DocumentID(document.getId())
                .title(document.getTitle())
                .Title(document.getTitle())
                .author(document.getAuthor())
                .Author(document.getAuthor())
                .description(document.getDescription())
                .Description(document.getDescription())
                .fileUrl(document.getFileUrl())
                .FileUrl(document.getFileUrl())
                .coverUrl(document.getCoverUrl())
                .CoverUrl(document.getCoverUrl())
                .fileType(document.getFileType())
                .FileType(document.getFileType())
                .fileSize(document.getFileSize())
                .FileSize(document.getFileSize())
                .viewCount(document.getViewCount())
                .ViewCount(document.getViewCount())
                .downloadCount(document.getDownloadCount())
                .DownloadCount(document.getDownloadCount())
                .categoryId(categoryId)
                .CategoryID(categoryId)
                .categoryName(categoryName)
                .CategoryName(categoryName)
                .uploadedByName(uploadedByName)
                .UploadedByName(uploadedByName)
                .createdAt(document.getCreatedAt())
                .CreatedAt(document.getCreatedAt())
                .build();
    }
}
