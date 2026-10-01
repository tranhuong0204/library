package com.example.backend_spring.dto.group;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupResponse {

    private Long id;
    private Long GroupID;

    private String name;
    private String Name;

    private String description;
    private String Description;

    private String subject;
    private String Subject;

    private String visibility;
    private String Visibility;

    private Integer memberCount;
    private Integer MemberCount;

    private Long createdById;
    private Long CreatedBy;

    private String createdByName;
    private String CreatedByName;

    private Boolean joined;
    private Boolean Joined;

    private String joinStatus;
    private String JoinStatus;

    private Boolean owner;
    private Boolean Owner;

    private LocalDateTime createdAt;
    private LocalDateTime CreatedAt;
}