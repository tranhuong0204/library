package com.example.backend_spring.repository;

import com.example.backend_spring.entity.ForumCategory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ForumCategoryRepository extends JpaRepository<ForumCategory, Long> {

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, Long id);
}