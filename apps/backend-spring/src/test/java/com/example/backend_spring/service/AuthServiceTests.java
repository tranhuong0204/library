package com.example.backend_spring.service;

import com.example.backend_spring.dto.ForgotPasswordRequest;
import com.example.backend_spring.entity.User;
import com.example.backend_spring.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceTests {

    @Test
    void forgotPasswordDoesNotRevealUnknownEmail() {
        UserRepository repository = mock(UserRepository.class);
        PasswordResetMailService mailService = mock(PasswordResetMailService.class);
        AuthService service = new AuthService(
                repository, mock(PasswordEncoder.class), mock(JwtService.class), mailService
        );
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("missing@example.com");
        when(repository.findByEmail(request.getEmail())).thenReturn(Optional.empty());

        Map<String, Object> response = service.forgotPassword(request);

        assertFalse(response.containsKey("token"));
        assertEquals(1, response.size());
        verifyNoInteractions(mailService);
    }

    @Test
    void forgotPasswordStoresTokenButNeverReturnsIt() {
        UserRepository repository = mock(UserRepository.class);
        PasswordResetMailService mailService = mock(PasswordResetMailService.class);
        AuthService service = new AuthService(
                repository, mock(PasswordEncoder.class), mock(JwtService.class), mailService
        );
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("user@example.com");
        User user = User.builder().email(request.getEmail()).active(true).build();
        when(repository.findByEmail(request.getEmail())).thenReturn(Optional.of(user));
        when(mailService.developmentResetUrl(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyBoolean()))
                .thenReturn(Optional.empty());

        Map<String, Object> response = service.forgotPassword(request);

        verify(repository).save(user);
        verify(mailService).sendResetLink(request.getEmail(), user.getResetPasswordToken());
        assertFalse(response.containsKey("token"));
        assertEquals(1, response.size());
    }
}
