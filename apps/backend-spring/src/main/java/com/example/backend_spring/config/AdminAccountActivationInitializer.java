package com.example.backend_spring.config;

import com.example.backend_spring.enums.Role;
import com.example.backend_spring.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class AdminAccountActivationInitializer implements ApplicationRunner {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        userRepository.findByRole(Role.ADMIN).stream()
                .filter(user -> !Boolean.TRUE.equals(user.getActive()))
                .forEach(user -> user.setActive(true));
    }
}
