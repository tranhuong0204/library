package com.example.backend_spring.service;

import com.example.backend_spring.entity.User;
import com.example.backend_spring.enums.Role;
import com.example.backend_spring.exception.ForbiddenException;
import com.example.backend_spring.repository.CategoryRepository;
import com.example.backend_spring.repository.DocumentCommentRepository;
import com.example.backend_spring.repository.DocumentFavoriteRepository;
import com.example.backend_spring.repository.DocumentRatingRepository;
import com.example.backend_spring.repository.DocumentRepository;
import com.example.backend_spring.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DocumentServiceAuthorizationTests {

    private UserRepository userRepository;
    private DocumentService documentService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        documentService = new DocumentService(
                mock(DocumentRepository.class),
                mock(DocumentFavoriteRepository.class),
                mock(DocumentCommentRepository.class),
                mock(DocumentRatingRepository.class),
                userRepository,
                mock(CategoryRepository.class),
                mock(AiService.class)
        );

        User regularUser = User.builder()
                .username("regular-user")
                .role(Role.USER)
                .active(true)
                .build();
        when(userRepository.findByUsername("regular-user"))
                .thenReturn(Optional.of(regularUser));

        User librarianUser = User.builder()
                .username("librarian-user")
                .role(Role.LIBRARIAN)
                .active(true)
                .build();
        when(userRepository.findByUsername("librarian-user"))
                .thenReturn(Optional.of(librarianUser));
    }

    @Test
    void regularUserCannotCreateDocument() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);

        assertThrows(
                ForbiddenException.class,
                () -> documentService.createDocument(
                        "Title", null, null, 1L, file, null, "regular-user"
                )
        );
    }

    @Test
    void regularUserCannotUpdateDocument() {
        assertThrows(
                ForbiddenException.class,
                () -> documentService.updateDocument(
                        1L, "Title", null, null, 1L, null, null, "regular-user"
                )
        );
    }

    @Test
    void regularUserCannotDeleteDocument() {
        assertThrows(
                ForbiddenException.class,
                () -> documentService.deleteDocument(1L, "regular-user")
        );
    }

    @Test
    void librarianUserPassesAuthorizationCheck() {
        // If librarian calls deleteDocument, authorization passes and it proceeds to findById (throws ResourceNotFoundException instead of ForbiddenException)
        assertThrows(
                com.example.backend_spring.exception.ResourceNotFoundException.class,
                () -> documentService.deleteDocument(999L, "librarian-user")
        );
    }
}
