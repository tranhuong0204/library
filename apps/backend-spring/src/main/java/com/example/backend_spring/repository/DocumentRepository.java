package com.example.backend_spring.repository;

import com.example.backend_spring.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    @Query("SELECT d FROM Document d LEFT JOIN FETCH d.category LEFT JOIN FETCH d.uploadedBy WHERE d.approved = true ORDER BY d.createdAt DESC")
    List<Document> findByApprovedTrueOrderByCreatedAtDesc();

    @Query("SELECT d FROM Document d LEFT JOIN FETCH d.category LEFT JOIN FETCH d.uploadedBy WHERE d.category.id = :categoryId AND d.approved = true ORDER BY d.createdAt DESC")
    List<Document> findByCategoryIdAndApprovedTrueOrderByCreatedAtDesc(@Param("categoryId") Long categoryId);

    @Query("""
            SELECT d FROM Document d
            LEFT JOIN FETCH d.category c
            LEFT JOIN FETCH d.uploadedBy
            WHERE d.approved = true
              AND (:categoryId IS NULL OR c.id = :categoryId)
              AND (
                    :keyword = ''
                    OR LOWER(d.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(COALESCE(d.author, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(COALESCE(d.description, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(COALESCE(c.name, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
              )
            ORDER BY d.createdAt DESC
            """)
    List<Document> searchApprovedDocuments(
            @Param("keyword") String keyword,
            @Param("categoryId") Long categoryId
    );

    long countByApprovedTrue();

    boolean existsByCategoryId(Long categoryId);
}
