package com.example.backend_spring.dto.forum;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForumCommentResponse {

    private Long id;
    private Long CommentID;

    private String content;
    private String Content;

    private Long userId;
    private Long UserID;

    private String authorName;
    private String AuthorName;

    private Long parentId;
    private Long ParentID;

    private Integer likeCount;
    private Integer LikeCount;

    private Boolean liked;
    private Boolean Liked;

    private LocalDateTime createdAt;
    private LocalDateTime CreatedAt;
}