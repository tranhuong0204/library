package com.example.backend_spring.repository;

import com.example.backend_spring.entity.ForumComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ForumCommentRepository extends JpaRepository<ForumComment, Long> {

    List<ForumComment> findByPostIdOrderByCreatedAtAsc(Long postId);

    List<ForumComment> findByParentId(Long parentId);

    @Transactional
    @Modifying
    @Query("DELETE FROM ForumComment c WHERE c.post.id = :postId")
    void deleteByPostId(@Param("postId") Long postId);
}
