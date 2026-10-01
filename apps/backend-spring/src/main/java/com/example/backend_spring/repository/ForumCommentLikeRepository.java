package com.example.backend_spring.repository;

import com.example.backend_spring.entity.ForumCommentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.Collection;

public interface ForumCommentLikeRepository extends JpaRepository<ForumCommentLike, Long> {

    boolean existsByCommentIdAndUserId(Long commentId, Long userId);

    Optional<ForumCommentLike> findByCommentIdAndUserId(Long commentId, Long userId);

    @Transactional
    @Modifying
    @Query("DELETE FROM ForumCommentLike l WHERE l.comment.id IN :commentIds")
    void deleteByCommentIds(@Param("commentIds") Collection<Long> commentIds);

    @Transactional
    @Modifying
    @Query("DELETE FROM ForumCommentLike l WHERE l.comment.post.id = :postId")
    void deleteByPostId(@Param("postId") Long postId);
}
