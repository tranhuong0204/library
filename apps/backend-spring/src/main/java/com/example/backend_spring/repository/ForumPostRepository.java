package com.example.backend_spring.repository;

import com.example.backend_spring.entity.ForumPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ForumPostRepository extends JpaRepository<ForumPost, Long> {

    @Query("SELECT p FROM ForumPost p LEFT JOIN FETCH p.category LEFT JOIN FETCH p.user ORDER BY p.createdAt DESC")
    List<ForumPost> findAllByOrderByCreatedAtDesc();

    @Query("SELECT p FROM ForumPost p LEFT JOIN FETCH p.category LEFT JOIN FETCH p.user WHERE p.category.id = :categoryId ORDER BY p.createdAt DESC")
    List<ForumPost> findByCategoryIdOrderByCreatedAtDesc(@Param("categoryId") Long categoryId);

    boolean existsByCategoryId(Long categoryId);
}