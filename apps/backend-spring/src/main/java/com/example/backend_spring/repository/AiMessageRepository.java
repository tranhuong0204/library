package com.example.backend_spring.repository;

import com.example.backend_spring.entity.AiMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AiMessageRepository extends JpaRepository<AiMessage, Long> {

    List<AiMessage> findByConversationIdOrderByCreatedAtAsc(Long conversationId);

    void deleteByConversationId(Long conversationId);

    long countByConversationId(Long conversationId);
}