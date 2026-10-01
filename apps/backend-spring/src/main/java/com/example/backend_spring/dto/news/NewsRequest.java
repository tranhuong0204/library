package com.example.backend_spring.dto.news;

import com.example.backend_spring.enums.NewsStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NewsRequest {

    private String title;

    private String summary;

    private String content;

    private String thumbnailUrl;

    private String category;

    private Boolean featured;

    private NewsStatus status;
}