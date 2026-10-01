package com.example.backend_spring.service;

import com.example.backend_spring.dto.forum.CreateCommentRequest;
import com.example.backend_spring.dto.forum.CreatePostRequest;
import com.example.backend_spring.dto.forum.ForumCategoryResponse;
import com.example.backend_spring.dto.forum.ForumCommentResponse;
import com.example.backend_spring.dto.forum.ForumPostResponse;
import com.example.backend_spring.entity.ForumCategory;
import com.example.backend_spring.entity.ForumComment;
import com.example.backend_spring.entity.ForumCommentLike;
import com.example.backend_spring.entity.ForumPost;
import com.example.backend_spring.entity.ForumPostLike;
import com.example.backend_spring.entity.ForumReport;
import com.example.backend_spring.entity.User;
import com.example.backend_spring.enums.ReportStatus;
import com.example.backend_spring.enums.Role;
import com.example.backend_spring.exception.BadRequestException;
import com.example.backend_spring.exception.ForbiddenException;
import com.example.backend_spring.exception.ResourceNotFoundException;
import com.example.backend_spring.repository.ForumCategoryRepository;
import com.example.backend_spring.repository.ForumCommentLikeRepository;
import com.example.backend_spring.repository.ForumCommentRepository;
import com.example.backend_spring.repository.ForumPostLikeRepository;
import com.example.backend_spring.repository.ForumPostRepository;
import com.example.backend_spring.repository.ForumReportRepository;
import com.example.backend_spring.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ForumService {

    private static final long MAX_ATTACHMENT_SIZE = 10L * 1024 * 1024;
    private static final Set<String> IMAGE_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "webp");
    private static final Set<String> DOCUMENT_EXTENSIONS = Set.of("pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "zip");

    private final ForumCategoryRepository forumCategoryRepository;
    private final ForumPostRepository forumPostRepository;
    private final ForumCommentRepository forumCommentRepository;
    private final ForumPostLikeRepository forumPostLikeRepository;
    private final ForumCommentLikeRepository forumCommentLikeRepository;
    private final ForumReportRepository forumReportRepository;
    private final UserRepository userRepository;

    public List<ForumCategoryResponse> getCategories() {
        return forumCategoryRepository.findAll()
                .stream()
                .map(this::toCategoryResponse)
                .toList();
    }

    @Transactional
    public ForumCategoryResponse createCategory(Map<String, Object> request, String username) {
        User currentUser = getUserByUsername(username);
        ensureAdmin(currentUser);

        String name = normalizeRequiredText(getString(request, "name"), "Tên chủ đề không được để trống");
        String description = normalizeOptionalText(getString(request, "description"));
        String color = normalizeOptionalText(getString(request, "color"));

        if (forumCategoryRepository.existsByName(name)) {
            throw new BadRequestException("Tên chủ đề diễn đàn đã tồn tại");
        }

        ForumCategory category = ForumCategory.builder()
                .name(name)
                .description(description)
                .color(color)
                .build();

        ForumCategory savedCategory = forumCategoryRepository.save(category);
        return toCategoryResponse(savedCategory);
    }

    @Transactional
    public ForumCategoryResponse updateCategory(Long id, Map<String, Object> request, String username) {
        User currentUser = getUserByUsername(username);
        ensureAdmin(currentUser);

        ForumCategory category = forumCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chủ đề diễn đàn"));

        String name = normalizeRequiredText(getString(request, "name"), "Tên chủ đề không được để trống");
        String description = normalizeOptionalText(getString(request, "description"));
        String color = normalizeOptionalText(getString(request, "color"));

        if (forumCategoryRepository.existsByNameAndIdNot(name, id)) {
            throw new BadRequestException("Tên chủ đề diễn đàn đã tồn tại");
        }

        category.setName(name);
        category.setDescription(description);
        category.setColor(color);

        ForumCategory savedCategory = forumCategoryRepository.save(category);
        return toCategoryResponse(savedCategory);
    }

    @Transactional
    public Map<String, Object> deleteCategory(Long id, String username) {
        User currentUser = getUserByUsername(username);
        ensureAdmin(currentUser);

        ForumCategory category = forumCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chủ đề diễn đàn"));

        if (forumPostRepository.existsByCategoryId(id)) {
            throw new BadRequestException("Không thể xóa chủ đề đang có bài viết. Hãy chuyển hoặc xóa bài viết trước.");
        }

        forumCategoryRepository.delete(category);

        return Map.of(
                "message", "Xóa chủ đề diễn đàn thành công",
                "categoryId", id
        );
    }

    public List<ForumPostResponse> getPosts(Long categoryId, String username) {
        List<ForumPost> posts;

        if (categoryId != null) {
            posts = forumPostRepository.findByCategoryIdOrderByCreatedAtDesc(categoryId);
        } else {
            posts = forumPostRepository.findAllByOrderByCreatedAtDesc();
        }

        Long currentUserId = null;
        if (username != null && !username.isBlank()) {
            currentUserId = getUserByUsername(username).getId();
        }

        Long userId = currentUserId;
        return posts.stream()
                .map(post -> {
                    boolean liked = userId != null
                            && forumPostLikeRepository.existsByPostIdAndUserId(post.getId(), userId);
                    return toPostResponse(post, false, liked, userId);
                })
                .toList();
    }

    public ForumPostResponse getPostById(Long id, String username) {
        ForumPost post = forumPostRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết"));

        post.setViewCount(post.getViewCount() == null ? 1 : post.getViewCount() + 1);
        forumPostRepository.save(post);

        boolean liked = false;
        Long currentUserId = null;

        if (username != null && !username.isBlank()) {
            User user = getUserByUsername(username);
            currentUserId = user.getId();
            liked = forumPostLikeRepository.existsByPostIdAndUserId(id, user.getId());
        }

        return toPostResponse(post, true, liked, currentUserId);
    }

    public ForumPostResponse createPost(CreatePostRequest request, String username) {
        return createPost(request, null, username);
    }

    public ForumPostResponse createPost(CreatePostRequest request, MultipartFile attachment, String username) {
        User user = getUserByUsername(username);

        ForumCategory category = null;

        if (request.getCategoryId() != null) {
            category = forumCategoryRepository.findById(request.getCategoryId())
                    .orElse(null);
        }

        ForumPost.ForumPostBuilder postBuilder = ForumPost.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .category(category)
                .user(user)
                .viewCount(0)
                .likeCount(0);

        if (attachment != null && !attachment.isEmpty()) {
            AttachmentData savedAttachment = saveAttachment(attachment);
            postBuilder.attachmentName(savedAttachment.name())
                    .attachmentUrl(savedAttachment.url())
                    .attachmentType(savedAttachment.type())
                    .attachmentMimeType(savedAttachment.mimeType())
                    .attachmentSize(savedAttachment.size());
        }

        ForumPost post = postBuilder.build();

        ForumPost savedPost = forumPostRepository.save(post);

        return toPostResponse(savedPost, true, false, user.getId());
    }

    @Transactional
    public ForumPostResponse updatePost(Long postId, CreatePostRequest request, String username) {
        User user = getUserByUsername(username);
        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết"));

        ensurePostOwner(post, user);

        ForumCategory category = null;
        if (request.getCategoryId() != null) {
            category = forumCategoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chủ đề diễn đàn"));
        }

        post.setTitle(request.getTitle().trim());
        post.setContent(request.getContent().trim());
        post.setCategory(category);

        ForumPost savedPost = forumPostRepository.save(post);
        boolean liked = forumPostLikeRepository.existsByPostIdAndUserId(postId, user.getId());
        return toPostResponse(savedPost, true, liked, user.getId());
    }

    @Transactional
    public Map<String, Object> deleteOwnPost(Long postId, String username) {
        User user = getUserByUsername(username);
        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết"));

        ensurePostOwner(post, user);

        forumCommentLikeRepository.deleteByPostId(postId);
        forumPostLikeRepository.deleteByPostId(postId);
        forumCommentRepository.deleteByPostId(postId);
        deleteAttachment(post.getAttachmentUrl());
        forumPostRepository.delete(post);

        return Map.of(
                "message", "Xóa bài viết thành công",
                "deletedPostId", postId
        );
    }

    public ForumCommentResponse addComment(Long postId, CreateCommentRequest request, String username) {
        User user = getUserByUsername(username);

        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết"));

        ForumComment comment = ForumComment.builder()
                .content(request.getContent())
                .parentId(request.getParentId())
                .post(post)
                .user(user)
                .likeCount(0)
                .build();

        ForumComment savedComment = forumCommentRepository.save(comment);

        return toCommentResponse(savedComment, user.getId());
    }

    @Transactional
    public Map<String, Object> deleteComment(Long commentId, String username) {
        User currentUser = getUserByUsername(username);
        ForumComment comment = forumCommentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bình luận"));

        boolean isOwner = comment.getUser() != null
                && comment.getUser().getId().equals(currentUser.getId());
        if (!isOwner && !Role.ADMIN.equals(currentUser.getRole())) {
            throw new ForbiddenException("Bạn chỉ có thể xóa bình luận của chính mình");
        }

        List<Long> commentIds = new ArrayList<>();
        collectCommentTreeIds(commentId, commentIds);
        forumCommentLikeRepository.deleteByCommentIds(commentIds);
        forumCommentRepository.deleteAllByIdInBatch(commentIds);

        return Map.of(
                "message", "Xóa bình luận thành công",
                "deletedCommentId", commentId
        );
    }

    private void collectCommentTreeIds(Long commentId, List<Long> commentIds) {
        forumCommentRepository.findByParentId(commentId)
                .forEach(reply -> collectCommentTreeIds(reply.getId(), commentIds));
        commentIds.add(commentId);
    }

    public Map<String, Object> likePost(Long postId, String username) {
        User user = getUserByUsername(username);

        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết"));

        boolean liked = forumPostLikeRepository.existsByPostIdAndUserId(postId, user.getId());

        if (liked) {
            return Map.of(
                    "message", "Bạn đã thích bài viết này rồi",
                    "liked", true,
                    "likeCount", post.getLikeCount() == null ? 0 : post.getLikeCount()
            );
        }

        ForumPostLike like = ForumPostLike.builder()
                .post(post)
                .user(user)
                .build();

        forumPostLikeRepository.save(like);

        post.setLikeCount(post.getLikeCount() == null ? 1 : post.getLikeCount() + 1);
        forumPostRepository.save(post);

        return Map.of(
                "message", "Đã thích bài viết",
                "liked", true,
                "likeCount", post.getLikeCount()
        );
    }

    public Map<String, Object> unlikePost(Long postId, String username) {
        User user = getUserByUsername(username);

        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết"));

        ForumPostLike like = forumPostLikeRepository.findByPostIdAndUserId(postId, user.getId())
                .orElseThrow(() -> new BadRequestException("Bạn chưa thích bài viết này"));

        forumPostLikeRepository.delete(like);

        int currentLikeCount = post.getLikeCount() == null ? 0 : post.getLikeCount();
        post.setLikeCount(Math.max(0, currentLikeCount - 1));
        forumPostRepository.save(post);

        return Map.of(
                "message", "Đã bỏ thích bài viết",
                "liked", false,
                "likeCount", post.getLikeCount()
        );
    }

    public Map<String, Object> likeComment(Long commentId, String username) {
        User user = getUserByUsername(username);

        ForumComment comment = forumCommentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bình luận"));

        boolean liked = forumCommentLikeRepository.existsByCommentIdAndUserId(commentId, user.getId());

        if (liked) {
            return Map.of(
                    "message", "Bạn đã thích bình luận này rồi",
                    "liked", true,
                    "likeCount", comment.getLikeCount() == null ? 0 : comment.getLikeCount()
            );
        }

        ForumCommentLike like = ForumCommentLike.builder()
                .comment(comment)
                .user(user)
                .build();

        forumCommentLikeRepository.save(like);

        comment.setLikeCount(comment.getLikeCount() == null ? 1 : comment.getLikeCount() + 1);
        forumCommentRepository.save(comment);

        return Map.of(
                "message", "Đã thích bình luận",
                "liked", true,
                "likeCount", comment.getLikeCount()
        );
    }

    public Map<String, Object> unlikeComment(Long commentId, String username) {
        User user = getUserByUsername(username);

        ForumComment comment = forumCommentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bình luận"));

        ForumCommentLike like = forumCommentLikeRepository.findByCommentIdAndUserId(commentId, user.getId())
                .orElseThrow(() -> new BadRequestException("Bạn chưa thích bình luận này"));

        forumCommentLikeRepository.delete(like);

        int currentLikeCount = comment.getLikeCount() == null ? 0 : comment.getLikeCount();
        comment.setLikeCount(Math.max(0, currentLikeCount - 1));
        forumCommentRepository.save(comment);

        return Map.of(
                "message", "Đã bỏ thích bình luận",
                "liked", false,
                "likeCount", comment.getLikeCount()
        );
    }

    public Map<String, Object> reportPost(Long postId, Map<String, Object> request, String username) {
        User reporter = getUserByUsername(username);

        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết"));

        String reason = getString(request, "reason");
        String description = getString(request, "description");

        if (reason.isBlank()) {
            throw new BadRequestException("Vui lòng chọn lý do báo cáo");
        }

        boolean alreadyReported = forumReportRepository.existsByPostIdAndReporterId(
                postId,
                reporter.getId()
        );

        if (alreadyReported) {
            throw new BadRequestException("Bạn chỉ được báo cáo bài viết này một lần");
        }

        String contentPreview = buildContentPreview(post.getContent());
        String reporterName = reporter.getUsername();

        ForumReport report = ForumReport.builder()
                .postId(post.getId())
                .targetType("POST")
                .targetId(post.getId())
                .postTitle(post.getTitle())
                .postContentPreview(contentPreview)
                .reporterId(reporter.getId())
                .reporterUsername(reporterName)
                .reason(reason)
                .description(description)
                .status(ReportStatus.PENDING)
                .build();

        ForumReport savedReport = forumReportRepository.save(report);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Đã gửi báo cáo vi phạm. Quản trị viên sẽ xem xét sớm.");
        response.put("reportId", savedReport.getId());
        response.put("postId", savedReport.getPostId());
        response.put("status", savedReport.getStatus().name());

        return response;
    }

    public Map<String, Object> reportComment(Long commentId, Map<String, Object> request, String username) {
        User reporter = getUserByUsername(username);
        ForumComment comment = forumCommentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bình luận"));

        String reason = getString(request, "reason");
        String description = getString(request, "description");
        if (reason.isBlank()) {
            throw new BadRequestException("Vui lòng chọn lý do báo cáo");
        }

        if (forumReportRepository.existsByTargetTypeAndTargetIdAndReporterId("COMMENT", commentId, reporter.getId())) {
            throw new BadRequestException("Bạn chỉ được báo cáo bình luận này một lần");
        }

        ForumPost post = comment.getPost();
        ForumReport savedReport = forumReportRepository.save(ForumReport.builder()
                .targetType("COMMENT")
                .targetId(commentId)
                .commentId(commentId)
                .parentPostId(post == null ? null : post.getId())
                .postTitle(post == null ? "" : post.getTitle())
                .commentContentPreview(buildContentPreview(comment.getContent()))
                .reporterId(reporter.getId())
                .reporterUsername(reporter.getUsername())
                .reason(reason)
                .description(description)
                .status(ReportStatus.PENDING)
                .build());

        return Map.of(
                "message", "Đã gửi báo cáo bình luận. Quản trị viên sẽ xem xét sớm.",
                "reportId", savedReport.getId(),
                "commentId", commentId,
                "status", savedReport.getStatus().name()
        );
    }

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
    }

    private void ensureAdmin(User user) {
        if (user == null || !Role.ADMIN.equals(user.getRole())) {
            throw new ForbiddenException("Bạn không có quyền quản lý chủ đề diễn đàn");
        }
    }

    private void ensurePostOwner(ForumPost post, User user) {
        if (post.getUser() == null || user == null || !post.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Bạn không có quyền sửa hoặc xóa bài viết này");
        }
    }

    private String normalizeRequiredText(String value, String message) {
        if (value == null || value.trim().isEmpty()) {
            throw new BadRequestException(message);
        }

        return value.trim();
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private ForumCategoryResponse toCategoryResponse(ForumCategory category) {
        return ForumCategoryResponse.builder()
                .id(category.getId())
                .CategoryID(category.getId())

                .name(category.getName())
                .Name(category.getName())

                .description(category.getDescription())
                .Description(category.getDescription())

                .color(category.getColor())
                .Color(category.getColor())

                .build();
    }

    private ForumPostResponse toPostResponse(
            ForumPost post,
            boolean includeComments,
            boolean liked,
            Long currentUserId
    ) {
        Long categoryId = post.getCategory() != null ? post.getCategory().getId() : null;
        String categoryName = post.getCategory() != null ? post.getCategory().getName() : "Chung";

        Long userId = post.getUser() != null ? post.getUser().getId() : null;
        String authorName = post.getUser() != null ? post.getUser().getFullName() : "Ẩn danh";

        List<ForumComment> rawComments = forumCommentRepository.findByPostIdOrderByCreatedAtAsc(post.getId());
        int commentCount = rawComments == null ? 0 : rawComments.size();

        List<ForumCommentResponse> comments = List.of();

        if (includeComments && rawComments != null) {
            comments = rawComments.stream()
                    .map(comment -> toCommentResponse(comment, currentUserId))
                    .toList();
        }

        return ForumPostResponse.builder()
                .id(post.getId())
                .PostID(post.getId())

                .title(post.getTitle())
                .Title(post.getTitle())

                .content(post.getContent())
                .Content(post.getContent())

                .attachmentName(post.getAttachmentName())
                .AttachmentName(post.getAttachmentName())

                .attachmentUrl(post.getAttachmentUrl())
                .AttachmentUrl(post.getAttachmentUrl())

                .attachmentType(post.getAttachmentType())
                .AttachmentType(post.getAttachmentType())

                .attachmentMimeType(post.getAttachmentMimeType())
                .AttachmentMimeType(post.getAttachmentMimeType())

                .attachmentSize(post.getAttachmentSize())
                .AttachmentSize(post.getAttachmentSize())

                .viewCount(post.getViewCount())
                .ViewCount(post.getViewCount())

                .likeCount(post.getLikeCount())
                .LikeCount(post.getLikeCount())

                .commentCount(commentCount)
                .CommentCount(commentCount)

                .liked(liked)
                .Liked(liked)

                .categoryId(categoryId)
                .CategoryID(categoryId)

                .categoryName(categoryName)
                .CategoryName(categoryName)

                .userId(userId)
                .UserID(userId)

                .authorName(authorName)
                .AuthorName(authorName)

                .createdAt(post.getCreatedAt())
                .CreatedAt(post.getCreatedAt())

                .comments(comments)
                .Comments(comments)

                .build();
    }

    private ForumCommentResponse toCommentResponse(ForumComment comment) {
        return toCommentResponse(comment, null);
    }

    private ForumCommentResponse toCommentResponse(ForumComment comment, Long currentUserId) {
        Long userId = comment.getUser() != null ? comment.getUser().getId() : null;
        String authorName = comment.getUser() != null ? comment.getUser().getFullName() : "Ẩn danh";

        boolean liked = false;

        if (currentUserId != null) {
            liked = forumCommentLikeRepository.existsByCommentIdAndUserId(
                    comment.getId(),
                    currentUserId
            );
        }

        Integer likeCount = comment.getLikeCount() == null ? 0 : comment.getLikeCount();

        return ForumCommentResponse.builder()
                .id(comment.getId())
                .CommentID(comment.getId())

                .content(comment.getContent())
                .Content(comment.getContent())

                .userId(userId)
                .UserID(userId)

                .authorName(authorName)
                .AuthorName(authorName)

                .parentId(comment.getParentId())
                .ParentID(comment.getParentId())

                .likeCount(likeCount)
                .LikeCount(likeCount)

                .liked(liked)
                .Liked(liked)

                .createdAt(comment.getCreatedAt())
                .CreatedAt(comment.getCreatedAt())

                .build();
    }

    private String getString(Map<String, Object> request, String key) {
        if (request == null) {
            return "";
        }

        Object value = request.get(key);
        return value == null ? "" : String.valueOf(value).trim();
    }

    private String buildContentPreview(String content) {
        if (content == null || content.isBlank()) {
            return "";
        }

        String normalized = content.replaceAll("\\s+", " ").trim();
        return normalized.length() <= 250 ? normalized : normalized.substring(0, 250) + "...";
    }

    private AttachmentData saveAttachment(MultipartFile file) {
        if (file.getSize() > MAX_ATTACHMENT_SIZE) {
            throw new BadRequestException("Tệp đính kèm không được vượt quá 10 MB.");
        }

        String originalName = sanitizeFileName(file.getOriginalFilename());
        String extension = getExtension(originalName);
        boolean isImage = IMAGE_EXTENSIONS.contains(extension);
        if (!isImage && !DOCUMENT_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("Chỉ hỗ trợ ảnh, PDF, Word, Excel, PowerPoint, TXT hoặc ZIP.");
        }
        if (isImage && (file.getContentType() == null || !file.getContentType().toLowerCase(Locale.ROOT).startsWith("image/"))) {
            throw new BadRequestException("Định dạng ảnh không hợp lệ.");
        }

        String storedName = UUID.randomUUID() + "." + extension;
        Path directory = Path.of("uploads", "forum").toAbsolutePath().normalize();
        Path target = directory.resolve(storedName).normalize();
        if (!target.startsWith(directory)) throw new BadRequestException("Tên tệp không hợp lệ.");
        try {
            Files.createDirectories(directory);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new BadRequestException("Không thể lưu tệp đính kèm.");
        }
        return new AttachmentData(originalName, "/uploads/forum/" + storedName, isImage ? "IMAGE" : "FILE", file.getContentType(), file.getSize());
    }

    private void deleteAttachment(String attachmentUrl) {
        if (attachmentUrl == null || !attachmentUrl.startsWith("/uploads/forum/")) return;
        try {
            Path root = Path.of("uploads", "forum").toAbsolutePath().normalize();
            Path file = root.resolve(attachmentUrl.substring("/uploads/forum/".length())).normalize();
            if (file.startsWith(root)) Files.deleteIfExists(file);
        } catch (IOException ignored) {
            // The database deletion must not fail because an orphaned file could not be removed.
        }
    }

    private String sanitizeFileName(String fileName) {
        String safeName = fileName == null ? "tep-dinh-kem" : Path.of(fileName).getFileName().toString();
        safeName = safeName.replaceAll("[\\p{Cntrl}]", "").trim();
        return safeName.isBlank() ? "tep-dinh-kem" : safeName;
    }

    private String getExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex < 1 || dotIndex == fileName.length() - 1) throw new BadRequestException("Tệp phải có phần mở rộng hợp lệ.");
        return fileName.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
    }

    private record AttachmentData(String name, String url, String type, String mimeType, long size) { }
}
