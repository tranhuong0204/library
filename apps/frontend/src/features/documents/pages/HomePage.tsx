import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Quote,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/app/providers';
import { apiClient } from '@/lib/api/client';
import { normalizeDocument, normalizeNews } from '@/lib/normalizers';
import { formatDate } from '@/lib/formatters';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: newsList = [], isLoading: isNewsLoading } = useQuery({
    queryKey: ['news', 'published'],
    queryFn: async () => {
      const response = await apiClient.get('/news');
      return (Array.isArray(response.data) ? response.data : []).map(normalizeNews);
    },
  });

  const { data: documents = [], isLoading: isDocsLoading } = useQuery({
    queryKey: ['documents', 'popular'],
    queryFn: async () => {
      const response = await apiClient.get('/documents');
      return (Array.isArray(response.data) ? response.data : []).map(normalizeDocument);
    },
  });

  const latestNews = newsList.slice(0, 4);
  const popularDocs = [...documents]
    .sort((a, b) => (b.viewCount + b.downloadCount) - (a.viewCount + a.downloadCount))
    .slice(0, 4);

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Chào buổi sáng';
    if (hours < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const shortcuts = [
    {
      title: 'Thư viện tài liệu',
      description: 'Tìm giáo trình, đề cương và tài liệu chuyên ngành trong một nơi.',
      icon: <BookOpen size={22} />,
      tone: 'blue',
      path: '/library',
    },
    {
      title: 'Trợ lý AI',
      description: 'Hỏi đáp kiến thức và nhận câu trả lời có nguồn trích dẫn rõ ràng.',
      icon: <Sparkles size={22} />,
      tone: 'violet',
      path: '/ai',
    },
  ];

  return (
    <AppShell>
      <div className="home-page page-stack">
        <section className="home-hero" aria-labelledby="home-welcome-title">
          <div className="home-hero-copy">
            <span className="home-hero-kicker"><Sparkles size={14} /> Không gian tri thức số</span>
            <h1 id="home-welcome-title">
              {getGreeting()}, <span>{user?.fullName || 'Học viên'}!</span>
            </h1>
            <p>
              Khám phá tài liệu, nghiên cứu cùng AI và kết nối cộng đồng học tập trong
              một không gian được thiết kế để bạn tập trung tốt hơn.
            </p>
            <div className="home-hero-actions">
              <Button variant="primary" size="lg" onClick={() => navigate('/library')}>
                Khám phá thư viện <ArrowRight size={16} />
              </Button>
              <Button className="home-hero-secondary" variant="outline" size="lg" onClick={() => navigate('/ai')}>
                <Sparkles size={16} /> Trò chuyện với AI
              </Button>
            </div>
            <div className="home-hero-assurances" aria-label="Điểm nổi bật">
              <span><ShieldCheck size={15} /> Dữ liệu được bảo vệ</span>
              <span><Quote size={15} /> Trích dẫn rõ nguồn</span>
            </div>
          </div>

          <div className="home-ai-preview" aria-hidden="true">
            <div className="home-ai-preview-header">
              <span className="home-ai-avatar"><Sparkles size={17} /></span>
              <div><strong>Library AI</strong><small><i /> Sẵn sàng hỗ trợ</small></div>
            </div>
            <div className="home-ai-question">Tóm tắt các ý chính của tài liệu này giúp tôi.</div>
            <div className="home-ai-answer">
              <span className="home-ai-answer-icon"><Sparkles size={14} /></span>
              <div>
                <span className="home-ai-line is-long" />
                <span className="home-ai-line" />
                <span className="home-ai-line is-short" />
              </div>
            </div>
            <div className="home-ai-sources">
              <span><FileText size={13} /> 3 nguồn tham khảo</span>
              <span><CheckCircle2 size={13} /> Đã kiểm chứng</span>
            </div>
          </div>
        </section>

        <section aria-labelledby="quick-access-heading">
          <div className="section-heading">
            <div>
              <span>Bắt đầu nhanh</span>
              <h2 id="quick-access-heading">Bạn muốn làm gì hôm nay?</h2>
            </div>
          </div>
          <div className="home-shortcut-grid">
            {shortcuts.map((shortcut) => (
              <button
                key={shortcut.title}
                className={`home-shortcut-card tone-${shortcut.tone}`}
                onClick={() => navigate(shortcut.path)}
              >
                <span className="home-shortcut-icon">{shortcut.icon}</span>
                <span className="home-shortcut-copy">
                  <strong>{shortcut.title}</strong>
                  <small>{shortcut.description}</small>
                </span>
                <ArrowRight className="home-shortcut-arrow" size={17} />
              </button>
            ))}
          </div>
        </section>

        <section className="home-insights-grid" aria-label="Nội dung mới nhất">
          <div className="home-panel">
            <div className="home-panel-heading">
              <div>
                <span className="panel-icon"><TrendingUp size={18} /></span>
                <div><small>Được quan tâm</small><h2>Tài liệu phổ biến</h2></div>
              </div>
              <Button variant="text" size="sm" onClick={() => navigate('/library')}>
                Xem thư viện <ArrowRight size={14} />
              </Button>
            </div>

            {isDocsLoading ? (
              <div className="home-list-skeleton" aria-label="Đang tải tài liệu">
                <span /><span /><span />
              </div>
            ) : popularDocs.length === 0 ? (
              <div className="compact-empty-state">
                <FileText size={24} />
                <strong>Chưa có tài liệu</strong>
                <span>Tài liệu mới sẽ xuất hiện tại đây.</span>
              </div>
            ) : (
              <div className="home-document-list">
                {popularDocs.map((doc) => (
                  <button key={doc.id} className="home-document-item" onClick={() => navigate(`/library/${doc.id}`)}>
                    {doc.coverUrl ? (
                      <img src={doc.coverUrl} alt="" />
                    ) : (
                      <span className="home-document-cover"><FileText size={18} /></span>
                    )}
                    <span className="home-document-copy">
                      <strong>{doc.title}</strong>
                      <small>{doc.author || 'Chưa rõ tác giả'} · {doc.categoryName || 'Tài liệu'}</small>
                      <span>
                        <i><Eye size={12} /> {doc.viewCount}</i>
                        <i><Download size={12} /> {doc.downloadCount}</i>
                      </span>
                    </span>
                    <ArrowRight className="home-row-arrow" size={16} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="home-panel">
            <div className="home-panel-heading">
              <div>
                <span className="panel-icon is-violet"><Calendar size={18} /></span>
                <div><small>Cập nhật mới</small><h2>Tin tức & sự kiện</h2></div>
              </div>
              <Button variant="text" size="sm" onClick={() => navigate('/news')}>
                Tất cả <ArrowRight size={14} />
              </Button>
            </div>

            {isNewsLoading ? (
              <div className="home-list-skeleton is-compact" aria-label="Đang tải tin tức">
                <span /><span /><span />
              </div>
            ) : latestNews.length === 0 ? (
              <div className="compact-empty-state">
                <Calendar size={24} />
                <strong>Chưa có bản tin</strong>
                <span>Các thông báo mới sẽ xuất hiện tại đây.</span>
              </div>
            ) : (
              <div className="home-news-list">
                {latestNews.map((news) => (
                  <button key={news.id} className="home-news-item" onClick={() => navigate(`/news/${news.id}`)}>
                    <span>
                      <Badge variant="primary">{news.category || 'Tin tức'}</Badge>
                      <small><Calendar size={12} /> {formatDate(news.createdAt)}</small>
                    </span>
                    <strong>{news.title}</strong>
                    <ArrowRight className="home-row-arrow" size={15} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
