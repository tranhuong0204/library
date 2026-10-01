package com.example.backend_spring.repository;

import com.example.backend_spring.entity.DocumentComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface DocumentCommentRepository extends JpaRepository<DocumentComment, Long> {

    @Query("""
            SELECT c FROM DocumentComment c
            JOIN FETCH c.user
            WHERE c.document.id = :documentId
            ORDER BY c.createdAt DESC
            """)
    List<DocumentComment> findByDocumentIdOrderByCreatedAtDesc(Long documentId);

    void deleteByDocumentId(Long documentId);
}
