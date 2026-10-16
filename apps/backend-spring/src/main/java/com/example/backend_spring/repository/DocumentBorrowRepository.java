package com.example.backend_spring.repository;

import com.example.backend_spring.entity.DocumentBorrow;
import com.example.backend_spring.enums.BorrowStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentBorrowRepository extends JpaRepository<DocumentBorrow, Long> {

    List<DocumentBorrow> findByUserId(Long userId);

    List<DocumentBorrow> findByDocumentId(Long documentId);

    List<DocumentBorrow> findByStatus(BorrowStatus status);

    List<DocumentBorrow> findByUserIdAndStatus(Long userId, BorrowStatus status);
}
