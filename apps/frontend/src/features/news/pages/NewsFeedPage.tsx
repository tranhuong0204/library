import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, Eye, Newspaper, Sparkles } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { normalizeNews } from '@/lib/normalizers';
import { formatDate } from '@/lib/formatters';
import { AppShell } from '@/components/layout/AppShell';
import { EmptyState } from '@/components/feedback/EmptyState';
import type { NewsItem } from '@/types';
import './NewsFeedPage.css';

function NewsMeta({ news }: { news: NewsItem }) {
  return (
    <div className="news-meta">
      <span><Calendar size={14} />{formatDate(news.createdAt)}</span>
      <span><Eye size={14} />{news.viewCount.toLocaleString('vi-VN')} lượt xem</span>
    </div>
  );
}

export default function NewsFeedPage() {
  const navigate = useNavigate();
  const { data: newsList = [], isLoading } = useQuery({
    queryKey: ['news', 'published'],
    queryFn: async () => {
      const response = await apiClient.get('/news');
      return (Array.isArray(response.data) ? response.data : []).map(normalizeNews);
    },
  });

  const featuredNews = newsList.filter((item) => item.featured);
  const leadStory = featuredNews[0] ?? newsList[0];
  const supportingStories = featuredNews.filter((item) => item.id !== leadStory?.id).slice(0, 2);
  const latestNews = newsList.filter((item) => item.id !== leadStory?.id && !supportingStories.some((story) => story.id === item.id));

  const openArticle = (id: number) => navigate(`/news/${id}`);

  return (
    <AppShell>
      <section className="news-page">
        <header className="news-page-header">
          <div>
            <div className="news-eyebrow"><span /> Bản tin LIBRIA</div>
            <h1>Tin tức &amp; sự kiện</h1>
            <p>Cập nhật những câu chuyện, sự kiện và tài nguyên mới nhất từ cộng đồng tri thức LIBRIA.</p>
          </div>
          <div className="news-header-mark" aria-hidden="true"><Newspaper size={27} /></div>
        </header>

        {isLoading ? (
          <div className="news-loading" aria-label="Đang tải tin tức">
            <div className="skeleton-shimmer news-loading-lead" />
            <div className="news-loading-side">
              <div className="skeleton-shimmer" /><div className="skeleton-shimmer" />
            </div>
          </div>
        ) : newsList.length === 0 ? (
          <EmptyState
            title="Chưa có tin tức nào"
            message="Bản tin LIBRIA hiện chưa đăng tải thông báo hay bài viết mới."
            icon={<Newspaper size={48} />}
          />
        ) : (
          <>
            <section className="news-featured" aria-labelledby="featured-heading">
              <div className="news-section-heading">
                <div>
                  <span className="news-section-icon"><Sparkles size={16} /></span>
                  <h2 id="featured-heading">Đáng chú ý</h2>
                </div>
                <span>Chọn lọc bởi ban biên tập</span>
              </div>

              <div className={`news-featured-grid ${supportingStories.length === 0 ? 'is-single' : ''}`}>
                {leadStory && (
                  <button className="news-lead-card" onClick={() => openArticle(leadStory.id)}>
                    <img src={leadStory.thumbnailUrl} alt="" />
                    <span className="news-image-overlay" />
                    <div className="news-lead-content">
                      <span className="news-category is-light">{leadStory.category || 'Tin tức'}</span>
                      <h2>{leadStory.title}</h2>
                      <p>{leadStory.summary}</p>
                      <div className="news-lead-footer">
                        <NewsMeta news={leadStory} />
                        <span className="news-read-more">Đọc bài viết <ArrowRight size={16} /></span>
                      </div>
                    </div>
                  </button>
                )}

                {supportingStories.length > 0 && (
                  <div className="news-supporting-list">
                    {supportingStories.map((news) => (
                      <button className="news-supporting-card" key={news.id} onClick={() => openArticle(news.id)}>
                        <div className="news-supporting-image"><img src={news.thumbnailUrl} alt="" /></div>
                        <div className="news-supporting-content">
                          <span className="news-category">{news.category || 'Tin tức'}</span>
                          <h3>{news.title}</h3>
                          <p>{news.summary}</p>
                          <NewsMeta news={news} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {latestNews.length > 0 && (
              <section className="news-latest" aria-labelledby="latest-heading">
                <div className="news-section-heading">
                  <div><h2 id="latest-heading">Mới nhất</h2></div>
                  <span>{latestNews.length} bài viết</span>
                </div>
                <div className="news-card-grid">
                  {latestNews.map((news) => (
                    <button className="news-card" key={news.id} onClick={() => openArticle(news.id)}>
                      <div className="news-card-image">
                        <img src={news.thumbnailUrl} alt="" />
                        <span className="news-category is-floating">{news.category || 'Tin tức'}</span>
                      </div>
                      <div className="news-card-content">
                        <NewsMeta news={news} />
                        <h3>{news.title}</h3>
                        <p>{news.summary}</p>
                        <span className="news-card-link">Xem chi tiết <ArrowRight size={15} /></span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </section>
    </AppShell>
  );
}
