package com.example.backend_spring.repository;

import com.example.backend_spring.entity.DocumentFavorite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DocumentFavoriteRepository extends JpaRepository<DocumentFavorite, Long> {

    List<DocumentFavorite> findByUserIdOrderByCreatedAtDesc(Long userId);

    boolean existsByUserIdAndDocumentId(Long userId, Long documentId);

    Optional<DocumentFavorite> findByUserIdAndDocumentId(Long userId, Long documentId);

    List<DocumentFavorite> findByDocumentId(Long documentId);
}