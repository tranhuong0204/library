package com.example.backend_spring.controller;

import com.example.backend_spring.entity.User;
import com.example.backend_spring.enums.Role;
import com.example.backend_spring.exception.BadRequestException;
import com.example.backend_spring.repository.UserRepository;
import com.example.backend_spring.service.AdminUserDeletionService;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AdminUserControllerTests {

    @Test
    void cannotChangeAdminAccountStatus() {
        UserRepository repository = mock(UserRepository.class);
        AdminUserController controller = new AdminUserController(
                repository,
                mock(PasswordEncoder.class),
                mock(AdminUserDeletionService.class));
        User admin = User.builder().id(1L).role(Role.ADMIN).active(true).build();
        when(repository.findById(1L)).thenReturn(Optional.of(admin));

        assertThrows(BadRequestException.class,
                () -> controller.updateUserStatus(1L, Map.of("enabled", false)));
    }

    @Test
    void adminEntityIsReactivatedBeforeUpdate() {
        User admin = User.builder().role(Role.ADMIN).active(false).build();

        admin.preUpdate();

        assertTrue(admin.getActive());
    }
}
