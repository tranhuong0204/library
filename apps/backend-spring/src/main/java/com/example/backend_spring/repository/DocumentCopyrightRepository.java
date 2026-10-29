package com.example.backend_spring.repository;

import com.example.backend_spring.entity.DocumentCopyright;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentCopyrightRepository extends JpaRepository<DocumentCopyright, Long> {

    @Query("SELECT dc FROM DocumentCopyright dc LEFT JOIN FETCH dc.document ORDER BY dc.id DESC")
    List<DocumentCopyright> findAllWithDocument();

    @Query("SELECT dc FROM DocumentCopyright dc LEFT JOIN FETCH dc.document WHERE dc.document.id = :documentId ORDER BY dc.id DESC")
    List<DocumentCopyright> findByDocumentIdWithDocument(@Param("documentId") Long documentId);

    List<DocumentCopyright> findByDocumentId(Long documentId);
}

