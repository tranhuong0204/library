package com.example.backend_spring.controller;

import com.example.backend_spring.dto.group.CreateGroupRequest;
import com.example.backend_spring.dto.group.SendMessageRequest;
import com.example.backend_spring.service.GroupService;
import com.example.backend_spring.utils.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @GetMapping
    public ResponseEntity<?> getGroups() {
        String username = SecurityUtils.getOptionalUsername();
        return ResponseEntity.ok(groupService.getGroups(username));
    }

    @PostMapping
    public ResponseEntity<?> createGroup(
            @Valid @RequestBody CreateGroupRequest request
    ) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(groupService.createGroup(request, username));
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<?> joinGroup(
            @PathVariable Long id
    ) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(groupService.joinGroup(id, username));
    }

    @DeleteMapping("/{id}/leave")
    public ResponseEntity<?> leaveGroup(
            @PathVariable Long id
    ) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(groupService.leaveGroup(id, username));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<?> getGroupMembers(
            @PathVariable Long id
    ) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(groupService.getGroupMembers(id, username));
    }

    @GetMapping("/{id}/chats")
    public ResponseEntity<?> getChats(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "general") String channel
    ) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(groupService.getChats(id, channel, username));
    }

    @PostMapping("/{id}/chats")
    public ResponseEntity<?> sendMessage(
            @PathVariable Long id,
            @Valid @RequestBody SendMessageRequest request
    ) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(groupService.sendMessage(id, request, username));
    }

    @PostMapping(
            value = "/{id}/chats/attachments",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> sendAttachment(
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file,
            @RequestParam(required = false, defaultValue = "") String content,
            @RequestParam(required = false, defaultValue = "general") String channel
    ) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(
                groupService.sendAttachment(id, file, content, channel, username)
        );
    }

    @GetMapping("/{id}/join-requests")
    public ResponseEntity<?> getJoinRequests(
            @PathVariable Long id
    ) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(groupService.getJoinRequests(id, username));
    }

    @PostMapping("/{groupId}/join-requests/{memberId}/approve")
    public ResponseEntity<?> approveJoinRequest(
            @PathVariable Long groupId,
            @PathVariable Long memberId
    ) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(groupService.approveJoinRequest(groupId, memberId, username));
    }

    @PostMapping("/{groupId}/join-requests/{memberId}/reject")
    public ResponseEntity<?> rejectJoinRequest(
            @PathVariable Long groupId,
            @PathVariable Long memberId
    ) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(groupService.rejectJoinRequest(groupId, memberId, username));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateGroup(
            @PathVariable Long id,
            @Valid @RequestBody CreateGroupRequest request
    ) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(groupService.updateGroup(id, request, username));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGroup(
            @PathVariable Long id
    ) {
        String username = SecurityUtils.getCurrentUsername();
        return ResponseEntity.ok(groupService.deleteGroup(id, username));
    }
}
