import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api/client';
import { normalizeDocument } from '@/lib/normalizers';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Heart, Eye, Download, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function FavoritesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['documents', 'favorites'],
    queryFn: async () => {
      const res = await apiClient.get('/documents/favorites');
      return (Array.isArray(res.data) ? res.data : []).map(normalizeDocument);
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (documentId: number) => {
      await apiClient.delete(`/documents/${documentId}/favorite`);
      return documentId;
    },
    onSuccess: (documentId) => {
      queryClient.setQueryData(
        ['documents', 'favorites'],
        (current: typeof favorites | undefined) =>
          (current || []).filter((document) => document.id !== documentId),
      );
      queryClient.invalidateQueries({ queryKey: ['documents', 'favorites'] });
      toast.success('Đã xóa tài liệu khỏi danh sách yêu thích.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể xóa tài liệu khỏi danh sách yêu thích.');
    },
  });

  return (
    <AppShell>
      <PageHeader
        title="Tài liệu yêu thích"
        description="Quản lý và xem nhanh các giáo trình, tài liệu học thuật bạn đã lưu trữ."
      />

      {isLoading ? (
        <div className="grid-responsive-cards" style={{ marginTop: 'var(--spacing-4)' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <div className="skeleton-shimmer" style={{ height: '160px' }} />
              <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="skeleton-shimmer" style={{ height: '20px', width: '70%' }} />
                <div className="skeleton-shimmer" style={{ height: '14px', width: '50%' }} />
              </CardBody>
            </Card>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div style={{ marginTop: 'var(--spacing-8)' }}>
          <EmptyState
            title="Danh sách yêu thích trống"
            message="Bạn chưa lưu tài liệu nào. Hãy khám phá thư viện học tập và nhấp vào biểu tượng Trái tim để lưu tài liệu tại đây."
            icon={<Heart size={48} style={{ color: 'var(--color-danger-400)' }} />}
            actionText="Đến thư viện ngay"
            onAction={() => navigate('/library')}
          />
        </div>
      ) : (
        <div className="grid-responsive-cards" style={{ marginTop: 'var(--spacing-4)' }}>
          {favorites.map((doc) => (
            <Card
              key={doc.id}
              hoverable
              className="library-document-card"
              onClick={() => navigate(`/library/${doc.id}`)}
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '100%' }}
            >
              <div
                className="library-card-cover"
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {doc.coverUrl ? (
                  <img
                    src={doc.coverUrl}
                    alt={doc.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <BookOpen size={48} style={{ color: 'var(--color-slate-300)' }} />
                )}
                <button
                  type="button"
                  aria-label={`Xóa ${doc.title} khỏi danh sách yêu thích`}
                  title="Xóa khỏi danh sách yêu thích"
                  disabled={removeFavoriteMutation.isPending && removeFavoriteMutation.variables === doc.id}
                  onClick={(event) => {
                    event.stopPropagation();
                    removeFavoriteMutation.mutate(doc.id);
                  }}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    zIndex: 2,
                    width: '32px',
                    height: '32px',
                    padding: 0,
                    border: '1px solid var(--color-danger-100)',
                    borderRadius: '999px',
                    background: 'white',
                    color: 'var(--color-danger-500)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    opacity: removeFavoriteMutation.isPending && removeFavoriteMutation.variables === doc.id ? 0.55 : 1,
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <Heart size={16} fill="currentColor" />
                </button>
              </div>
              <CardBody style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                <h3
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 700,
                    color: 'var(--color-slate-900)',
                    lineHeight: '1.4',
                    margin: 0,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {doc.title}
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)', margin: 0 }}>
                  Tác giả: {doc.author || 'Chưa rõ'}
                </p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary-600)', fontWeight: 600, margin: 0 }}>
                  {doc.categoryName}
                </p>

                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: 'var(--spacing-2)',
                    borderTop: '1px solid var(--color-slate-100)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-slate-400)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Eye size={12} />
                    <span>{doc.viewCount}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Download size={12} />
                    <span>{doc.downloadCount}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
