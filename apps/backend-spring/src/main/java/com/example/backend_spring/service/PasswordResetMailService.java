package com.example.backend_spring.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetMailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.auth.expose-reset-link:false}")
    private boolean exposeResetLink;

    @Value("${app.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Value("${spring.mail.username:no-reply@libria.local}")
    private String senderAddress;

    public boolean sendResetLink(String recipient, String token) {
        if (!mailEnabled) {
            return false;
        }

        String resetUrl = buildResetUrl(token);
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(senderAddress);
        message.setTo(recipient);
        message.setSubject("LIBRIA - Đặt lại mật khẩu");
        message.setText("""
                Bạn vừa yêu cầu đặt lại mật khẩu LIBRIA.

                Mở liên kết sau trong vòng 30 phút:
                %s

                Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.
                """.formatted(resetUrl));

        try {
            mailSender.send(message);
            return true;
        } catch (MailException exception) {
            log.error("Không thể gửi email đặt lại mật khẩu tới {}", recipient, exception);
            return false;
        }
    }

    public Optional<String> developmentResetUrl(String token, boolean emailDelivered) {
        if (!emailDelivered && exposeResetLink) {
            return Optional.of(buildResetUrl(token));
        }
        return Optional.empty();
    }

    String buildResetUrl(String token) {
        return UriComponentsBuilder.fromUriString(frontendBaseUrl)
                .path("/reset-password")
                .queryParam("token", token)
                .build()
                .encode()
                .toUriString();
    }
}
