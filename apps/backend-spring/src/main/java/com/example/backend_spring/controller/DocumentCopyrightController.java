package com.example.backend_spring.controller;

import com.example.backend_spring.dto.copyright.DocumentCopyrightRequest;
import com.example.backend_spring.service.DocumentCopyrightService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/copyrights")
@RequiredArgsConstructor
public class DocumentCopyrightController {

    private final DocumentCopyrightService copyrightService;

    @GetMapping
    public ResponseEntity<?> getAllCopyrights(
            @RequestParam(required = false) Long documentId,
            @RequestParam(required = false) String q
    ) {
        return ResponseEntity.ok(copyrightService.getAllCopyrights(documentId, q));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCopyrightById(@PathVariable Long id) {
        return ResponseEntity.ok(copyrightService.getCopyrightById(id));
    }

    @PostMapping
    public ResponseEntity<?> createCopyright(
            @Valid @RequestBody DocumentCopyrightRequest request
    ) {
        return ResponseEntity.ok(copyrightService.createCopyright(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCopyright(
            @PathVariable Long id,
            @Valid @RequestBody DocumentCopyrightRequest request
    ) {
        return ResponseEntity.ok(copyrightService.updateCopyright(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCopyright(@PathVariable Long id) {
        return ResponseEntity.ok(copyrightService.deleteCopyright(id));
    }
}
