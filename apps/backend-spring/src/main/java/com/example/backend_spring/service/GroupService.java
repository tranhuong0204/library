package com.example.backend_spring.service;

import com.example.backend_spring.dto.group.CreateGroupRequest;
import com.example.backend_spring.dto.group.GroupChatResponse;
import com.example.backend_spring.dto.group.GroupJoinRequestResponse;
import com.example.backend_spring.dto.group.GroupResponse;
import com.example.backend_spring.dto.group.SendMessageRequest;
import com.example.backend_spring.entity.GroupChat;
import com.example.backend_spring.entity.GroupMember;
import com.example.backend_spring.entity.StudyGroup;
import com.example.backend_spring.entity.User;
import com.example.backend_spring.enums.Role;
import com.example.backend_spring.exception.BadRequestException;
import com.example.backend_spring.exception.ForbiddenException;
import com.example.backend_spring.exception.ResourceNotFoundException;
import com.example.backend_spring.repository.GroupChatRepository;
import com.example.backend_spring.repository.GroupMemberRepository;
import com.example.backend_spring.repository.StudyGroupRepository;
import com.example.backend_spring.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class GroupService {

    private static final long MAX_CHAT_FILE_SIZE = 10L * 1024 * 1024;
    private static final Set<String> IMAGE_EXTENSIONS =
            Set.of("jpg", "jpeg", "png", "gif", "webp");
    private static final Set<String> DOCUMENT_EXTENSIONS =
            Set.of("pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "zip");

    private final StudyGroupRepository studyGroupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupChatRepository groupChatRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public List<GroupResponse> getGroups(String username) {
        User currentUser = null;

        if (username != null && !username.isBlank()) {
            currentUser = userRepository.findByUsername(username).orElse(null);
        }

        User finalCurrentUser = currentUser;

        return studyGroupRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(group -> toGroupResponse(group, finalCurrentUser))
                .toList();
    }

    public GroupResponse createGroup(CreateGroupRequest request, String username) {
        User user = getUserByUsername(username);

        if (!isAdmin(user)) {
            throw new ForbiddenException("Chỉ quản trị viên mới có quyền tạo nhóm học tập");
        }

        String visibility = normalizeVisibility(request.getVisibility());

        StudyGroup group = StudyGroup.builder()
                .name(normalizeRequiredText(request.getName(), "Tên nhóm không được để trống"))
                .description(normalizeOptionalText(request.getDescription()))
                .subject(normalizeOptionalText(request.getSubject()))
                .visibility(visibility)
                .createdBy(user)
                .memberCount(1)
                .build();

        StudyGroup savedGroup = studyGroupRepository.save(group);

        GroupMember member = GroupMember.builder()
                .group(savedGroup)
                .user(user)
                .status(GroupMember.STATUS_APPROVED)
                .build();

        groupMemberRepository.save(member);

        return toGroupResponse(savedGroup, user);
    }

    public Map<String, Object> joinGroup(Long groupId, String username) {
        User user = getUserByUsername(username);

        StudyGroup group = studyGroupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhóm"));

        GroupMember existingMember = groupMemberRepository.findByGroupIdAndUserId(groupId, user.getId())
                .orElse(null);

        if (existingMember != null) {
            String status = existingMember.getStatus();

            if (status == null || status.isBlank()) {
                existingMember.setStatus(getDefaultJoinStatus(group));
                groupMemberRepository.save(existingMember);

                if (GroupMember.STATUS_APPROVED.equalsIgnoreCase(existingMember.getStatus())) {
                    increaseMemberCount(group);

                    return Map.of(
                            "message", "Tham gia nhóm thành công",
                            "status", GroupMember.STATUS_APPROVED
                    );
                }

                notifyJoinRequestToManagers(group, user);

                return Map.of(
                        "message", "Đã gửi yêu cầu tham gia, vui lòng chờ duyệt",
                        "status", GroupMember.STATUS_PENDING
                );
            }

            if (GroupMember.STATUS_APPROVED.equalsIgnoreCase(status)) {
                return Map.of(
                        "message", "Bạn đã tham gia nhóm này rồi",
                        "status", GroupMember.STATUS_APPROVED
                );
            }

            if (GroupMember.STATUS_PENDING.equalsIgnoreCase(status)) {
                return Map.of(
                        "message", "Yêu cầu tham gia của bạn đang chờ duyệt",
                        "status", GroupMember.STATUS_PENDING
                );
            }

            if (GroupMember.STATUS_REJECTED.equalsIgnoreCase(status)) {
                existingMember.setStatus(getDefaultJoinStatus(group));
                groupMemberRepository.save(existingMember);

                if (GroupMember.STATUS_APPROVED.equalsIgnoreCase(existingMember.getStatus())) {
                    increaseMemberCount(group);

                    return Map.of(
                            "message", "Tham gia nhóm thành công",
                            "status", GroupMember.STATUS_APPROVED
                    );
                }

                notifyJoinRequestToManagers(group, user);

                return Map.of(
                        "message", "Đã gửi yêu cầu tham gia, vui lòng chờ duyệt",
                        "status", GroupMember.STATUS_PENDING
                );
            }
        }

        String status = getDefaultJoinStatus(group);

        GroupMember member = GroupMember.builder()
                .group(group)
                .user(user)
                .status(status)
                .build();

        groupMemberRepository.save(member);

        if (GroupMember.STATUS_APPROVED.equals(status)) {
            increaseMemberCount(group);

            return Map.of(
                    "message", "Tham gia nhóm thành công",
                    "status", GroupMember.STATUS_APPROVED
            );
        }

        notifyJoinRequestToManagers(group, user);

        return Map.of(
                "message", "Đã gửi yêu cầu tham gia, vui lòng chờ duyệt",
                "status", GroupMember.STATUS_PENDING
        );
    }

    public Map<String, Object> leaveGroup(Long groupId, String username) {
        User user = getUserByUsername(username);

        StudyGroup group = studyGroupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhóm"));

        if (isOwner(group, user)) {
            throw new BadRequestException("Chủ nhóm không thể rời nhóm. Hãy chuyển quyền hoặc xóa nhóm.");
        }

        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, user.getId())
                .orElseThrow(() -> new BadRequestException("Bạn chưa tham gia nhóm này"));

        String status = member.getStatus();

        groupMemberRepository.delete(member);

        if (GroupMember.STATUS_APPROVED.equalsIgnoreCase(status)) {
            int currentMemberCount = group.getMemberCount() == null ? 0 : group.getMemberCount();
            group.setMemberCount(Math.max(1, currentMemberCount - 1));
            studyGroupRepository.save(group);

            return Map.of(
                    "message", "Bạn đã rời nhóm thành công",
                    "status", "LEFT"
            );
        }

        if (GroupMember.STATUS_PENDING.equalsIgnoreCase(status)) {
            return Map.of(
                    "message", "Đã hủy yêu cầu tham gia nhóm",
                    "status", "LEFT"
            );
        }

        return Map.of(
                "message", "Bạn đã rời nhóm",
                "status", "LEFT"
        );
    }

    public List<GroupChatResponse> getChats(Long groupId, String channel, String username) {
        User user = getUserByUsername(username);
        StudyGroup group = getGroupById(groupId);

        ensureApprovedMemberOrOwnerOrAdmin(group, user);

        // A study group has one shared discussion timeline. Reading without a
        // channel filter also keeps messages created in legacy channels visible.
        return groupChatRepository.findByGroupIdOrderByCreatedAtAsc(groupId)
                .stream()
                .map(this::toChatResponse)
                .toList();
    }

    public GroupChatResponse sendMessage(Long groupId, SendMessageRequest request, String username) {
        User user = getUserByUsername(username);
        StudyGroup group = getGroupById(groupId);

        ensureApprovedMemberOrOwnerOrAdmin(group, user);

        GroupChat chat = GroupChat.builder()
                .content(request.getContent())
                .channel("general")
                .group(group)
                .user(user)
                .build();

        GroupChat savedChat = groupChatRepository.save(chat);

        return toChatResponse(savedChat);
    }

    public GroupChatResponse sendAttachment(
            Long groupId,
            MultipartFile file,
            String content,
            String requestedChannel,
            String username
    ) {
        User user = getUserByUsername(username);
        StudyGroup group = getGroupById(groupId);

        ensureApprovedMemberOrOwnerOrAdmin(group, user);
        validateChatFile(file);

        String originalName = sanitizeFileName(file.getOriginalFilename());
        String extension = getExtension(originalName);
        String attachmentType = IMAGE_EXTENSIONS.contains(extension) ? "IMAGE" : "FILE";
        String storedName = UUID.randomUUID() + "." + extension;
        Path groupDirectory = Path.of("uploads", "group-chat", String.valueOf(groupId))
                .toAbsolutePath()
                .normalize();
        Path targetFile = groupDirectory.resolve(storedName).normalize();

        if (!targetFile.startsWith(groupDirectory)) {
            throw new BadRequestException("Tên tệp không hợp lệ.");
        }

        try {
            Files.createDirectories(groupDirectory);
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new BadRequestException("Không thể lưu tệp đính kèm.");
        }

        GroupChat chat = GroupChat.builder()
                .content(content == null ? "" : content.trim())
                .channel("general")
                .attachmentName(originalName)
                .attachmentUrl("/uploads/group-chat/" + groupId + "/" + storedName)
                .attachmentType(attachmentType)
                .attachmentMimeType(file.getContentType())
                .attachmentSize(file.getSize())
                .group(group)
                .user(user)
                .build();

        return toChatResponse(groupChatRepository.save(chat));
    }

    public List<GroupJoinRequestResponse> getJoinRequests(Long groupId, String username) {
        User currentUser = getUserByUsername(username);
        StudyGroup group = getGroupById(groupId);

        ensureAdmin(currentUser);

        return groupMemberRepository
                .findByGroupIdAndStatusOrderByJoinedAtDesc(groupId, GroupMember.STATUS_PENDING)
                .stream()
                .map(this::toJoinRequestResponse)
                .toList();
    }

    public List<Map<String, Object>> getGroupMembers(Long groupId, String username) {
        User currentUser = getUserByUsername(username);
        StudyGroup group = getGroupById(groupId);

        ensureApprovedMemberOrOwnerOrAdmin(group, currentUser);

        Map<Long, Map<String, Object>> membersMap = new LinkedHashMap<>();

        if (group.getCreatedBy() != null && group.getCreatedBy().getId() != null) {
            User owner = group.getCreatedBy();

            GroupMember ownerMember = groupMemberRepository
                    .findByGroupIdAndUserId(groupId, owner.getId())
                    .orElse(null);

            membersMap.put(
                    owner.getId(),
                    toGroupMemberResponseFromUser(
                            owner,
                            ownerMember,
                            group,
                            GroupMember.STATUS_APPROVED
                    )
            );
        }

        groupMemberRepository
                .findByGroupIdAndStatusOrderByJoinedAtDesc(groupId, GroupMember.STATUS_APPROVED)
                .forEach(member -> {
                    User memberUser = member.getUser();

                    if (memberUser != null && memberUser.getId() != null) {
                        membersMap.put(
                                memberUser.getId(),
                                toGroupMemberResponse(member, group)
                        );
                    }
                });

        groupChatRepository
                .findByGroupIdOrderByCreatedAtAsc(groupId)
                .forEach(chat -> {
                    User chatUser = chat.getUser();

                    if (chatUser == null || chatUser.getId() == null) {
                        return;
                    }

                    if (!membersMap.containsKey(chatUser.getId())) {
                        GroupMember chatMember = groupMemberRepository
                                .findByGroupIdAndUserId(groupId, chatUser.getId())
                                .orElse(null);

                        String status = chatMember != null && chatMember.getStatus() != null
                                ? chatMember.getStatus()
                                : GroupMember.STATUS_APPROVED;

                        membersMap.put(
                                chatUser.getId(),
                                toGroupMemberResponseFromUser(
                                        chatUser,
                                        chatMember,
                                        group,
                                        status
                                )
                        );
                    }
                });

        return membersMap.values().stream().toList();
    }

    public Map<String, Object> approveJoinRequest(Long groupId, Long memberId, String username) {
        User currentUser = getUserByUsername(username);
        StudyGroup group = getGroupById(groupId);

        ensureAdmin(currentUser);

        GroupMember member = groupMemberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu tham gia"));

        if (member.getGroup() == null || !member.getGroup().getId().equals(groupId)) {
            throw new BadRequestException("Yêu cầu tham gia không thuộc nhóm này");
        }

        if (GroupMember.STATUS_APPROVED.equalsIgnoreCase(member.getStatus())) {
            return Map.of(
                    "message", "Thành viên này đã được duyệt trước đó",
                    "status", GroupMember.STATUS_APPROVED
            );
        }

        member.setStatus(GroupMember.STATUS_APPROVED);
        groupMemberRepository.save(member);

        increaseMemberCount(group);

        notificationService.createNotification(
                member.getUser(),
                "Yêu cầu tham gia đã được duyệt",
                "Bạn đã được duyệt vào nhóm " + group.getName(),
                "GROUP_JOIN_APPROVED"
        );

        return Map.of(
                "message", "Đã duyệt yêu cầu tham gia",
                "status", GroupMember.STATUS_APPROVED,
                "memberId", member.getId()
        );
    }

    public Map<String, Object> rejectJoinRequest(Long groupId, Long memberId, String username) {
        User currentUser = getUserByUsername(username);
        StudyGroup group = getGroupById(groupId);

        ensureAdmin(currentUser);

        GroupMember member = groupMemberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu tham gia"));

        if (member.getGroup() == null || !member.getGroup().getId().equals(groupId)) {
            throw new BadRequestException("Yêu cầu tham gia không thuộc nhóm này");
        }

        if (GroupMember.STATUS_APPROVED.equalsIgnoreCase(member.getStatus())) {
            throw new BadRequestException("Không thể từ chối thành viên đã được duyệt");
        }

        member.setStatus(GroupMember.STATUS_REJECTED);
        groupMemberRepository.save(member);

        notificationService.createNotification(
                member.getUser(),
                "Yêu cầu tham gia bị từ chối",
                "Yêu cầu tham gia nhóm " + group.getName() + " của bạn đã bị từ chối",
                "GROUP_JOIN_REJECTED"
        );

        return Map.of(
                "message", "Đã từ chối yêu cầu tham gia",
                "status", GroupMember.STATUS_REJECTED,
                "memberId", member.getId()
        );
    }

    @Transactional
    public GroupResponse updateGroup(Long groupId, CreateGroupRequest request, String username) {
        User currentUser = getUserByUsername(username);
        StudyGroup group = getGroupById(groupId);

        ensureOwnerOrAdmin(group, currentUser);

        String name = normalizeRequiredText(request.getName(), "Tên nhóm không được để trống");
        String visibility = normalizeVisibility(request.getVisibility());

        group.setName(name);
        group.setSubject(normalizeOptionalText(request.getSubject()));
        group.setDescription(normalizeOptionalText(request.getDescription()));
        group.setVisibility(visibility);

        StudyGroup savedGroup = studyGroupRepository.save(group);
        return toGroupResponse(savedGroup, currentUser);
    }

    @Transactional
    public Map<String, Object> deleteGroup(Long groupId, String username) {
        User currentUser = getUserByUsername(username);
        StudyGroup group = getGroupById(groupId);

        ensureOwnerOrAdmin(group, currentUser);

        groupChatRepository.deleteByGroupId(groupId);
        groupMemberRepository.deleteByGroupId(groupId);
        studyGroupRepository.delete(group);
        cleanupGroupAttachmentsAfterCommit(groupId);

        return Map.of(
                "message", "Xóa nhóm thành công",
                "groupId", groupId
        );
    }

    private void cleanupGroupAttachmentsAfterCommit(Long groupId) {
        Runnable cleanup = () -> deleteGroupAttachmentDirectory(groupId);

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    cleanup.run();
                }
            });
            return;
        }

        cleanup.run();
    }

    private void deleteGroupAttachmentDirectory(Long groupId) {
        Path uploadRoot = Path.of("uploads", "group-chat").toAbsolutePath().normalize();
        Path groupDirectory = uploadRoot.resolve(String.valueOf(groupId)).normalize();

        if (!groupDirectory.startsWith(uploadRoot) || !Files.exists(groupDirectory)) {
            return;
        }

        try (var paths = Files.walk(groupDirectory)) {
            paths.sorted(Comparator.reverseOrder()).forEach(path -> {
                try {
                    Files.deleteIfExists(path);
                } catch (IOException exception) {
                    log.warn("Không thể xóa tệp đính kèm của nhóm tại {}", path, exception);
                }
            });
        } catch (IOException exception) {
            log.warn("Không thể dọn thư mục tệp đính kèm của nhóm {}", groupId, exception);
        }
    }

    private void notifyJoinRequestToManagers(StudyGroup group, User requester) {
        String requesterName = getDisplayName(requester);
        String groupName = group.getName();

        notificationService.createNotificationForAdminsAndOwner(
                group.getCreatedBy(),
                "Yêu cầu tham gia nhóm",
                requesterName + " đã gửi yêu cầu tham gia nhóm " + groupName,
                "GROUP_JOIN_REQUEST"
        );
    }

    private StudyGroup getGroupById(Long groupId) {
        return studyGroupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhóm"));
    }

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
    }

    private String getDefaultJoinStatus(StudyGroup group) {
        // Every new membership request must be approved by an administrator,
        // regardless of whether the group is public or private.
        return GroupMember.STATUS_PENDING;
    }

    private void increaseMemberCount(StudyGroup group) {
        group.setMemberCount(group.getMemberCount() == null ? 1 : group.getMemberCount() + 1);
        studyGroupRepository.save(group);
    }

    private void ensureApprovedMemberOrOwnerOrAdmin(StudyGroup group, User user) {
        if (isOwner(group, user) || isAdmin(user)) {
            return;
        }

        boolean approved = groupMemberRepository.existsByGroupIdAndUserIdAndStatus(
                group.getId(),
                user.getId(),
                GroupMember.STATUS_APPROVED
        );

        if (!approved) {
            throw new ForbiddenException("Bạn cần được duyệt để xem nội dung nhóm");
        }
    }

    private void ensureOwnerOrAdmin(StudyGroup group, User user) {
        if (isOwner(group, user) || isAdmin(user)) {
            return;
        }

        throw new ForbiddenException("Bạn không có quyền quản lý yêu cầu tham gia nhóm này");
    }

    private void ensureAdmin(User user) {
        if (!isAdmin(user)) {
            throw new ForbiddenException("Chỉ quản trị viên mới có quyền duyệt yêu cầu tham gia nhóm");
        }
    }

    private boolean isOwner(StudyGroup group, User user) {
        return group.getCreatedBy() != null
                && user != null
                && group.getCreatedBy().getId().equals(user.getId());
    }

    private boolean isAdmin(User user) {
        return user != null && Role.ADMIN.equals(user.getRole());
    }

    private String normalizeRequiredText(String value, String message) {
        if (value == null || value.trim().isEmpty()) {
            throw new BadRequestException(message);
        }

        return value.trim();
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeVisibility(String visibility) {
        if (visibility == null || visibility.isBlank()) {
            return StudyGroup.VISIBILITY_PUBLIC;
        }

        String value = visibility.trim().toUpperCase();

        return switch (value) {
            case StudyGroup.VISIBILITY_PUBLIC, StudyGroup.VISIBILITY_PRIVATE -> value;
            default -> StudyGroup.VISIBILITY_PUBLIC;
        };
    }

    private String normalizeChannel(String channel) {
        if (channel == null || channel.isBlank()) {
            return "general";
        }

        String value = channel.trim().toLowerCase();

        return switch (value) {
            case "general", "qa", "docs" -> value;
            default -> "general";
        };
    }

    private String getDisplayName(User user) {
        if (user == null) {
            return "Người dùng";
        }

        if (user.getFullName() != null && !user.getFullName().isBlank()) {
            return user.getFullName();
        }

        if (user.getUsername() != null && !user.getUsername().isBlank()) {
            return user.getUsername();
        }

        return "Người dùng";
    }

    private GroupResponse toGroupResponse(StudyGroup group, User currentUser) {
        Long createdById = group.getCreatedBy() != null ? group.getCreatedBy().getId() : null;
        String createdByName = group.getCreatedBy() != null ? group.getCreatedBy().getFullName() : "Ẩn danh";

        String visibility = group.getVisibility() == null || group.getVisibility().isBlank()
                ? StudyGroup.VISIBILITY_PUBLIC
                : group.getVisibility();

        Boolean joined = false;
        Boolean owner = false;
        String joinStatus = null;

        if (currentUser != null) {
            owner = isOwner(group, currentUser);

            GroupMember member = groupMemberRepository
                    .findByGroupIdAndUserId(group.getId(), currentUser.getId())
                    .orElse(null);

            if (member != null) {
                joinStatus = member.getStatus();
                joined = GroupMember.STATUS_APPROVED.equalsIgnoreCase(member.getStatus());
            }

            if (owner || isAdmin(currentUser)) {
                joined = true;
                joinStatus = GroupMember.STATUS_APPROVED;
            }
        }

        return GroupResponse.builder()
                .id(group.getId())
                .GroupID(group.getId())

                .name(group.getName())
                .Name(group.getName())

                .description(group.getDescription())
                .Description(group.getDescription())

                .subject(group.getSubject())
                .Subject(group.getSubject())

                .visibility(visibility)
                .Visibility(visibility)

                .memberCount(group.getMemberCount())
                .MemberCount(group.getMemberCount())

                .createdById(createdById)
                .CreatedBy(createdById)

                .createdByName(createdByName)
                .CreatedByName(createdByName)

                .joined(joined)
                .Joined(joined)

                .joinStatus(joinStatus)
                .JoinStatus(joinStatus)

                .owner(owner)
                .Owner(owner)

                .createdAt(group.getCreatedAt())
                .CreatedAt(group.getCreatedAt())

                .build();
    }

    private GroupChatResponse toChatResponse(GroupChat chat) {
        Long userId = chat.getUser() != null ? chat.getUser().getId() : null;
        String authorName = chat.getUser() != null ? chat.getUser().getFullName() : "Ẩn danh";
        Long groupId = chat.getGroup() != null ? chat.getGroup().getId() : null;
        String channel = chat.getChannel() == null || chat.getChannel().isBlank()
                ? "general"
                : chat.getChannel();

        return GroupChatResponse.builder()
                .id(chat.getId())
                .ChatID(chat.getId())

                .content(chat.getContent())
                .Content(chat.getContent())

                .channel(channel)
                .Channel(channel)

                .groupId(groupId)
                .GroupID(groupId)

                .userId(userId)
                .UserID(userId)

                .authorName(authorName)
                .AuthorName(authorName)

                .attachmentName(chat.getAttachmentName())
                .AttachmentName(chat.getAttachmentName())

                .attachmentUrl(chat.getAttachmentUrl())
                .AttachmentUrl(chat.getAttachmentUrl())

                .attachmentType(chat.getAttachmentType())
                .AttachmentType(chat.getAttachmentType())

                .attachmentMimeType(chat.getAttachmentMimeType())
                .AttachmentMimeType(chat.getAttachmentMimeType())

                .attachmentSize(chat.getAttachmentSize())
                .AttachmentSize(chat.getAttachmentSize())

                .createdAt(chat.getCreatedAt())
                .CreatedAt(chat.getCreatedAt())
                .build();
    }

    private void validateChatFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Vui lòng chọn tệp cần gửi.");
        }

        if (file.getSize() > MAX_CHAT_FILE_SIZE) {
            throw new BadRequestException("Tệp đính kèm không được vượt quá 10 MB.");
        }

        String originalName = sanitizeFileName(file.getOriginalFilename());
        String extension = getExtension(originalName);
        boolean isImage = IMAGE_EXTENSIONS.contains(extension);
        boolean isDocument = DOCUMENT_EXTENSIONS.contains(extension);

        if (!isImage && !isDocument) {
            throw new BadRequestException(
                    "Chỉ hỗ trợ ảnh, PDF, Word, Excel, PowerPoint, TXT hoặc ZIP."
            );
        }

        String contentType = file.getContentType();
        if (isImage && (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/"))) {
            throw new BadRequestException("Định dạng ảnh không hợp lệ.");
        }
    }

    private String sanitizeFileName(String fileName) {
        String safeName = fileName == null ? "tep-dinh-kem" : Path.of(fileName).getFileName().toString();
        safeName = safeName.replaceAll("[\\p{Cntrl}]", "").trim();

        if (safeName.isBlank()) {
            return "tep-dinh-kem";
        }

        return safeName.length() > 255 ? safeName.substring(safeName.length() - 255) : safeName;
    }

    private String getExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');

        if (dotIndex < 0 || dotIndex == fileName.length() - 1) {
            throw new BadRequestException("Tệp phải có phần mở rộng hợp lệ.");
        }

        return fileName.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
    }

    private Map<String, Object> toGroupMemberResponse(GroupMember member, StudyGroup group) {
        User user = member.getUser();

        Map<String, Object> response = new LinkedHashMap<>();

        Long userId = user != null ? user.getId() : null;
        String username = user != null ? user.getUsername() : null;
        String fullName = user != null ? user.getFullName() : null;
        String email = user != null ? user.getEmail() : null;
        Role role = user != null ? user.getRole() : null;

        boolean owner = user != null && isOwner(group, user);

        response.put("id", userId);
        response.put("Id", userId);

        response.put("userId", userId);
        response.put("UserID", userId);

        response.put("memberId", userId);
        response.put("MemberID", userId);

        response.put("groupMemberId", member.getId());
        response.put("GroupMemberID", member.getId());

        response.put("username", username);
        response.put("Username", username);

        response.put("fullName", fullName);
        response.put("FullName", fullName != null && !fullName.isBlank()
                ? fullName
                : username
        );

        response.put("email", email);
        response.put("Email", email);

        response.put("role", role != null ? role.name() : null);
        response.put("Role", role != null ? role.name() : null);

        response.put("status", member.getStatus());
        response.put("Status", member.getStatus());

        response.put("owner", owner);
        response.put("Owner", owner);

        response.put("joinedAt", member.getJoinedAt());
        response.put("JoinedAt", member.getJoinedAt());

        return response;
    }

    private Map<String, Object> toGroupMemberResponseFromUser(
            User user,
            GroupMember member,
            StudyGroup group,
            String fallbackStatus
    ) {
        Map<String, Object> response = new LinkedHashMap<>();

        Long userId = user != null ? user.getId() : null;
        String username = user != null ? user.getUsername() : null;
        String fullName = user != null ? user.getFullName() : null;
        String email = user != null ? user.getEmail() : null;
        Role role = user != null ? user.getRole() : null;

        boolean owner = user != null && isOwner(group, user);

        response.put("id", userId);
        response.put("Id", userId);

        response.put("userId", userId);
        response.put("UserID", userId);

        response.put("memberId", userId);
        response.put("MemberID", userId);

        response.put("groupMemberId", member != null ? member.getId() : null);
        response.put("GroupMemberID", member != null ? member.getId() : null);

        response.put("username", username);
        response.put("Username", username);

        response.put("fullName", fullName);
        response.put("FullName", fullName != null && !fullName.isBlank()
                ? fullName
                : username
        );

        response.put("email", email);
        response.put("Email", email);

        response.put("role", role != null ? role.name() : null);
        response.put("Role", role != null ? role.name() : null);

        String status = member != null && member.getStatus() != null
                ? member.getStatus()
                : fallbackStatus;

        response.put("status", status);
        response.put("Status", status);

        response.put("owner", owner);
        response.put("Owner", owner);

        response.put("joinedAt", member != null ? member.getJoinedAt() : null);
        response.put("JoinedAt", member != null ? member.getJoinedAt() : null);

        return response;
    }

    private GroupJoinRequestResponse toJoinRequestResponse(GroupMember member) {
        StudyGroup group = member.getGroup();
        User user = member.getUser();

        return GroupJoinRequestResponse.builder()
                .id(member.getId())
                .MemberID(member.getId())

                .groupId(group != null ? group.getId() : null)
                .GroupID(group != null ? group.getId() : null)

                .groupName(group != null ? group.getName() : null)
                .GroupName(group != null ? group.getName() : null)

                .userId(user != null ? user.getId() : null)
                .UserID(user != null ? user.getId() : null)

                .username(user != null ? user.getUsername() : null)
                .Username(user != null ? user.getUsername() : null)

                .fullName(user != null ? user.getFullName() : null)
                .FullName(user != null ? user.getFullName() : null)

                .email(user != null ? user.getEmail() : null)
                .Email(user != null ? user.getEmail() : null)

                .status(member.getStatus())
                .Status(member.getStatus())

                .joinedAt(member.getJoinedAt())
                .JoinedAt(member.getJoinedAt())

                .build();
    }
}
