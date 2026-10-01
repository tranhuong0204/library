package com.example.backend_spring.repository;

import com.example.backend_spring.entity.News;
import com.example.backend_spring.enums.NewsStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NewsRepository extends JpaRepository<News, Long> {

    List<News> findByStatusOrderByCreatedAtDesc(NewsStatus status);

    List<News> findByFeaturedTrueAndStatusOrderByCreatedAtDesc(NewsStatus status);

    Optional<News> findBySlug(String slug);

    boolean existsBySlug(String slug);
}