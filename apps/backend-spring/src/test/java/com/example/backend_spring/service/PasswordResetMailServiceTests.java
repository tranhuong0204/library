package com.example.backend_spring.service;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class PasswordResetMailServiceTests {

    @Test
    void sendsResetLinkThroughConfiguredMailSender() {
        JavaMailSender sender = mock(JavaMailSender.class);
        PasswordResetMailService service = configuredService(sender, true, false);

        assertTrue(service.sendResetLink("student@example.com", "reset-token"));

        ArgumentCaptor<SimpleMailMessage> messageCaptor =
                ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(sender).send(messageCaptor.capture());
        SimpleMailMessage message = messageCaptor.getValue();
        assertEquals("student@example.com", message.getTo()[0]);
        assertTrue(message.getText().contains(
                "http://localhost:5173/reset-password?token=reset-token"
        ));
    }

    @Test
    void exposesResetUrlOnlyInDevelopmentWhenEmailWasNotDelivered() {
        PasswordResetMailService service = configuredService(
                mock(JavaMailSender.class),
                false,
                true
        );

        assertFalse(service.sendResetLink("student@example.com", "reset-token"));
        Optional<String> resetUrl = service.developmentResetUrl("reset-token", false);

        assertTrue(resetUrl.isPresent());
        assertTrue(resetUrl.get().contains("token=reset-token"));
    }

    private PasswordResetMailService configuredService(
            JavaMailSender sender,
            boolean mailEnabled,
            boolean exposeResetLink
    ) {
        PasswordResetMailService service = new PasswordResetMailService(sender);
        ReflectionTestUtils.setField(service, "mailEnabled", mailEnabled);
        ReflectionTestUtils.setField(service, "exposeResetLink", exposeResetLink);
        ReflectionTestUtils.setField(service, "frontendBaseUrl", "http://localhost:5173");
        ReflectionTestUtils.setField(service, "senderAddress", "no-reply@libria.local");
        return service;
    }
}
