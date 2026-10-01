package com.example.backend_spring.service;

import com.example.backend_spring.dto.category.CategoryRequest;
import com.example.backend_spring.dto.category.CategoryResponse;
import com.example.backend_spring.entity.Category;
import com.example.backend_spring.exception.BadRequestException;
import com.example.backend_spring.exception.ResourceNotFoundException;
import com.example.backend_spring.repository.CategoryRepository;
import com.example.backend_spring.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final DocumentRepository documentRepository;

    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        String name = normalizeName(request.getName());

        if (categoryRepository.existsByName(name)) {
            throw new BadRequestException("Tên chủ đề đã tồn tại");
        }

        Category category = Category.builder()
                .name(name)
                .description(normalizeText(request.getDescription()))
                .build();

        return toResponse(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chủ đề"));

        String name = normalizeName(request.getName());

        if (categoryRepository.existsByNameAndIdNot(name, id)) {
            throw new BadRequestException("Tên chủ đề đã tồn tại");
        }

        category.setName(name);
        category.setDescription(normalizeText(request.getDescription()));


        return toResponse(categoryRepository.save(category));
    }

    @Transactional
    public Map<String, String> deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chủ đề"));

        if (documentRepository.existsByCategoryId(id)) {
            throw new BadRequestException("Không thể xóa chủ đề đang có tài liệu. Hãy chuyển tài liệu sang chủ đề khác trước.");
        }

        categoryRepository.delete(category);
        return Map.of("message", "Xóa chủ đề thành công");
    }

    private String normalizeName(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new BadRequestException("Tên chủ đề không được để trống");
        }
        return value.trim();
    }

    private String normalizeText(String value) {
        return value == null ? null : value.trim();
    }

    private CategoryResponse toResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .CategoryID(category.getId())
                .name(category.getName())
                .CategoryName(category.getName())
                .description(category.getDescription())
                .Description(category.getDescription())
                .icon(category.getIcon())
                .Icon(category.getIcon())
                .build();
    }
}
