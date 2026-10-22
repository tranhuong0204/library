package com.example.backend_spring.service;

import com.example.backend_spring.entity.User;
import com.example.backend_spring.exception.BadRequestException;
import com.example.backend_spring.exception.ResourceNotFoundException;
import com.example.backend_spring.repository.UserRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminUserDeletionService {

    private final EntityManager entityManager;
    private final UserRepository userRepository;

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null
                && authentication.getPrincipal() instanceof User currentUser
                && currentUser.getId().equals(userId)) {
            throw new BadRequestException("Bạn không thể xóa tài khoản quản trị đang đăng nhập");
        }

        execute("delete from AiMessage m where m.conversation.user.id = :userId", userId);
        execute("delete from AiConversation c where c.user.id = :userId", userId);

        execute("""
                delete from DocumentComment c
                where c.user.id = :userId or c.document.uploadedBy.id = :userId
                """, userId);
        execute("""
                delete from DocumentFavorite f
                where f.user.id = :userId or f.document.uploadedBy.id = :userId
                """, userId);
        execute("""
                delete from DocumentRating r
                where r.user.id = :userId or r.document.uploadedBy.id = :userId
                """, userId);
        execute("delete from Document d where d.uploadedBy.id = :userId", userId);

        execute("delete from Notification n where n.user.id = :userId", userId);

        userRepository.delete(user);
        userRepository.flush();
    }

    private void execute(String jpql, Long userId) {
        entityManager.createQuery(jpql)
                .setParameter("userId", userId)
                .executeUpdate();
    }
}
