package com.example.backend_spring.repository;

import com.example.backend_spring.entity.DocumentCopyright;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentCopyrightRepository extends JpaRepository<DocumentCopyright, Long> {

    List<DocumentCopyright> findByDocumentId(Long documentId);
}
