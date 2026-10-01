package com.example.backend_spring.dto.news;

import com.example.backend_spring.enums.NewsStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewsResponse {

    private Long id;

    private String title;

    private String slug;

    private String summary;

    private String content;

    private String thumbnailUrl;

    private String category;

    private Boolean featured;

    private Long viewCount;

    private NewsStatus status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}