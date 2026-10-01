package com.example.backend_spring.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 250)
    private String title;

    @Column(length = 500)
    private String author;

    @Column(columnDefinition = "TEXT")
    private String description;

    // --- QUẢN LÝ BẢN QUYỀN & TRẠNG THÁI ---
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LicenseType licenseType = LicenseType.COPYRIGHT; // Mặc định là COPYRIGHT (An toàn nhất)

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DocumentStatus status = DocumentStatus.APPROVED; // Mặc định APPROVED

    public enum LicenseType {
        COPYRIGHT,        // Sách bản quyền -> Chỉ cho đọc Online, CẤM TẢI VỀ
        CREATIVE_COMMONS, // Tài liệu mở -> Hiển thị NÚT TẢI PDF
        PUBLIC_DOMAIN     // Miền công cộng -> Cho phép Tải & Đọc tự do
    }

    public enum DocumentStatus {
        APPROVED,   // Đang hiển thị công khai
        PENDING,    // Chờ duyệt bản quyền/nội dung
        TAKEDOWN    // Đã bị gỡ bỏ do vi phạm bản quyền
    }
    // ------------------------------------

    private String fileUrl;

    private String coverUrl;

    private String fileType;

    private Long fileSize;

    private Integer viewCount;

    private Integer downloadCount;

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne
    @JoinColumn(name = "uploaded_by")
    private User uploadedBy;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();

        if (this.viewCount == null) {
            this.viewCount = 0;
        }

        if (this.downloadCount == null) {
            this.downloadCount = 0;
        }

        if (this.licenseType == null) {
            this.licenseType = LicenseType.COPYRIGHT;
        }

        if (this.status == null) {
            this.status = DocumentStatus.APPROVED;
        }

        // Đồng bộ trạng thái approved theo status enum
        this.approved = (this.status == DocumentStatus.APPROVED);
    }
}