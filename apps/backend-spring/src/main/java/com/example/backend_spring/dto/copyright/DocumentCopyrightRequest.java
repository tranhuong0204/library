package com.example.backend_spring.dto.copyright;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentCopyrightRequest {

    @NotNull(message = "Tài liệu không được để trống")
    private Long documentId;

    @NotBlank(message = "Chủ sở hữu bản quyền không được để trống")
    private String copyrightOwner;

    private String author;

    @NotBlank(message = "Loại bản quyền / giấy phép không được để trống")
    private String licenseType;

    private String certificateNumber;

    private LocalDateTime registrationDate;

    private LocalDateTime expirationDate;

    private String terms;
}
