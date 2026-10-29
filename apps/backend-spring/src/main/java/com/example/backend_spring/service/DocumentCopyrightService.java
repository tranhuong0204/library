package com.example.backend_spring.service;

import com.example.backend_spring.dto.copyright.DocumentCopyrightRequest;
import com.example.backend_spring.dto.copyright.DocumentCopyrightResponse;
import com.example.backend_spring.entity.Document;
import com.example.backend_spring.entity.DocumentCopyright;
import com.example.backend_spring.exception.BadRequestException;
import com.example.backend_spring.exception.ResourceNotFoundException;
import com.example.backend_spring.repository.DocumentCopyrightRepository;
import com.example.backend_spring.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DocumentCopyrightService {

    private final DocumentCopyrightRepository copyrightRepository;
    private final DocumentRepository documentRepository;

    @Transactional(readOnly = true)
    public List<DocumentCopyrightResponse> getAllCopyrights(Long documentId, String q) {
        List<DocumentCopyright> list;
        if (documentId != null) {
            list = copyrightRepository.findByDocumentIdWithDocument(documentId);
        } else {
            list = copyrightRepository.findAllWithDocument();
        }

        if (q != null && !q.trim().isEmpty()) {
            String keyword = q.trim().toLowerCase();
            return list.stream()
                    .filter(c -> {
                        String docTitle = c.getDocument() != null && c.getDocument().getTitle() != null
                                ? c.getDocument().getTitle().toLowerCase() : "";
                        String owner = c.getCopyrightOwner() != null ? c.getCopyrightOwner().toLowerCase() : "";
                        String author = c.getAuthor() != null ? c.getAuthor().toLowerCase() : "";
                        String cert = c.getCertificateNumber() != null ? c.getCertificateNumber().toLowerCase() : "";
                        String lic = c.getLicenseType() != null ? c.getLicenseType().toLowerCase() : "";
                        return docTitle.contains(keyword) || owner.contains(keyword)
                                || author.contains(keyword) || cert.contains(keyword) || lic.contains(keyword);
                    })
                    .map(this::toResponse)
                    .toList();
        }

        return list.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public DocumentCopyrightResponse getCopyrightById(Long id) {
        DocumentCopyright copyright = copyrightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin bản quyền"));
        return toResponse(copyright);
    }

    @Transactional
    public DocumentCopyrightResponse createCopyright(DocumentCopyrightRequest request) {
        Document document = documentRepository.findById(request.getDocumentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu liên kết"));

        DocumentCopyright copyright = DocumentCopyright.builder()
                .document(document)
                .copyrightOwner(request.getCopyrightOwner().trim())
                .author(request.getAuthor() != null ? request.getAuthor().trim() : document.getAuthor())
                .licenseType(request.getLicenseType().trim())
                .certificateNumber(request.getCertificateNumber() != null ? request.getCertificateNumber().trim() : null)
                .registrationDate(request.getRegistrationDate())
                .expirationDate(request.getExpirationDate())
                .terms(request.getTerms() != null ? request.getTerms().trim() : null)
                .build();

        // Đồng bộ ngược lại document nếu chưa có
        if (document.getCopyrightOwner() == null || document.getCopyrightOwner().isBlank()) {
            document.setCopyrightOwner(copyright.getCopyrightOwner());
        }
        if (document.getCopyrightCertificate() == null || document.getCopyrightCertificate().isBlank()) {
            document.setCopyrightCertificate(copyright.getCertificateNumber());
        }
        documentRepository.save(document);

        return toResponse(copyrightRepository.save(copyright));
    }

    @Transactional
    public DocumentCopyrightResponse updateCopyright(Long id, DocumentCopyrightRequest request) {
        DocumentCopyright copyright = copyrightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin bản quyền"));

        Document document = documentRepository.findById(request.getDocumentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu liên kết"));

        copyright.setDocument(document);
        copyright.setCopyrightOwner(request.getCopyrightOwner().trim());
        copyright.setAuthor(request.getAuthor() != null ? request.getAuthor().trim() : null);
        copyright.setLicenseType(request.getLicenseType().trim());
        copyright.setCertificateNumber(request.getCertificateNumber() != null ? request.getCertificateNumber().trim() : null);
        copyright.setRegistrationDate(request.getRegistrationDate());
        copyright.setExpirationDate(request.getExpirationDate());
        copyright.setTerms(request.getTerms() != null ? request.getTerms().trim() : null);

        return toResponse(copyrightRepository.save(copyright));
    }

    @Transactional
    public Map<String, String> deleteCopyright(Long id) {
        DocumentCopyright copyright = copyrightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin bản quyền"));

        copyrightRepository.delete(copyright);
        return Map.of("message", "Đã xóa bản ghi bản quyền thành công");
    }

    private DocumentCopyrightResponse toResponse(DocumentCopyright c) {
        return DocumentCopyrightResponse.builder()
                .id(c.getId())
                .documentId(c.getDocument() != null ? c.getDocument().getId() : null)
                .documentTitle(c.getDocument() != null ? c.getDocument().getTitle() : null)
                .copyrightOwner(c.getCopyrightOwner())
                .author(c.getAuthor())
                .licenseType(c.getLicenseType())
                .certificateNumber(c.getCertificateNumber())
                .registrationDate(c.getRegistrationDate())
                .expirationDate(c.getExpirationDate())
                .terms(c.getTerms())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
