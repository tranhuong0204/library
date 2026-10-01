package com.example.backend_spring.controller;

import com.example.backend_spring.entity.ForumPost;
import com.example.backend_spring.entity.ForumReport;
import com.example.backend_spring.enums.ReportStatus;
import com.example.backend_spring.exception.BadRequestException;
import com.example.backend_spring.exception.ResourceNotFoundException;
import com.example.backend_spring.repository.ForumCommentRepository;
import com.example.backend_spring.repository.ForumCommentLikeRepository;
import com.example.backend_spring.repository.ForumPostLikeRepository;
import com.example.backend_spring.repository.ForumPostRepository;
import com.example.backend_spring.repository.ForumReportRepository;
import com.example.backend_spring.service.ForumService;
import com.example.backend_spring.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/forum")
@RequiredArgsConstructor
public class AdminForumController {

    private final ForumReportRepository forumReportRepository;
    private final ForumPostRepository forumPostRepository;
    private final ForumCommentRepository forumCommentRepository;
    private final ForumCommentLikeRepository forumCommentLikeRepository;
    private final ForumPostLikeRepository forumPostLikeRepository;
    private final ForumService forumService;

    @GetMapping("/reports")
    public ResponseEntity<?> getForumReports(
            @RequestParam(required = false) String status
    ) {
        List<ForumReport> reports;

        if (status != null && !status.isBlank()) {
            reports = forumReportRepository.findByStatusOrderByCreatedAtDesc(parseStatus(status));
        } else {
            reports = forumReportRepository.findAllByOrderByCreatedAtDesc();
        }

        long pendingReports = forumReportRepository.countByStatus(ReportStatus.PENDING);
        long resolvedReports = forumReportRepository.countByStatus(ReportStatus.RESOLVED);
        long rejectedReports = forumReportRepository.countByStatus(ReportStatus.REJECTED);

        Map<String, Object> response = new HashMap<>();
        response.put("reports", reports.stream().map(this::toReportMap).toList());
        response.put("totalReports", reports.size());
        response.put("pendingReports", pendingReports);
        response.put("resolvedReports", resolvedReports);
        response.put("rejectedReports", rejectedReports);
        response.put("message", pendingReports == 0 ? "Không có báo cáo vi phạm nào cần xử lý" : "Có báo cáo đang chờ xử lý");
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    @PutMapping("/reports/{reportId}/resolve")
    public ResponseEntity<?> resolveReport(
            @PathVariable Long reportId,
            @RequestBody(required = false) Map<String, Object> request
    ) {
        ForumReport report = forumReportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy báo cáo"));

        report.setStatus(ReportStatus.RESOLVED);
        report.setResolvedAt(LocalDateTime.now());
        String currentUser = SecurityUtils.getOptionalUsername();
        report.setResolvedBy(currentUser == null ? "admin" : currentUser);
        report.setAdminNote(getString(request, "adminNote"));

        ForumReport savedReport = forumReportRepository.save(report);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Đã đánh dấu báo cáo là đã xử lý");
        response.put("report", toReportMap(savedReport));

        return ResponseEntity.ok(response);
    }

    @PutMapping("/reports/{reportId}/reject")
    public ResponseEntity<?> rejectReport(
            @PathVariable Long reportId,
            @RequestBody(required = false) Map<String, Object> request
    ) {
        ForumReport report = forumReportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy báo cáo"));

        report.setStatus(ReportStatus.REJECTED);
        report.setResolvedAt(LocalDateTime.now());
        String currentUser = SecurityUtils.getOptionalUsername();
        report.setResolvedBy(currentUser == null ? "admin" : currentUser);
        report.setAdminNote(getString(request, "adminNote"));

        ForumReport savedReport = forumReportRepository.save(report);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Đã bỏ qua báo cáo");
        response.put("report", toReportMap(savedReport));

        return ResponseEntity.ok(response);
    }

    @Transactional
    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<?> deleteReportedPost(
            @PathVariable Long postId,
            @RequestParam(required = false) Long reportId
    ) {
        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết cần xóa"));

        ForumReport savedReport = null;

        if (reportId != null) {
            ForumReport report = forumReportRepository.findById(reportId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy báo cáo"));

            if (report.getPostId() == null || !report.getPostId().equals(postId)) {
                throw new BadRequestException("Báo cáo không thuộc bài viết này");
            }

            List<ForumReport> relatedReports = forumReportRepository.findByPostIdAndStatus(postId, ReportStatus.PENDING);
            relatedReports.forEach(item -> markResolved(item, "Admin đã xóa bài viết vi phạm"));
            forumReportRepository.saveAll(relatedReports);
            savedReport = report;
        }

        forumPostLikeRepository.deleteByPostId(postId);
        forumCommentLikeRepository.deleteByPostId(postId);
        forumCommentRepository.deleteByPostId(postId);
        forumPostRepository.delete(post);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Đã xóa bài viết và xử lý báo cáo");
        response.put("deletedPostId", postId);

        if (savedReport != null) {
            response.put("report", toReportMap(savedReport));
        }

        return ResponseEntity.ok(response);
    }

    @Transactional
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteReportedComment(
            @PathVariable Long commentId,
            @RequestParam Long reportId
    ) {
        ForumReport report = forumReportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy báo cáo"));
        if (report.getCommentId() == null || !report.getCommentId().equals(commentId)) {
            throw new BadRequestException("Báo cáo không thuộc bình luận này");
        }

        String currentUser = SecurityUtils.getOptionalUsername();
        forumService.deleteComment(commentId, currentUser == null ? "admin" : currentUser);
        List<ForumReport> relatedReports = forumReportRepository.findByTargetTypeAndTargetIdAndStatus(
                "COMMENT", commentId, ReportStatus.PENDING
        );
        relatedReports.forEach(item -> markResolved(item, "Admin đã xóa bình luận vi phạm"));
        forumReportRepository.saveAll(relatedReports);
        ForumReport savedReport = report;

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Đã xóa bình luận và xử lý báo cáo");
        response.put("deletedCommentId", commentId);
        response.put("report", toReportMap(savedReport));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/moderation")
    public ResponseEntity<?> handleForumModeration(
            @RequestBody Map<String, Object> request
    ) {
        Long reportId = getLong(request.get("reportId"));
        String action = getString(request, "action");
        String adminNote = getString(request, "adminNote");

        if (reportId == null) {
            throw new BadRequestException("Thiếu ID báo cáo");
        }

        if (action.isBlank()) {
            throw new BadRequestException("Thiếu hành động xử lý báo cáo");
        }

        ForumReport report = forumReportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy báo cáo"));

        if (action.equalsIgnoreCase("resolve") || action.equalsIgnoreCase("resolved")) {
            report.setStatus(ReportStatus.RESOLVED);
        } else if (action.equalsIgnoreCase("reject") || action.equalsIgnoreCase("rejected") || action.equalsIgnoreCase("ignore")) {
            report.setStatus(ReportStatus.REJECTED);
        } else {
            throw new BadRequestException("Hành động không hợp lệ");
        }

        report.setResolvedAt(LocalDateTime.now());
        String currentUser = SecurityUtils.getOptionalUsername();
        report.setResolvedBy(currentUser == null ? "admin" : currentUser);
        report.setAdminNote(adminNote);

        ForumReport savedReport = forumReportRepository.save(report);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Xử lý báo cáo thành công");
        response.put("report", toReportMap(savedReport));
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    private Map<String, Object> toReportMap(ForumReport report) {
        Map<String, Object> item = new HashMap<>();

        item.put("id", report.getId());
        item.put("reportId", report.getId());
        item.put("ReportID", report.getId());

        item.put("postId", report.getPostId());
        item.put("PostID", report.getPostId());
        item.put("postTitle", report.getPostTitle());
        item.put("PostTitle", report.getPostTitle());
        item.put("postContentPreview", report.getPostContentPreview());
        item.put("PostContentPreview", report.getPostContentPreview());
        item.put("targetType", report.getTargetType() == null ? "POST" : report.getTargetType());
        item.put("targetId", report.getTargetId() == null ? report.getPostId() : report.getTargetId());
        item.put("commentId", report.getCommentId());
        item.put("parentPostId", report.getParentPostId());
        item.put("commentContentPreview", report.getCommentContentPreview());

        item.put("reporterId", report.getReporterId());
        item.put("ReporterID", report.getReporterId());
        item.put("reporterUsername", report.getReporterUsername());
        item.put("ReporterUsername", report.getReporterUsername());

        item.put("reason", report.getReason());
        item.put("Reason", report.getReason());
        item.put("description", report.getDescription());
        item.put("Description", report.getDescription());

        item.put("status", report.getStatus() != null ? report.getStatus().name() : ReportStatus.PENDING.name());
        item.put("Status", report.getStatus() != null ? report.getStatus().name() : ReportStatus.PENDING.name());

        item.put("createdAt", report.getCreatedAt());
        item.put("CreatedAt", report.getCreatedAt());
        item.put("resolvedAt", report.getResolvedAt());
        item.put("ResolvedAt", report.getResolvedAt());
        item.put("resolvedBy", report.getResolvedBy());
        item.put("ResolvedBy", report.getResolvedBy());
        item.put("adminNote", report.getAdminNote());
        item.put("AdminNote", report.getAdminNote());

        return item;
    }

    private void markResolved(ForumReport report, String note) {
        report.setStatus(ReportStatus.RESOLVED);
        report.setResolvedAt(LocalDateTime.now());
        String currentUser = SecurityUtils.getOptionalUsername();
        report.setResolvedBy(currentUser == null ? "admin" : currentUser);
        report.setAdminNote(note);
    }

    private ReportStatus parseStatus(String status) {
        try {
            return ReportStatus.valueOf(status.trim().toUpperCase());
        } catch (Exception e) {
            return ReportStatus.PENDING;
        }
    }

    private String getString(Map<String, Object> request, String key) {
        if (request == null) {
            return "";
        }

        Object value = request.get(key);
        return value == null ? "" : String.valueOf(value).trim();
    }

    private Long getLong(Object value) {
        if (value == null) {
            return null;
        }

        try {
            return Long.valueOf(String.valueOf(value));
        } catch (Exception e) {
            return null;
        }
    }
}
