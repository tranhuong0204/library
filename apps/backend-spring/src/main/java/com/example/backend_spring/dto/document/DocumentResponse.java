package com.example.backend_spring.dto.document;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentResponse {

    private Long id;
    private Long DocumentID;

    private String title;
    private String Title;

    private String author;
    private String Author;

    private String description;
    private String Description;

    private String fileUrl;
    private String FileUrl;

    private String coverUrl;
    private String CoverUrl;

    private String fileType;
    private String FileType;

    private Long fileSize;
    private Long FileSize;

    private Integer viewCount;
    private Integer ViewCount;

    private Integer downloadCount;
    private Integer DownloadCount;

    private Long categoryId;
    private Long CategoryID;

    private String categoryName;
    private String CategoryName;

    private String uploadedByName;
    private String UploadedByName;

    private LocalDateTime createdAt;
    private LocalDateTime CreatedAt;
}