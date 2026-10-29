package com.example.backend_spring.dto.copyright;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentCopyrightResponse {

    private Long id;
    private Long documentId;
    private String documentTitle;
    private String copyrightOwner;
    private String author;
    private String licenseType;
    private String certificateNumber;
    private LocalDateTime registrationDate;
    private LocalDateTime expirationDate;
    private String terms;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
