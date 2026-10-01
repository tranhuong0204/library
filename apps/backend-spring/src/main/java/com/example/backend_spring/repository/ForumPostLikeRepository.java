package com.example.backend_spring.repository;

import com.example.backend_spring.entity.ForumPostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface ForumPostLikeRepository extends JpaRepository<ForumPostLike, Long> {

    boolean existsByPostIdAndUserId(Long postId, Long userId);

    Optional<ForumPostLike> findByPostIdAndUserId(Long postId, Long userId);

    Long countByPostId(Long postId);

    @Transactional
    @Modifying
    @Query("DELETE FROM ForumPostLike l WHERE l.post.id = :postId")
    void deleteByPostId(@Param("postId") Long postId);
}
