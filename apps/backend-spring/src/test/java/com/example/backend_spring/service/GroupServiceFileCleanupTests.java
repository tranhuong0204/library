package com.example.backend_spring.service;

import com.example.backend_spring.entity.StudyGroup;
import com.example.backend_spring.entity.User;
import com.example.backend_spring.enums.Role;
import com.example.backend_spring.repository.GroupChatRepository;
import com.example.backend_spring.repository.GroupMemberRepository;
import com.example.backend_spring.repository.StudyGroupRepository;
import com.example.backend_spring.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GroupServiceFileCleanupTests {

    @Test
    void deletingGroupRemovesItsAttachmentDirectory() throws Exception {
        long groupId = 987_654_321L;
        Path groupDirectory = Path.of("uploads", "group-chat", String.valueOf(groupId));
        Path attachment = groupDirectory.resolve("orphan-test.txt");
        Files.createDirectories(groupDirectory);
        Files.writeString(attachment, "temporary test attachment");

        StudyGroupRepository groupRepository = mock(StudyGroupRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        GroupService service = new GroupService(
                groupRepository,
                mock(GroupMemberRepository.class),
                mock(GroupChatRepository.class),
                userRepository,
                mock(NotificationService.class)
        );

        User owner = User.builder().id(42L).username("owner").role(Role.USER).build();
        StudyGroup group = StudyGroup.builder().id(groupId).createdBy(owner).build();
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(owner));
        when(groupRepository.findById(groupId)).thenReturn(Optional.of(group));

        service.deleteGroup(groupId, "owner");

        assertFalse(Files.exists(groupDirectory));
    }
}
