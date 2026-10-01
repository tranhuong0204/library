package com.example.backend_spring.repository;

import com.example.backend_spring.entity.DocumentRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface DocumentRatingRepository extends JpaRepository<DocumentRating, Long> {

    Optional<DocumentRating> findByUserIdAndDocumentId(Long userId, Long documentId);

    List<DocumentRating> findByDocumentId(Long documentId);

    Long countByDocumentId(Long documentId);

    void deleteByDocumentId(Long documentId);

    @Query("SELECT AVG(r.rating) FROM DocumentRating r WHERE r.document.id = :documentId")
    Double getAverageRatingByDocumentId(Long documentId);
}