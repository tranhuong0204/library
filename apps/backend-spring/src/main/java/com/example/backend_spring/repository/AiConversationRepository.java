package com.example.backend_spring.repository;

import com.example.backend_spring.entity.AiConversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AiConversationRepository extends JpaRepository<AiConversation, Long> {

    List<AiConversation> findByUserIdOrderByUpdatedAtDesc(Long userId);

    Optional<AiConversation> findByIdAndUserId(Long id, Long userId);

    boolean existsByIdAndUserId(Long id, Long userId);

    void deleteByIdAndUserId(Long id, Long userId);
}