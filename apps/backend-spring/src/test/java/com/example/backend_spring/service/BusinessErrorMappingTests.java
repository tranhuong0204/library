package com.example.backend_spring.service;

import com.example.backend_spring.dto.user.ChangePasswordRequest;
import com.example.backend_spring.entity.User;
import com.example.backend_spring.enums.Role;
import com.example.backend_spring.exception.BadRequestException;
import com.example.backend_spring.exception.ForbiddenException;
import com.example.backend_spring.repository.ForumCategoryRepository;
import com.example.backend_spring.repository.ForumCommentLikeRepository;
import com.example.backend_spring.repository.ForumCommentRepository;
import com.example.backend_spring.repository.ForumPostLikeRepository;
import com.example.backend_spring.repository.ForumPostRepository;
import com.example.backend_spring.repository.ForumReportRepository;
import com.example.backend_spring.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class BusinessErrorMappingTests {

    @Test
    void wrongCurrentPasswordIsBadRequest() {
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        UserService service = new UserService(userRepository, passwordEncoder);
        User user = User.builder().username("member").password("encoded").build();
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setOldPassword("wrong");
        request.setNewPassword("new-password");

        when(userRepository.findByUsername("member")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "encoded")).thenReturn(false);

        assertThrows(BadRequestException.class, () -> service.changePassword("member", request));
    }

    @Test
    void regularUserCannotManageForumCategories() {
        UserRepository userRepository = mock(UserRepository.class);
        ForumService service = new ForumService(
                mock(ForumCategoryRepository.class),
                mock(ForumPostRepository.class),
                mock(ForumCommentRepository.class),
                mock(ForumPostLikeRepository.class),
                mock(ForumCommentLikeRepository.class),
                mock(ForumReportRepository.class),
                userRepository
        );
        User user = User.builder().id(10L).username("member").role(Role.USER).build();
        when(userRepository.findByUsername("member")).thenReturn(Optional.of(user));

        assertThrows(
                ForbiddenException.class,
                () -> service.createCategory(Map.of("name", "Restricted"), "member")
        );
    }
}
