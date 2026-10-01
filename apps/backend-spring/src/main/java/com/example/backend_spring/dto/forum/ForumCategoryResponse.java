package com.example.backend_spring.dto.forum;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForumCategoryResponse {

    private Long id;
    private Long CategoryID;

    private String name;
    private String Name;

    private String description;
    private String Description;

    private String color;
    private String Color;
}