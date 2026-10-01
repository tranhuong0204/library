package com.example.backend_spring.repository;

import com.example.backend_spring.entity.User;
import com.example.backend_spring.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByUsernameOrEmail(String username, String email);

    Optional<User> findByResetPasswordToken(String resetPasswordToken);

    List<User> findByRole(Role role);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
}