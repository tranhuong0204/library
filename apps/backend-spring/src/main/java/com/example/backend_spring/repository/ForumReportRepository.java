package com.example.backend_spring.repository;

import com.example.backend_spring.entity.ForumReport;
import com.example.backend_spring.enums.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ForumReportRepository extends JpaRepository<ForumReport, Long> {

    List<ForumReport> findByStatusOrderByCreatedAtDesc(ReportStatus status);

    List<ForumReport> findAllByOrderByCreatedAtDesc();

    long countByStatus(ReportStatus status);

    boolean existsByPostIdAndReporterId(Long postId, Long reporterId);

    boolean existsByTargetTypeAndTargetIdAndReporterId(String targetType, Long targetId, Long reporterId);

    List<ForumReport> findByPostIdAndStatus(Long postId, ReportStatus status);

    List<ForumReport> findByTargetTypeAndTargetIdAndStatus(String targetType, Long targetId, ReportStatus status);
}
