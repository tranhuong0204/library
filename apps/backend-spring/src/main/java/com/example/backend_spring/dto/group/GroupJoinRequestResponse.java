package com.example.backend_spring.dto.group;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupJoinRequestResponse {

    private Long id;
    private Long MemberID;

    private Long groupId;
    private Long GroupID;

    private String groupName;
    private String GroupName;

    private Long userId;
    private Long UserID;

    private String username;
    private String Username;

    private String fullName;
    private String FullName;

    private String email;
    private String Email;

    private String status;
    private String Status;

    private LocalDateTime joinedAt;
    private LocalDateTime JoinedAt;
}