package com.example.backend_spring.repository;

import com.example.backend_spring.entity.GroupMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {

    boolean existsByGroupIdAndUserId(Long groupId, Long userId);

    boolean existsByGroupIdAndUserIdAndStatus(Long groupId, Long userId, String status);

    Optional<GroupMember> findByGroupIdAndUserId(Long groupId, Long userId);

    List<GroupMember> findByGroupIdAndStatusOrderByJoinedAtDesc(Long groupId, String status);

    void deleteByGroupId(Long groupId);
}