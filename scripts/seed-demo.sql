-- Demo data for the LIBRIA local Docker environment.
-- Prerequisite: user_demo and admin_demo must already exist.
-- The script is idempotent and can be run more than once.

SET NAMES utf8mb4;
SET time_zone = '+07:00';
START TRANSACTION;

SET @user_id := (SELECT id FROM users WHERE username = 'user_demo' LIMIT 1);
SET @admin_id := (SELECT id FROM users WHERE username = 'admin_demo' LIMIT 1);

UPDATE users
SET role = 'ADMIN', major = 'Quản trị hệ thống', active = b'1', updated_at = NOW()
WHERE username = 'admin_demo';

UPDATE users
SET role = 'USER', major = 'Công nghệ thông tin', active = b'1', updated_at = NOW()
WHERE username = 'user_demo';

-- Supporting users reuse the BCrypt hash of user_demo and exist only to make
-- community pages look representative. Their password is also User@123456.
INSERT IGNORE INTO users
    (username, email, password, full_name, major, role, active, created_at, updated_at)
SELECT 'lan_anh', 'lan.anh@libria.local', password, 'Lê Lan Anh', 'Ngôn ngữ Anh',
       'USER', b'1', DATE_SUB(NOW(), INTERVAL 95 DAY), NOW()
FROM users WHERE username = 'user_demo' LIMIT 1;

INSERT IGNORE INTO users
    (username, email, password, full_name, major, role, active, created_at, updated_at)
SELECT 'quoc_bao', 'quoc.bao@libria.local', password, 'Phạm Quốc Bảo', 'Khoa học dữ liệu',
       'USER', b'1', DATE_SUB(NOW(), INTERVAL 82 DAY), NOW()
FROM users WHERE username = 'user_demo' LIMIT 1;

INSERT IGNORE INTO users
    (username, email, password, full_name, major, role, active, created_at, updated_at)
SELECT 'thu_ha', 'thu.ha@libria.local', password, 'Đỗ Thu Hà', 'Quản trị kinh doanh',
       'USER', b'1', DATE_SUB(NOW(), INTERVAL 68 DAY), NOW()
FROM users WHERE username = 'user_demo' LIMIT 1;

INSERT IGNORE INTO users
    (username, email, password, full_name, major, role, active, created_at, updated_at)
SELECT 'minh_khoa', 'minh.khoa@libria.local', password, 'Võ Minh Khoa', 'Kỹ thuật phần mềm',
       'USER', b'1', DATE_SUB(NOW(), INTERVAL 54 DAY), NOW()
FROM users WHERE username = 'user_demo' LIMIT 1;

SET @lan_id := (SELECT id FROM users WHERE username = 'lan_anh' LIMIT 1);
SET @bao_id := (SELECT id FROM users WHERE username = 'quoc_bao' LIMIT 1);
SET @ha_id := (SELECT id FROM users WHERE username = 'thu_ha' LIMIT 1);
SET @khoa_id := (SELECT id FROM users WHERE username = 'minh_khoa' LIMIT 1);

INSERT IGNORE INTO categories (name, description, icon, created_at) VALUES
('Công nghệ thông tin', 'Giáo trình lập trình, hệ thống, cơ sở dữ liệu và kỹ thuật phần mềm.', '💻', DATE_SUB(NOW(), INTERVAL 120 DAY)),
('AI & Khoa học dữ liệu', 'Machine Learning, Deep Learning, xử lý dữ liệu và trí tuệ nhân tạo.', '🤖', DATE_SUB(NOW(), INTERVAL 116 DAY)),
('Kinh tế & Quản trị', 'Kinh tế học, marketing, tài chính và quản trị doanh nghiệp.', '📊', DATE_SUB(NOW(), INTERVAL 108 DAY)),
('Ngoại ngữ', 'Tài liệu tiếng Anh học thuật, IELTS và kỹ năng giao tiếp.', '🌍', DATE_SUB(NOW(), INTERVAL 101 DAY)),
('Kỹ năng học thuật', 'Phương pháp nghiên cứu, viết báo cáo và kỹ năng tự học.', '🎓', DATE_SUB(NOW(), INTERVAL 96 DAY)),
('Khoa học & Kỹ thuật', 'Toán học, vật lý và các ngành khoa học kỹ thuật nền tảng.', '🔬', DATE_SUB(NOW(), INTERVAL 88 DAY));

DROP TEMPORARY TABLE IF EXISTS demo_documents;
CREATE TEMPORARY TABLE demo_documents (
    title VARCHAR(250) PRIMARY KEY,
    author VARCHAR(500),
    description TEXT,
    file_url VARCHAR(255),
    cover_url VARCHAR(255),
    file_size BIGINT,
    view_count INT,
    download_count INT,
    category_name VARCHAR(150),
    days_ago INT
);

INSERT INTO demo_documents VALUES
('Giáo trình Lập trình Python từ cơ bản đến nâng cao', 'Nguyễn Hà Nam',
 'Giáo trình thực hành Python qua 12 chương, từ cú pháp nền tảng đến lập trình hướng đối tượng và xây dựng API.',
 'https://docs.python.org/3/tutorial/',
 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=600&q=80',
 6842100, 1248, 386, 'Công nghệ thông tin', 74),
('Clean Code - Cẩm nang viết mã dễ bảo trì', 'Robert C. Martin',
 'Tài liệu nhập môn về quy tắc đặt tên, tổ chức hàm, kiểm thử và tái cấu trúc mã nguồn trong dự án thực tế.',
 'https://github.com/ryanmcdermott/clean-code-javascript',
 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
 4938700, 986, 312, 'Công nghệ thông tin', 62),
('Cấu trúc dữ liệu và giải thuật thực hành', 'Lê Minh Hoàng',
 'Tổng hợp cấu trúc dữ liệu cốt lõi, kỹ thuật phân tích độ phức tạp và hơn 80 bài tập có hướng dẫn.',
 'https://cp-algorithms.com/',
 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
 8124000, 1534, 477, 'Công nghệ thông tin', 57),
('Attention Is All You Need', 'Ashish Vaswani và cộng sự',
 'Bài báo nền tảng giới thiệu kiến trúc Transformer, cơ chế self-attention và kết quả thực nghiệm trên dịch máy.',
 'https://arxiv.org/pdf/1706.03762.pdf',
 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=80',
 2201300, 2315, 804, 'AI & Khoa học dữ liệu', 52),
('Nhập môn Machine Learning với Scikit-learn', 'Nguyễn Thanh Tùng',
 'Hướng dẫn xây dựng pipeline dữ liệu, huấn luyện, đánh giá và triển khai các mô hình Machine Learning phổ biến.',
 'https://scikit-learn.org/stable/user_guide.html',
 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=600&q=80',
 7568200, 1872, 621, 'AI & Khoa học dữ liệu', 46),
('Deep Learning Foundations', 'Ian Goodfellow, Yoshua Bengio và Aaron Courville',
 'Nền tảng toán học, mạng neural, tối ưu hóa và các kiến trúc học sâu hiện đại dành cho người mới bắt đầu.',
 'https://www.deeplearningbook.org/',
 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80',
 12480600, 1657, 533, 'AI & Khoa học dữ liệu', 41),
('Kinh tế học vi mô ứng dụng', 'Robert Pindyck và Daniel Rubinfeld',
 'Các nguyên lý cung cầu, hành vi người tiêu dùng, cấu trúc thị trường và tình huống ứng dụng tại doanh nghiệp.',
 'https://openstax.org/details/books/principles-microeconomics-3e',
 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
 9483100, 743, 195, 'Kinh tế & Quản trị', 39),
('Quản trị dự án hiện đại theo Agile', 'PMI Vietnam',
 'Tài liệu thực hành lập kế hoạch, quản trị rủi ro, Scrum, Kanban và đo lường hiệu quả nhóm dự án.',
 'https://www.scrumguides.org/scrum-guide.html',
 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=600&q=80',
 5142900, 892, 267, 'Kinh tế & Quản trị', 32),
('English for Academic Purposes', 'Cambridge Learning Team',
 'Rèn luyện từ vựng, đọc hiểu, thuyết trình và kỹ năng viết trong môi trường đại học bằng bài tập theo chủ đề.',
 'https://www.cambridgeenglish.org/learning-english/',
 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80',
 6217800, 1195, 348, 'Ngoại ngữ', 29),
('IELTS Academic Writing Handbook', 'British Council',
 'Chiến lược phân tích đề, xây dựng luận điểm và bộ bài mẫu cho Writing Task 1 và Task 2.',
 'https://takeielts.britishcouncil.org/take-ielts/prepare',
 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80',
 4387600, 1386, 429, 'Ngoại ngữ', 24),
('Phương pháp nghiên cứu khoa học', 'Vũ Cao Đàm',
 'Hướng dẫn xác định câu hỏi nghiên cứu, thiết kế phương pháp, phân tích dữ liệu và trình bày báo cáo khoa học.',
 'https://open.umn.edu/opentextbooks/textbooks/research-methods-in-psychology',
 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=600&q=80',
 7031500, 1014, 289, 'Kỹ năng học thuật', 18),
('Vật lý đại cương: Cơ học và Nhiệt học', 'Halliday, Resnick và Walker',
 'Giáo trình nền tảng về động học, định luật Newton, năng lượng, dao động và nhiệt động lực học.',
 'https://openstax.org/details/books/university-physics-volume-1',
 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80',
 11236500, 674, 178, 'Khoa học & Kỹ thuật', 12);

INSERT INTO documents
    (title, author, description, file_url, cover_url, file_type, file_size,
     view_count, download_count, approved, created_at, category_id, uploaded_by)
SELECT d.title, d.author, d.description, d.file_url, d.cover_url, 'application/pdf', d.file_size,
       d.view_count, d.download_count, b'1', DATE_SUB(NOW(), INTERVAL d.days_ago DAY),
       c.id, @admin_id
FROM demo_documents d
JOIN categories c ON c.name = d.category_name
WHERE NOT EXISTS (SELECT 1 FROM documents x WHERE x.title = d.title);

DROP TEMPORARY TABLE IF EXISTS demo_ratings;
CREATE TEMPORARY TABLE demo_ratings (username VARCHAR(100), document_title VARCHAR(250), rating INT);
INSERT INTO demo_ratings VALUES
('user_demo', 'Attention Is All You Need', 5),
('user_demo', 'Giáo trình Lập trình Python từ cơ bản đến nâng cao', 5),
('user_demo', 'Cấu trúc dữ liệu và giải thuật thực hành', 4),
('user_demo', 'Phương pháp nghiên cứu khoa học', 4),
('lan_anh', 'IELTS Academic Writing Handbook', 5),
('lan_anh', 'English for Academic Purposes', 5),
('quoc_bao', 'Deep Learning Foundations', 5),
('quoc_bao', 'Nhập môn Machine Learning với Scikit-learn', 5),
('thu_ha', 'Quản trị dự án hiện đại theo Agile', 4),
('thu_ha', 'Kinh tế học vi mô ứng dụng', 4),
('minh_khoa', 'Clean Code - Cẩm nang viết mã dễ bảo trì', 5),
('minh_khoa', 'Cấu trúc dữ liệu và giải thuật thực hành', 5),
('admin_demo', 'Vật lý đại cương: Cơ học và Nhiệt học', 4);

INSERT IGNORE INTO document_ratings (rating, created_at, updated_at, document_id, user_id)
SELECT r.rating, DATE_SUB(NOW(), INTERVAL 5 DAY), NOW(), d.id, u.id
FROM demo_ratings r
JOIN documents d ON d.title = r.document_title
JOIN users u ON u.username = r.username;

INSERT IGNORE INTO document_favorites (created_at, document_id, user_id)
SELECT DATE_SUB(NOW(), INTERVAL 3 DAY), d.id, @user_id
FROM documents d
WHERE d.title IN (
    'Attention Is All You Need',
    'Giáo trình Lập trình Python từ cơ bản đến nâng cao',
    'Phương pháp nghiên cứu khoa học',
    'Clean Code - Cẩm nang viết mã dễ bảo trì'
);

DROP TEMPORARY TABLE IF EXISTS demo_document_comments;
CREATE TEMPORARY TABLE demo_document_comments (
    document_title VARCHAR(250), username VARCHAR(100), content TEXT, days_ago INT
);
INSERT INTO demo_document_comments VALUES
('Giáo trình Lập trình Python từ cơ bản đến nâng cao', 'minh_khoa', 'Ví dụ dễ hiểu và có lộ trình rất rõ. Phần OOP đặc biệt hữu ích cho người mới.', 18),
('Giáo trình Lập trình Python từ cơ bản đến nâng cao', 'user_demo', 'Mình đã học hết 6 chương đầu, bài tập thực hành khá sát với dự án thực tế.', 11),
('Attention Is All You Need', 'quoc_bao', 'Bản dịch thuật ngữ tốt, sơ đồ kiến trúc giúp mình hiểu self-attention nhanh hơn.', 9),
('Attention Is All You Need', 'user_demo', 'Nên đọc kèm phần minh họa multi-head attention trong tài liệu Deep Learning Foundations.', 6),
('IELTS Academic Writing Handbook', 'lan_anh', 'Bộ khung Task 2 rất thực tế, không bị máy móc như nhiều tài liệu luyện thi khác.', 8),
('Quản trị dự án hiện đại theo Agile', 'thu_ha', 'Phần retrospective có checklist áp dụng được ngay cho nhóm đồ án.', 5),
('Phương pháp nghiên cứu khoa học', 'quoc_bao', 'Chương xây dựng câu hỏi nghiên cứu trình bày súc tích và có ví dụ tốt.', 3),
('Clean Code - Cẩm nang viết mã dễ bảo trì', 'minh_khoa', 'Tài liệu nên đọc trước khi tham gia dự án nhóm hoặc đi thực tập.', 2);

INSERT INTO document_comments (content, created_at, document_id, user_id)
SELECT c.content, DATE_SUB(NOW(), INTERVAL c.days_ago DAY), d.id, u.id
FROM demo_document_comments c
JOIN documents d ON d.title = c.document_title
JOIN users u ON u.username = c.username
WHERE NOT EXISTS (
    SELECT 1 FROM document_comments x
    WHERE x.document_id = d.id AND x.user_id = u.id AND x.content = c.content
);

INSERT IGNORE INTO forum_categories (name, description, color, created_at) VALUES
('Lập trình & Công nghệ', 'Trao đổi về lập trình, công nghệ và nghề nghiệp kỹ thuật.', '#2563EB', DATE_SUB(NOW(), INTERVAL 100 DAY)),
('Hỏi đáp môn học', 'Đặt câu hỏi và cùng giải đáp các chủ đề đang học.', '#7C3AED', DATE_SUB(NOW(), INTERVAL 98 DAY)),
('Chia sẻ tài liệu', 'Giới thiệu sách, giáo trình và nguồn học tập chất lượng.', '#059669', DATE_SUB(NOW(), INTERVAL 94 DAY)),
('Ngoại ngữ', 'Kinh nghiệm học ngoại ngữ và luyện thi chứng chỉ.', '#EA580C', DATE_SUB(NOW(), INTERVAL 91 DAY)),
('Nghiên cứu học thuật', 'Phương pháp nghiên cứu, đọc paper và viết học thuật.', '#DC2626', DATE_SUB(NOW(), INTERVAL 87 DAY));

DROP TEMPORARY TABLE IF EXISTS demo_forum_posts;
CREATE TEMPORARY TABLE demo_forum_posts (
    title VARCHAR(250) PRIMARY KEY,
    content TEXT,
    category_name VARCHAR(150),
    username VARCHAR(100),
    view_count INT,
    like_count INT,
    days_ago INT
);
INSERT INTO demo_forum_posts VALUES
('Lộ trình học Spring Boot cho người đã biết Java cơ bản',
 'Mình đang xây dựng lộ trình 8 tuần gồm Spring Core, REST API, JPA, Security và Docker. Mọi người có thể góp ý thứ tự học và dự án thực hành phù hợp không?',
 'Lập trình & Công nghệ', 'minh_khoa', 426, 18, 21),
('Chia sẻ bộ tài liệu ôn IELTS từ 6.0 lên 7.0',
 'Mình tổng hợp các nguồn luyện Reading, Listening và Writing đã dùng trong 4 tháng. Quan trọng nhất vẫn là ghi lại lỗi sai và ôn theo tuần.',
 'Ngoại ngữ', 'lan_anh', 518, 26, 18),
('Làm sao chọn đề tài nghiên cứu vừa sức cho sinh viên?',
 'Nhóm mình quan tâm đến hành vi học tập trên nền tảng số nhưng phạm vi còn rộng. Mong mọi người chia sẻ cách thu hẹp câu hỏi nghiên cứu.',
 'Nghiên cứu học thuật', 'thu_ha', 287, 12, 15),
('Kinh nghiệm đọc paper AI mà không bị ngợp',
 'Mình thường đọc abstract, hình vẽ và conclusion trước, sau đó mới quay lại methodology. Cách này giúp xác định paper có thực sự liên quan hay không.',
 'Nghiên cứu học thuật', 'quoc_bao', 673, 34, 12),
('Tìm bạn học nhóm Cấu trúc dữ liệu tối thứ Ba và thứ Năm',
 'Mục tiêu của nhóm là giải 3 bài mỗi buổi, review lời giải và ghi lại pattern. Hiện nhóm cần thêm 2 thành viên học đều.',
 'Hỏi đáp môn học', 'user_demo', 214, 9, 10),
('Review Clean Code sau khi áp dụng vào đồ án nhóm',
 'Sau hai sprint, nhóm mình giảm đáng kể thời gian review nhờ thống nhất quy tắc đặt tên và chia nhỏ hàm. Một số nguyên tắc cần áp dụng linh hoạt.',
 'Chia sẻ tài liệu', 'minh_khoa', 356, 17, 8),
('Phương pháp ghi chú Cornell có phù hợp với môn kỹ thuật?',
 'Mình thử Cornell cho môn Cơ sở dữ liệu và thấy phần câu hỏi ôn tập khá hiệu quả. Với code thì kết hợp thêm repo ví dụ sẽ dễ nhớ hơn.',
 'Hỏi đáp môn học', 'thu_ha', 193, 8, 6),
('Thảo luận: AI tạo sinh thay đổi cách tự học như thế nào?',
 'AI giúp giải thích nhanh nhưng cũng dễ khiến người học bỏ qua tư duy nền tảng. Theo mọi người nên dùng AI ở bước nào trong quy trình tự học?',
 'Lập trình & Công nghệ', 'admin_demo', 891, 41, 3);

INSERT INTO forum_posts
    (title, content, view_count, like_count, created_at, updated_at, category_id, user_id)
SELECT p.title, p.content, p.view_count, p.like_count,
       DATE_SUB(NOW(), INTERVAL p.days_ago DAY), DATE_SUB(NOW(), INTERVAL p.days_ago DAY),
       c.id, u.id
FROM demo_forum_posts p
JOIN forum_categories c ON c.name = p.category_name
JOIN users u ON u.username = p.username
WHERE NOT EXISTS (SELECT 1 FROM forum_posts x WHERE x.title = p.title);

DROP TEMPORARY TABLE IF EXISTS demo_forum_comments;
CREATE TEMPORARY TABLE demo_forum_comments (
    post_title VARCHAR(250), username VARCHAR(100), content TEXT, like_count INT, days_ago INT
);
INSERT INTO demo_forum_comments VALUES
('Lộ trình học Spring Boot cho người đã biết Java cơ bản', 'user_demo', 'Mình đề xuất thêm một tuần riêng cho validation và xử lý exception vì phần này dùng rất nhiều trong dự án.', 6, 20),
('Lộ trình học Spring Boot cho người đã biết Java cơ bản', 'quoc_bao', 'Sau JPA nên làm ngay một mini project để hiểu transaction và quan hệ entity.', 4, 19),
('Chia sẻ bộ tài liệu ôn IELTS từ 6.0 lên 7.0', 'thu_ha', 'Bạn có thể chia sẻ thêm cách tự chấm Writing Task 2 không? Đây là phần mình đang vướng nhất.', 3, 17),
('Chia sẻ bộ tài liệu ôn IELTS từ 6.0 lên 7.0', 'lan_anh', 'Mình dùng checklist theo bốn tiêu chí của IELTS và mỗi tuần nhờ bạn học review chéo một bài.', 5, 16),
('Làm sao chọn đề tài nghiên cứu vừa sức cho sinh viên?', 'quoc_bao', 'Hãy bắt đầu từ một nhóm người dùng cụ thể và một hành vi đo lường được trong khoảng thời gian rõ ràng.', 7, 14),
('Kinh nghiệm đọc paper AI mà không bị ngợp', 'user_demo', 'Cách đọc theo ba lượt rất hiệu quả. Mình còn dùng Zotero để gắn tag theo chủ đề.', 8, 11),
('Kinh nghiệm đọc paper AI mà không bị ngợp', 'admin_demo', 'Nên ghi lại câu hỏi mà paper chưa giải quyết; đó thường là đầu mối tốt cho đề tài tiếp theo.', 9, 10),
('Tìm bạn học nhóm Cấu trúc dữ liệu tối thứ Ba và thứ Năm', 'minh_khoa', 'Mình tham gia nhé. Hiện mình đang ôn graph và dynamic programming.', 2, 9),
('Review Clean Code sau khi áp dụng vào đồ án nhóm', 'user_demo', 'Điểm mình thích nhất là cả nhóm có cùng ngôn ngữ khi review code.', 4, 7),
('Phương pháp ghi chú Cornell có phù hợp với môn kỹ thuật?', 'lan_anh', 'Mình dùng phần cue để ghi câu hỏi phỏng vấn hoặc câu hỏi ôn thi, khá hiệu quả.', 3, 5),
('Thảo luận: AI tạo sinh thay đổi cách tự học như thế nào?', 'quoc_bao', 'Theo mình nên tự giải trước, sau đó dùng AI để phản biện và gợi ý những góc nhìn còn thiếu.', 11, 2),
('Thảo luận: AI tạo sinh thay đổi cách tự học như thế nào?', 'user_demo', 'Mình thường yêu cầu AI đặt câu hỏi ngược lại thay vì đưa đáp án ngay.', 8, 1);

INSERT INTO forum_comments (content, created_at, like_count, post_id, user_id, parent_id)
SELECT c.content, DATE_SUB(NOW(), INTERVAL c.days_ago DAY), c.like_count, p.id, u.id, NULL
FROM demo_forum_comments c
JOIN forum_posts p ON p.title = c.post_title
JOIN users u ON u.username = c.username
WHERE NOT EXISTS (
    SELECT 1 FROM forum_comments x
    WHERE x.post_id = p.id AND x.user_id = u.id AND x.content = c.content
);

DROP TEMPORARY TABLE IF EXISTS demo_post_likes;
CREATE TEMPORARY TABLE demo_post_likes (post_title VARCHAR(250), username VARCHAR(100));
INSERT INTO demo_post_likes VALUES
('Lộ trình học Spring Boot cho người đã biết Java cơ bản', 'user_demo'),
('Lộ trình học Spring Boot cho người đã biết Java cơ bản', 'quoc_bao'),
('Chia sẻ bộ tài liệu ôn IELTS từ 6.0 lên 7.0', 'user_demo'),
('Chia sẻ bộ tài liệu ôn IELTS từ 6.0 lên 7.0', 'thu_ha'),
('Kinh nghiệm đọc paper AI mà không bị ngợp', 'user_demo'),
('Kinh nghiệm đọc paper AI mà không bị ngợp', 'admin_demo'),
('Review Clean Code sau khi áp dụng vào đồ án nhóm', 'user_demo'),
('Thảo luận: AI tạo sinh thay đổi cách tự học như thế nào?', 'user_demo'),
('Thảo luận: AI tạo sinh thay đổi cách tự học như thế nào?', 'quoc_bao');

INSERT IGNORE INTO forum_post_likes (created_at, post_id, user_id)
SELECT DATE_SUB(NOW(), INTERVAL 1 DAY), p.id, u.id
FROM demo_post_likes l
JOIN forum_posts p ON p.title = l.post_title
JOIN users u ON u.username = l.username;

INSERT INTO forum_reports
    (admin_note, created_at, description, post_content_preview, post_id, post_title,
     reason, reporter_id, reporter_username, resolved_at, resolved_by, status)
SELECT NULL, DATE_SUB(NOW(), INTERVAL 1 DAY),
       'Một vài số liệu trong bài viết cần bổ sung nguồn tham khảo để tránh gây hiểu nhầm.',
       LEFT(p.content, 500), p.id, p.title, 'Thông tin cần kiểm chứng',
       @user_id, 'user_demo', NULL, NULL, 'PENDING'
FROM forum_posts p
WHERE p.title = 'Thảo luận: AI tạo sinh thay đổi cách tự học như thế nào?'
  AND NOT EXISTS (
      SELECT 1 FROM forum_reports r
      WHERE r.post_id = p.id AND r.reporter_id = @user_id AND r.reason = 'Thông tin cần kiểm chứng'
  );

DROP TEMPORARY TABLE IF EXISTS demo_groups;
CREATE TEMPORARY TABLE demo_groups (
    name VARCHAR(200) PRIMARY KEY,
    description TEXT,
    subject VARCHAR(255),
    visibility VARCHAR(20),
    creator_username VARCHAR(100),
    days_ago INT
);
INSERT INTO demo_groups VALUES
('Spring Boot Study Lab', 'Học Spring Boot theo lộ trình, review code và xây dựng một REST API hoàn chỉnh.', 'Backend Development', 'PUBLIC', 'minh_khoa', 38),
('IELTS 7.0 Together', 'Luyện đề theo tuần, chữa Writing chéo và duy trì speaking session cuối tuần.', 'English / IELTS', 'PUBLIC', 'lan_anh', 34),
('AI Paper Reading Club', 'Mỗi tuần chọn một paper AI để trình bày, phản biện và ghi chú chung.', 'Artificial Intelligence', 'PRIVATE', 'quoc_bao', 29),
('Ôn thi Cấu trúc dữ liệu', 'Giải bài tập theo chủ đề và tổng hợp pattern trước kỳ thi cuối kỳ.', 'Data Structures & Algorithms', 'PUBLIC', 'user_demo', 17),
('Nghiên cứu khoa học 2026', 'Nhóm trao đổi đề cương, phương pháp khảo sát và tiến độ nghiên cứu sinh viên.', 'Research Methodology', 'PRIVATE', 'thu_ha', 12);

INSERT INTO study_groups (name, description, subject, visibility, member_count, created_at, created_by)
SELECT g.name, g.description, g.subject, g.visibility, 1,
       DATE_SUB(NOW(), INTERVAL g.days_ago DAY), u.id
FROM demo_groups g
JOIN users u ON u.username = g.creator_username
WHERE NOT EXISTS (SELECT 1 FROM study_groups x WHERE x.name = g.name);

DROP TEMPORARY TABLE IF EXISTS demo_group_members;
CREATE TEMPORARY TABLE demo_group_members (
    group_name VARCHAR(200), username VARCHAR(100), status VARCHAR(20), days_ago INT
);
INSERT INTO demo_group_members VALUES
('Spring Boot Study Lab', 'minh_khoa', 'APPROVED', 38),
('Spring Boot Study Lab', 'user_demo', 'APPROVED', 32),
('Spring Boot Study Lab', 'quoc_bao', 'APPROVED', 27),
('Spring Boot Study Lab', 'admin_demo', 'APPROVED', 15),
('IELTS 7.0 Together', 'lan_anh', 'APPROVED', 34),
('IELTS 7.0 Together', 'thu_ha', 'APPROVED', 30),
('IELTS 7.0 Together', 'user_demo', 'APPROVED', 22),
('AI Paper Reading Club', 'quoc_bao', 'APPROVED', 29),
('AI Paper Reading Club', 'user_demo', 'APPROVED', 24),
('AI Paper Reading Club', 'minh_khoa', 'APPROVED', 19),
('AI Paper Reading Club', 'thu_ha', 'PENDING', 2),
('Ôn thi Cấu trúc dữ liệu', 'user_demo', 'APPROVED', 17),
('Ôn thi Cấu trúc dữ liệu', 'minh_khoa', 'APPROVED', 15),
('Ôn thi Cấu trúc dữ liệu', 'quoc_bao', 'APPROVED', 11),
('Ôn thi Cấu trúc dữ liệu', 'lan_anh', 'APPROVED', 5),
('Nghiên cứu khoa học 2026', 'thu_ha', 'APPROVED', 12),
('Nghiên cứu khoa học 2026', 'quoc_bao', 'APPROVED', 9),
('Nghiên cứu khoa học 2026', 'user_demo', 'PENDING', 1);

INSERT IGNORE INTO group_members (joined_at, status, group_id, user_id)
SELECT DATE_SUB(NOW(), INTERVAL m.days_ago DAY), m.status, g.id, u.id
FROM demo_group_members m
JOIN study_groups g ON g.name = m.group_name
JOIN users u ON u.username = m.username;

UPDATE study_groups g
SET g.member_count = (
    SELECT COUNT(*) FROM group_members gm
    WHERE gm.group_id = g.id AND gm.status = 'APPROVED'
)
WHERE g.name IN (SELECT name FROM demo_groups);

DROP TEMPORARY TABLE IF EXISTS demo_group_chats;
CREATE TEMPORARY TABLE demo_group_chats (
    group_name VARCHAR(200), username VARCHAR(100), channel_name VARCHAR(255), content TEXT, hours_ago INT
);
INSERT INTO demo_group_chats VALUES
('Spring Boot Study Lab', 'minh_khoa', 'general', 'Chào mọi người, tuần này chúng ta hoàn thiện phần Security và JWT nhé.', 72),
('Spring Boot Study Lab', 'user_demo', 'general', 'Mình đã push ví dụ refresh token và ghi chú luồng xác thực vào tài liệu chung.', 66),
('Spring Boot Study Lab', 'quoc_bao', 'general', 'Tối mai mình có thể review phần phân quyền theo role.', 44),
('IELTS 7.0 Together', 'lan_anh', 'general', 'Writing tuần này là chủ đề technology in education, hạn nộp tối thứ Sáu.', 58),
('IELTS 7.0 Together', 'thu_ha', 'general', 'Mình đã gửi bài Task 2, nhờ mọi người góp ý phần coherence.', 31),
('AI Paper Reading Club', 'quoc_bao', 'general', 'Paper tuần này là Attention Is All You Need. Mỗi người chọn một phần để trình bày nhé.', 51),
('AI Paper Reading Club', 'user_demo', 'general', 'Mình nhận phần positional encoding và multi-head attention.', 47),
('Ôn thi Cấu trúc dữ liệu', 'user_demo', 'general', 'Buổi tối nay giải BFS, DFS và hai bài shortest path.', 28),
('Ôn thi Cấu trúc dữ liệu', 'minh_khoa', 'general', 'Mình đã chuẩn bị bộ test để mọi người kiểm tra độ phức tạp.', 21),
('Nghiên cứu khoa học 2026', 'thu_ha', 'general', 'Mọi người cập nhật đề cương trước buổi họp thứ Bảy nhé.', 19);

INSERT INTO group_chats
    (content, channel, created_at, group_id, user_id,
     attachment_name, attachment_url, attachment_type, attachment_mime_type, attachment_size)
SELECT c.content, c.channel_name, DATE_SUB(NOW(), INTERVAL c.hours_ago HOUR), g.id, u.id,
       NULL, NULL, NULL, NULL, NULL
FROM demo_group_chats c
JOIN study_groups g ON g.name = c.group_name
JOIN users u ON u.username = c.username
WHERE NOT EXISTS (
    SELECT 1 FROM group_chats x
    WHERE x.group_id = g.id AND x.user_id = u.id AND x.content = c.content
);

DROP TEMPORARY TABLE IF EXISTS demo_notifications;
CREATE TEMPORARY TABLE demo_notifications (
    username VARCHAR(100), title VARCHAR(200), message TEXT, type_name VARCHAR(30), is_read BIT, days_ago INT
);
INSERT INTO demo_notifications VALUES
('user_demo', 'Chào mừng bạn đến với LIBRIA', 'Khám phá hơn 12 tài liệu nổi bật và các nhóm học tập đang hoạt động.', 'SYSTEM', b'0', 1),
('user_demo', 'Tài liệu mới trong danh mục AI', 'Attention Is All You Need vừa được thêm vào thư viện của bạn.', 'SUCCESS', b'0', 2),
('user_demo', 'Yêu cầu tham gia đang chờ duyệt', 'Yêu cầu tham gia nhóm Nghiên cứu khoa học 2026 đã được gửi đến trưởng nhóm.', 'WARNING', b'0', 1),
('user_demo', 'Có phản hồi mới trong diễn đàn', 'Bài viết về nhóm Cấu trúc dữ liệu vừa nhận được phản hồi mới.', 'INFO', b'1', 4),
('admin_demo', 'Báo cáo diễn đàn mới', 'Có một nội dung được báo cáo và đang chờ kiểm duyệt.', 'WARNING', b'0', 1),
('admin_demo', 'Thống kê tuần đã sẵn sàng', 'Hệ thống đã tổng hợp lượt xem, tải tài liệu và hoạt động cộng đồng trong tuần.', 'SYSTEM', b'0', 2),
('admin_demo', 'Dữ liệu thư viện đã được cập nhật', '12 tài liệu thuộc 6 danh mục hiện đã sẵn sàng phục vụ người dùng.', 'SUCCESS', b'1', 3);

INSERT INTO notifications (title, message, type, read_status, created_at, user_id)
SELECT n.title, n.message, n.type_name, n.is_read,
       DATE_SUB(NOW(), INTERVAL n.days_ago DAY), u.id
FROM demo_notifications n
JOIN users u ON u.username = n.username
WHERE NOT EXISTS (
    SELECT 1 FROM notifications x WHERE x.user_id = u.id AND x.title = n.title
);

INSERT INTO ai_conversations (title, created_at, updated_at, user_id)
SELECT 'Tóm tắt Attention Is All You Need', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY), @user_id
WHERE NOT EXISTS (
    SELECT 1 FROM ai_conversations c
    WHERE c.user_id = @user_id AND c.title = 'Tóm tắt Attention Is All You Need'
);

INSERT INTO ai_conversations (title, created_at, updated_at, user_id)
SELECT 'Lộ trình học Machine Learning', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), @user_id
WHERE NOT EXISTS (
    SELECT 1 FROM ai_conversations c
    WHERE c.user_id = @user_id AND c.title = 'Lộ trình học Machine Learning'
);

SET @conv_attention := (
    SELECT id FROM ai_conversations
    WHERE user_id = @user_id AND title = 'Tóm tắt Attention Is All You Need' LIMIT 1
);
SET @conv_ml := (
    SELECT id FROM ai_conversations
    WHERE user_id = @user_id AND title = 'Lộ trình học Machine Learning' LIMIT 1
);

INSERT INTO ai_messages (content, created_at, role, conversation_id)
SELECT 'Hãy tóm tắt đóng góp chính của bài Attention Is All You Need.', DATE_SUB(NOW(), INTERVAL 6 DAY), 'USER', @conv_attention
WHERE NOT EXISTS (
    SELECT 1 FROM ai_messages m WHERE m.conversation_id = @conv_attention AND m.role = 'USER'
);
INSERT INTO ai_messages (content, created_at, role, conversation_id)
SELECT 'Bài báo giới thiệu Transformer, một kiến trúc chỉ dùng cơ chế attention thay cho recurrence và convolution. Multi-head self-attention giúp mô hình học nhiều quan hệ giữa các token song song, còn positional encoding bổ sung thông tin thứ tự. Kiến trúc đạt chất lượng dịch máy cao hơn với thời gian huấn luyện ngắn hơn.', DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 1 MINUTE, 'AI', @conv_attention
WHERE NOT EXISTS (
    SELECT 1 FROM ai_messages m WHERE m.conversation_id = @conv_attention AND m.role = 'AI'
);
INSERT INTO ai_messages (content, created_at, role, conversation_id)
SELECT 'Mình đã biết Python cơ bản. Hãy đề xuất lộ trình học Machine Learning trong 8 tuần.', DATE_SUB(NOW(), INTERVAL 3 DAY), 'USER', @conv_ml
WHERE NOT EXISTS (
    SELECT 1 FROM ai_messages m WHERE m.conversation_id = @conv_ml AND m.role = 'USER'
);
INSERT INTO ai_messages (content, created_at, role, conversation_id)
SELECT 'Tuần 1-2 ôn NumPy, Pandas và trực quan hóa; tuần 3 học hồi quy và phân loại; tuần 4 đánh giá mô hình; tuần 5 cây quyết định và ensemble; tuần 6 clustering; tuần 7 xây pipeline Scikit-learn; tuần 8 hoàn thành một dự án dữ liệu thực tế và viết báo cáo.', DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 1 MINUTE, 'AI', @conv_ml
WHERE NOT EXISTS (
    SELECT 1 FROM ai_messages m WHERE m.conversation_id = @conv_ml AND m.role = 'AI'
);

UPDATE news SET view_count = GREATEST(COALESCE(view_count, 0), 1842) WHERE id = 1;
UPDATE news SET view_count = GREATEST(COALESCE(view_count, 0), 1267) WHERE id = 2;
UPDATE news SET view_count = GREATEST(COALESCE(view_count, 0), 934) WHERE id = 3;
UPDATE news SET view_count = GREATEST(COALESCE(view_count, 0), 2156) WHERE id = 4;
UPDATE news SET view_count = GREATEST(COALESCE(view_count, 0), 1673) WHERE id = 5;
UPDATE news SET view_count = GREATEST(COALESCE(view_count, 0), 788) WHERE id = 6;
UPDATE news SET view_count = GREATEST(COALESCE(view_count, 0), 542) WHERE id = 7;
-- Demo data for document_copyrights and document_borrows
INSERT IGNORE INTO document_copyrights (document_id, copyright_owner, author, license_type, certificate_number, registration_date, terms, created_at, updated_at)
SELECT d.id, 'Nhà xuất bản Đại học Quốc gia', d.author, d.license_type, CONCAT('VN-COPYRIGHT-', LPAD(d.id, 4, '0')), DATE_SUB(NOW(), INTERVAL 60 DAY),
       'Bản quyền thuộc tác giả và đơn vị xuất bản. Được phép sử dụng phục vụ mục đích học tập và nghiên cứu.', NOW(), NOW()
FROM documents d;

INSERT IGNORE INTO document_borrows (user_id, document_id, borrow_date, due_date, return_date, status, note, created_at, updated_at)
SELECT u.id, d.id, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL 9 DAY), NULL, 'BORROWED', 'Mượn tài liệu nghiên cứu chuyên ngành', DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()
FROM users u
JOIN documents d ON d.id = 1
WHERE u.username = 'user_demo';

INSERT IGNORE INTO document_borrows (user_id, document_id, borrow_date, due_date, return_date, status, note, created_at, updated_at)
SELECT u.id, d.id, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY), 'RETURNED', 'Đã trả đúng hạn, sách còn nguyên vẹn', DATE_SUB(NOW(), INTERVAL 20 DAY), NOW()
FROM users u
JOIN documents d ON d.id = 2
WHERE u.username = 'lan_anh';

UPDATE documents SET total_copies = 10, available_copies = 8 WHERE id = 1;
UPDATE documents SET total_copies = 5, available_copies = 5 WHERE id = 2;
UPDATE documents SET total_copies = 15, available_copies = 12 WHERE id > 2;

DROP TEMPORARY TABLE IF EXISTS demo_documents;
DROP TEMPORARY TABLE IF EXISTS demo_ratings;
DROP TEMPORARY TABLE IF EXISTS demo_document_comments;
DROP TEMPORARY TABLE IF EXISTS demo_forum_posts;
DROP TEMPORARY TABLE IF EXISTS demo_forum_comments;
DROP TEMPORARY TABLE IF EXISTS demo_post_likes;
DROP TEMPORARY TABLE IF EXISTS demo_groups;
DROP TEMPORARY TABLE IF EXISTS demo_group_members;
DROP TEMPORARY TABLE IF EXISTS demo_group_chats;
DROP TEMPORARY TABLE IF EXISTS demo_notifications;

COMMIT;
