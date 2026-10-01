package com.example.backend_spring.config;

import com.example.backend_spring.entity.News;
import com.example.backend_spring.enums.NewsStatus;
import com.example.backend_spring.repository.NewsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Adds a curated starter newsroom without overwriting content managed by admins.
 * Slugs make the import safe to run again whenever the application starts.
 */
@Component
@RequiredArgsConstructor
public class NewsDataInitializer implements ApplicationRunner {

    private static final Map<String, Long> LEGACY_SEED_VIEW_COUNTS = Map.of(
            "thu-vien-so-libria-ra-mat-khong-gian-hoc-tap-thong-minh", 1286L,
            "tuan-le-kham-pha-thu-vien-so-2026", 942L,
            "bo-sung-2000-giao-trinh-tai-lieu-thang-8", 735L,
            "5-ky-nang-tim-kiem-tai-lieu-hoc-thuat", 618L,
            "libria-nang-cap-tro-ly-ai-trich-dan-nguon", 1542L,
            "thu-thach-doc-sach-21-ngay", 487L,
            "bao-tri-he-thong-dinh-ky-08-08-2026", 326L,
            "huong-dan-xay-dung-bo-suu-tap-tai-lieu-ca-nhan", 409L
    );

    private final NewsRepository newsRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        starterNews().forEach(starter -> newsRepository.findBySlug(starter.getSlug())
                .ifPresentOrElse(this::resetLegacySeedViewCount, () -> newsRepository.save(starter)));
    }

    private void resetLegacySeedViewCount(News existing) {
        Long legacyCount = LEGACY_SEED_VIEW_COUNTS.get(existing.getSlug());
        if (legacyCount != null && legacyCount.equals(existing.getViewCount())) {
            existing.setViewCount(0L);
            newsRepository.save(existing);
        }
    }

    private List<News> starterNews() {
        LocalDateTime now = LocalDateTime.now();

        return List.of(
                article(
                        "Thư viện số LIBRIA chính thức ra mắt không gian học tập thông minh",
                        "thu-vien-so-libria-ra-mat-khong-gian-hoc-tap-thong-minh",
                        "Nền tảng mới kết nối kho học liệu, công cụ AI và cộng đồng học thuật trong một trải nghiệm thống nhất.",
                        "Sản phẩm & Công nghệ", true, now.minusDays(1),
                        "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1600&q=85",
                        """
                        ## Một không gian học tập được thiết kế cho thời đại số

                        LIBRIA chính thức giới thiệu phiên bản mới với mục tiêu giúp người học **tìm đúng tài liệu, hiểu nhanh nội dung và cộng tác hiệu quả hơn**. Giao diện được thiết kế lại theo hướng trực quan, ưu tiên khả năng tiếp cận trên cả máy tính và thiết bị di động.

                        ### Những điểm nổi bật

                        - Tìm kiếm tập trung trên toàn bộ kho tài liệu số.
                        - Trợ lý AI hỗ trợ tóm tắt, gợi ý từ khóa và giải đáp theo ngữ cảnh tài liệu.
                        - Không gian nhóm dành cho học tập, nghiên cứu và chia sẻ nguồn tham khảo.
                        - Hệ thống yêu thích giúp xây dựng bộ sưu tập cá nhân.

                        Đây là bước khởi đầu cho lộ trình xây dựng một hệ sinh thái tri thức mở, nơi công nghệ hỗ trợ người học chủ động hơn nhưng vẫn tôn trọng tính chính xác và nguồn gốc học thuật.
                        """),
                article(
                        "Tuần lễ khám phá thư viện số 2026: Học nhanh hơn, nghiên cứu sâu hơn",
                        "tuan-le-kham-pha-thu-vien-so-2026",
                        "Chuỗi hoạt động trải nghiệm, hướng dẫn kỹ năng tìm kiếm và workshop ứng dụng AI dành cho toàn thể bạn đọc.",
                        "Sự kiện", true, now.minusDays(3),
                        "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=85",
                        """
                        ## Cùng khám phá cách học tập hiệu quả hơn

                        Tuần lễ khám phá thư viện số 2026 mang đến các phiên hướng dẫn ngắn, thực hành trực tiếp và khu vực tư vấn dành cho người dùng mới.

                        ### Lịch hoạt động chính

                        - **Thứ Hai:** Làm quen với kho học liệu và tài khoản cá nhân.
                        - **Thứ Tư:** Workshop tìm kiếm tài liệu học thuật có chiến lược.
                        - **Thứ Sáu:** Thực hành sử dụng trợ lý AI an toàn và có trách nhiệm.

                        Người tham gia nên mang theo máy tính cá nhân để có trải nghiệm đầy đủ. Tài liệu hướng dẫn sau chương trình sẽ được cập nhật trực tiếp trên LIBRIA.
                        """),
                article(
                        "Bổ sung hơn 2.000 giáo trình và tài liệu tham khảo mới trong tháng 8",
                        "bo-sung-2000-giao-trinh-tai-lieu-thang-8",
                        "Kho học liệu tiếp tục được mở rộng ở các lĩnh vực công nghệ, kinh tế, ngoại ngữ và kỹ năng nghiên cứu.",
                        "Tài nguyên mới", false, now.minusDays(5),
                        "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1600&q=85",
                        """
                        ## Kho tri thức mới dành cho bạn

                        Trong tháng 8, LIBRIA đã bổ sung hơn **2.000 tài liệu** được chọn lọc theo nhu cầu học tập và nghiên cứu thực tế. Các tài liệu đều được chuẩn hóa thông tin mô tả để người dùng tìm kiếm thuận tiện hơn.

                        Các nhóm nội dung được cập nhật nhiều nhất gồm khoa học máy tính, quản trị kinh doanh, thiết kế, ngoại ngữ và phương pháp nghiên cứu. Bạn đọc có thể sử dụng bộ lọc chủ đề, năm xuất bản và loại tài liệu để nhanh chóng thu hẹp kết quả.

                        Hãy thêm tài liệu hữu ích vào mục Yêu thích để xây dựng giá sách cá nhân và quay lại bất cứ lúc nào.
                        """),
                article(
                        "5 kỹ năng tìm kiếm tài liệu học thuật mọi sinh viên nên biết",
                        "5-ky-nang-tim-kiem-tai-lieu-hoc-thuat",
                        "Từ lựa chọn từ khóa đến đánh giá độ tin cậy, những nguyên tắc nhỏ này sẽ giúp quá trình nghiên cứu hiệu quả hơn.",
                        "Góc học tập", false, now.minusDays(7),
                        "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=1600&q=85",
                        """
                        ## Tìm ít hơn, nhưng đúng hơn

                        Một truy vấn tốt thường bắt đầu bằng câu hỏi nghiên cứu rõ ràng. Thay vì nhập cả câu dài, hãy tách vấn đề thành các khái niệm chính và chuẩn bị từ đồng nghĩa cho từng khái niệm.

                        1. Xác định 2–4 từ khóa cốt lõi.
                        2. Dùng dấu ngoặc kép khi cần tìm một cụm từ chính xác.
                        3. Kết hợp từ khóa bằng AND, OR và NOT.
                        4. Ưu tiên tài liệu có tác giả, năm xuất bản và nguồn phát hành rõ ràng.
                        5. Đọc tóm tắt trước khi dành thời gian cho toàn văn.

                        Cuối cùng, hãy lưu lại truy vấn hiệu quả. Đây là cách đơn giản để cập nhật nguồn mới mà không phải bắt đầu lại từ đầu.
                        """),
                article(
                        "LIBRIA nâng cấp trợ lý AI: Trả lời minh bạch hơn với nguồn trích dẫn",
                        "libria-nang-cap-tro-ly-ai-trich-dan-nguon",
                        "Bản cập nhật tập trung vào khả năng truy xuất theo tài liệu, hiển thị nguồn tham khảo và cải thiện trải nghiệm hội thoại.",
                        "Cập nhật hệ thống", true, now.minusDays(9),
                        "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1600&q=85",
                        """
                        ## Câu trả lời đáng tin cậy bắt đầu từ nguồn rõ ràng

                        Trợ lý AI của LIBRIA vừa được nâng cấp để hỗ trợ trả lời dựa trên nội dung tài liệu trong hệ thống. Khi có nguồn phù hợp, câu trả lời sẽ cung cấp thông tin tham chiếu giúp người dùng kiểm tra và đọc sâu hơn.

                        Bản cập nhật cũng cải thiện cách xử lý câu hỏi nối tiếp, tốc độ phản hồi và thông báo trong trường hợp chưa tìm thấy đủ căn cứ.

                        > AI là công cụ hỗ trợ khám phá tri thức. Với các nội dung quan trọng, người dùng vẫn nên đọc tài liệu gốc và kiểm chứng thông tin trước khi sử dụng.
                        """),
                article(
                        "Phát động thử thách đọc sách: 21 ngày xây dựng thói quen đọc bền vững",
                        "thu-thach-doc-sach-21-ngay",
                        "Mỗi ngày 20 phút, một hành trình nhỏ để biến việc đọc thành thói quen và kết nối với cộng đồng yêu sách.",
                        "Cộng đồng", false, now.minusDays(12),
                        "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1600&q=85",
                        """
                        ## 21 ngày dành thời gian cho tri thức

                        Thử thách đọc sách được thiết kế đơn giản: chọn một cuốn sách, đọc tối thiểu 20 phút mỗi ngày và ghi lại một ý tưởng đáng nhớ.

                        Người tham gia có thể chia sẻ tiến độ, trích dẫn yêu thích và bài học của mình tại khu vực thảo luận. Không có giới hạn về thể loại; điều quan trọng nhất là duy trì nhịp đọc phù hợp với lịch cá nhân.

                        Sau 21 ngày, hãy nhìn lại nhật ký đọc để thấy những thay đổi nhỏ đã tích lũy thành một hành trình đáng kể.
                        """),
                article(
                        "Bảo trì hệ thống định kỳ vào 23:00 ngày 08/08/2026",
                        "bao-tri-he-thong-dinh-ky-08-08-2026",
                        "Một số chức năng có thể tạm gián đoạn trong tối đa 30 phút để nâng cấp hiệu năng và độ ổn định.",
                        "Thông báo", false, now.minusDays(14),
                        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=85",
                        """
                        ## Thông tin bảo trì

                        LIBRIA sẽ thực hiện bảo trì định kỳ từ **23:00 đến 23:30 ngày 08/08/2026**. Trong thời gian này, việc đăng nhập, tải tài liệu và sử dụng trợ lý AI có thể bị gián đoạn ngắn.

                        Dữ liệu và tài liệu cá nhân của người dùng không bị ảnh hưởng. Vui lòng lưu công việc đang thực hiện trước thời điểm bảo trì.

                        Chúng tôi xin lỗi vì sự bất tiện và cảm ơn bạn đã đồng hành cùng LIBRIA.
                        """),
                article(
                        "Hướng dẫn xây dựng bộ sưu tập tài liệu cá nhân trên LIBRIA",
                        "huong-dan-xay-dung-bo-suu-tap-tai-lieu-ca-nhan",
                        "Sắp xếp nguồn học liệu theo môn học, dự án hoặc mục tiêu cá nhân để luôn tìm lại tài liệu quan trọng đúng lúc.",
                        "Hướng dẫn", false, now.minusDays(17),
                        "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=1600&q=85",
                        """
                        ## Biến kho tài liệu thành thư viện của riêng bạn

                        Khi gặp một tài liệu hữu ích, hãy chọn biểu tượng **Yêu thích** để lưu vào tài khoản. Bạn có thể bắt đầu bằng ba nhóm đơn giản: tài liệu đang đọc, nguồn tham khảo cho dự án và nội dung muốn đọc sau.

                        Một bộ sưu tập tốt nên được rà soát định kỳ. Hãy loại bỏ tài liệu không còn phù hợp, bổ sung ghi chú và ưu tiên những nguồn có giá trị lâu dài.

                        Việc tổ chức chỉ mất vài phút nhưng sẽ tiết kiệm rất nhiều thời gian khi bạn bước vào kỳ thi hoặc bắt đầu một đề tài mới.
                        """)
        );
    }

    private News article(
            String title,
            String slug,
            String summary,
            String category,
            boolean featured,
            LocalDateTime createdAt,
            String thumbnailUrl,
            String content
    ) {
        return News.builder()
                .title(title)
                .slug(slug)
                .summary(summary)
                .content(content.strip())
                .thumbnailUrl(thumbnailUrl)
                .category(category)
                .featured(featured)
                .viewCount(0L)
                .status(NewsStatus.PUBLISHED)
                .createdAt(createdAt)
                .updatedAt(createdAt)
                .build();
    }
}
