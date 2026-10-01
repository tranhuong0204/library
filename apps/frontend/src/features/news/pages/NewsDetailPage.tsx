import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { normalizeNews } from '@/lib/normalizers';
import { formatDate } from '@/lib/formatters';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ArrowLeft, Calendar, Eye, Newspaper } from 'lucide-react';

export default function NewsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const newsId = Number(id);
  const navigate = useNavigate();

  // Query: Get news detail by ID
  const { data: news, isLoading, error } = useQuery({
    queryKey: ['news', 'detail', newsId],
    queryFn: async () => {
      const res = await apiClient.get(`/news/${newsId}`);
      return normalizeNews(res.data);
    },
    enabled: !isNaN(newsId),
  });

  if (isLoading) {
    return (
      <AppShell>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          <div className="skeleton-shimmer" style={{ height: '24px', width: '30%' }} />
          <div className="skeleton-shimmer" style={{ height: '56px', width: '70%' }} />
          <div className="skeleton-shimmer" style={{ height: '320px', width: '100%', borderRadius: 'var(--radius-md)' }} />
        </div>
      </AppShell>
    );
  }

  if (error || !news) {
    return (
      <AppShell>
        <EmptyState
          title="Không tìm thấy bài viết"
          message="Bài viết tin tức này không tồn tại hoặc đã bị gỡ bỏ khỏi hệ thống LIBRARY."
          icon={<Newspaper size={48} />}
          actionText="Về trang tin tức"
          onAction={() => navigate('/news')}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
        {/* Breadcrumb link */}
        <div>
          <Link
            to="/news"
            className="btn btn-sm btn-text"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', paddingLeft: 0 }}
          >
            <ArrowLeft size={14} />
            <span>Quay lại Bản tin</span>
          </Link>
        </div>

        {/* Main content body card */}
        <Card>
          <CardBody style={{ padding: 'var(--spacing-6) var(--spacing-8)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
            <div style={{ display: 'flex', gap: 'var(--spacing-3)', alignItems: 'center', flexWrap: 'wrap' }}>
              <Badge variant="primary">{news.category}</Badge>
              {news.featured && <Badge variant="warning">Nổi bật</Badge>}
              
              <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} />
                  <span>{formatDate(news.createdAt)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Eye size={12} />
                  <span>{news.viewCount} lượt xem</span>
                </div>
              </div>
            </div>

            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 900, color: 'var(--color-primary-950)', margin: 0, lineHeight: '1.3' }}>
              {news.title}
            </h1>

            {/* Abstract summary block */}
            <div
              style={{
                padding: 'var(--spacing-3) var(--spacing-4)',
                backgroundColor: 'var(--color-slate-50)',
                borderLeft: '4px solid var(--color-primary-500)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-slate-600)',
                lineHeight: '1.6',
                fontWeight: 500,
              }}
            >
              {news.summary}
            </div>

            {/* Cover image banner */}
            {news.thumbnailUrl && (
              <div style={{ width: '100%', maxHeight: '420px', overflow: 'hidden', borderRadius: 'var(--radius-sm)' }}>
                <img
                  src={news.thumbnailUrl}
                  alt={news.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}

            {/* Markdown rendered body */}
            <div style={{ borderTop: '1px solid var(--color-slate-100)', paddingTop: 'var(--spacing-5)', fontSize: 'var(--text-sm)' }}>
              <MarkdownRenderer content={news.content} />
            </div>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
