package com.example.backend_spring.service;

import com.example.backend_spring.dto.news.NewsRequest;
import com.example.backend_spring.dto.news.NewsResponse;
import com.example.backend_spring.entity.News;
import com.example.backend_spring.enums.NewsStatus;
import com.example.backend_spring.exception.BadRequestException;
import com.example.backend_spring.exception.ResourceNotFoundException;
import com.example.backend_spring.repository.NewsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class NewsService {

    private final NewsRepository newsRepository;

    // =========================
    // USER - Xem tin đã xuất bản
    // =========================

    public List<NewsResponse> getPublishedNews() {
        return newsRepository.findByStatusOrderByCreatedAtDesc(NewsStatus.PUBLISHED)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<NewsResponse> getFeaturedNews() {
        return newsRepository.findByFeaturedTrueAndStatusOrderByCreatedAtDesc(NewsStatus.PUBLISHED)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public NewsResponse getNewsById(Long id) {
        News news = newsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin tức"));

        if (news.getStatus() == NewsStatus.PUBLISHED) {
            news.setViewCount(news.getViewCount() == null ? 1L : news.getViewCount() + 1);
            newsRepository.save(news);
        }

        return toResponse(news);
    }

    public NewsResponse getNewsBySlug(String slug) {
        News news = newsRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin tức"));

        if (news.getStatus() == NewsStatus.PUBLISHED) {
            news.setViewCount(news.getViewCount() == null ? 1L : news.getViewCount() + 1);
            newsRepository.save(news);
        }

        return toResponse(news);
    }

    // =========================
    // ADMIN - Quản lý tin tức
    // =========================

    public List<NewsResponse> getAllNewsForAdmin() {
        return newsRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public NewsResponse createNews(NewsRequest request) {
        validateNewsRequest(request);

        String slug = createUniqueSlug(request.getTitle());

        News news = News.builder()
                .title(request.getTitle().trim())
                .slug(slug)
                .summary(request.getSummary())
                .content(request.getContent())
                .thumbnailUrl(request.getThumbnailUrl())
                .category(request.getCategory())
                .featured(request.getFeatured() != null ? request.getFeatured() : false)
                .status(request.getStatus() != null ? request.getStatus() : NewsStatus.PUBLISHED)
                .viewCount(0L)
                .build();

        News savedNews = newsRepository.save(news);

        return toResponse(savedNews);
    }

    public NewsResponse updateNews(Long id, NewsRequest request) {
        News news = newsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin tức"));

        validateNewsRequest(request);

        String oldSlug = news.getSlug();
        String newSlugBase = toSlug(request.getTitle());

        news.setTitle(request.getTitle().trim());
        news.setSummary(request.getSummary());
        news.setContent(request.getContent());
        news.setThumbnailUrl(request.getThumbnailUrl());
        news.setCategory(request.getCategory());
        news.setFeatured(request.getFeatured() != null ? request.getFeatured() : false);
        news.setStatus(request.getStatus() != null ? request.getStatus() : NewsStatus.PUBLISHED);

        if (oldSlug == null || !oldSlug.equals(newSlugBase)) {
            news.setSlug(createUniqueSlugForUpdate(request.getTitle(), id));
        }

        News updatedNews = newsRepository.save(news);

        return toResponse(updatedNews);
    }

    public String deleteNews(Long id) {
        News news = newsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin tức"));

        newsRepository.delete(news);

        return "Xóa tin tức thành công";
    }

    // =========================
    // Validate
    // =========================

    private void validateNewsRequest(NewsRequest request) {
        if (request == null) {
            throw new BadRequestException("Dữ liệu tin tức không hợp lệ");
        }

        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new BadRequestException("Tiêu đề tin tức không được để trống");
        }

        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new BadRequestException("Nội dung tin tức không được để trống");
        }
    }

    // =========================
    // Mapper
    // =========================

    private NewsResponse toResponse(News news) {
        return NewsResponse.builder()
                .id(news.getId())
                .title(news.getTitle())
                .slug(news.getSlug())
                .summary(news.getSummary())
                .content(news.getContent())
                .thumbnailUrl(news.getThumbnailUrl())
                .category(news.getCategory())
                .featured(news.getFeatured())
                .viewCount(news.getViewCount())
                .status(news.getStatus())
                .createdAt(news.getCreatedAt())
                .updatedAt(news.getUpdatedAt())
                .build();
    }

    // =========================
    // Slug
    // =========================

    private String createUniqueSlug(String title) {
        String baseSlug = toSlug(title);
        String slug = baseSlug;
        int count = 1;

        while (newsRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + count;
            count++;
        }

        return slug;
    }

    private String createUniqueSlugForUpdate(String title, Long currentNewsId) {
        String baseSlug = toSlug(title);
        String slug = baseSlug;
        int count = 1;

        while (true) {
            var existedNews = newsRepository.findBySlug(slug);

            if (existedNews.isEmpty() || existedNews.get().getId().equals(currentNewsId)) {
                return slug;
            }

            slug = baseSlug + "-" + count;
            count++;
        }
    }

    private String toSlug(String input) {
        if (input == null || input.trim().isEmpty()) {
            return "tin-tuc";
        }

        String nowhitespace = input.trim().replaceAll("\\s+", "-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);

        String slug = Pattern.compile("\\p{InCombiningDiacriticalMarks}+")
                .matcher(normalized)
                .replaceAll("");

        slug = slug.toLowerCase(Locale.ENGLISH);
        slug = slug.replaceAll("đ", "d");
        slug = slug.replaceAll("[^a-z0-9-]", "");
        slug = slug.replaceAll("-+", "-");
        slug = slug.replaceAll("^-|-$", "");

        if (slug.isEmpty()) {
            return "tin-tuc";
        }

        return slug;
    }
}
