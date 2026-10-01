package com.example.backend_spring.dto.category;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryResponse {

    private Long id;
    private Long CategoryID;

    private String name;
    private String CategoryName;

    private String description;
    private String Description;

    private String icon;
    private String Icon;
}