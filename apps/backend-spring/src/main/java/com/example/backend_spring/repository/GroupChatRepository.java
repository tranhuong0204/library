package com.example.backend_spring.repository;

import com.example.backend_spring.entity.GroupChat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GroupChatRepository extends JpaRepository<GroupChat, Long> {

    List<GroupChat> findByGroupIdOrderByCreatedAtAsc(Long groupId);

    List<GroupChat> findByGroupIdAndChannelOrderByCreatedAtAsc(Long groupId, String channel);

    void deleteByGroupId(Long groupId);
}