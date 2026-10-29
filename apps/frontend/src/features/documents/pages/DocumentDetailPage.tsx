import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/providers';
import { apiClient } from '@/lib/api/client';
import { normalizeDocument, normalizeDocumentComment, normalizeDocumentRating } from '@/lib/normalizers';
import { formatBytes, formatDate } from '@/lib/formatters';
import { AppShell } from '@/components/layout/AppShell';
import { AdminShell } from '@/components/layout/AdminShell';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/feedback/EmptyState';
import { toast } from 'sonner';
import {
  BookOpen,
  Eye,
  Download,
  Calendar,
  Heart,
  Star,
  MessageSquare,
  Trash2,
} from 'lucide-react';

interface DocumentDetailPageProps {
  adminMode?: boolean;
}

export default function DocumentDetailPage({ adminMode = false }: DocumentDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const docId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const Shell = adminMode ? AdminShell : AppShell;
  const returnPath = adminMode ? '/admin/documents' : '/library';
  const returnLabel = adminMode ? 'Quản lý tài liệu' : 'Thư viện';

  // Query: Document details
  const { data: document, isLoading: isDocLoading, error: docError } = useQuery({
    queryKey: ['documents', 'detail', docId],
    queryFn: async () => {
      const res = await apiClient.get(`/documents/${docId}`);
      return normalizeDocument(res.data);
    },
    enabled: !isNaN(docId),
  });

  // Query: Document comments
  const {
    data: comments = [],
    isLoading: isCommentsLoading,
    isError: isCommentsError,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ['documents', 'comments', docId],
    queryFn: async () => {
      const res = await apiClient.get(`/documents/${docId}/comments`);
      return (Array.isArray(res.data) ? res.data : []).map(normalizeDocumentComment);
    },
    enabled: !isNaN(docId),
  });

  // Query: Document rating statistics
  const { data: ratingStats } = useQuery({
    queryKey: ['documents', 'rating', docId],
    queryFn: async () => {
      const res = await apiClient.get(`/documents/${docId}/ratings`);
      return normalizeDocumentRating(res.data);
    },
    enabled: !isNaN(docId),
  });

  // Query: User favorites list (to check favorited status)
  const { data: favorites = [] } = useQuery({
    queryKey: ['documents', 'favorites'],
    queryFn: async () => {
      const res = await apiClient.get('/documents/favorites');
      return (Array.isArray(res.data) ? res.data : []).map(normalizeDocument);
    },
    enabled: !!user,
  });

  const isFavorited = favorites.some((fav) => fav.id === docId);

  // Mutation: Favorite toggler
  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorited) {
        await apiClient.delete(`/documents/${docId}/favorite`);
      } else {
        await apiClient.post(`/documents/${docId}/favorite`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', 'favorites'] });
      toast.success(isFavorited ? 'Đã xóa khỏi danh sách yêu thích' : 'Đã thêm vào danh sách yêu thích');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Thao tác yêu thích thất bại.');
    },
  });

  // Mutation: Rate Document
  const rateMutation = useMutation({
    mutationFn: async (rating: number) => {
      const res = await apiClient.post(`/documents/${docId}/ratings`, { rating });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['documents', 'rating', docId],
        normalizeDocumentRating(data),
      );
      queryClient.invalidateQueries({ queryKey: ['documents', 'rating', docId] });
      toast.success('Đánh giá tài liệu thành công!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Đánh giá thất bại.');
    },
  });

  // Mutation: Add Comment
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiClient.post(`/documents/${docId}/comments`, { content });
      return normalizeDocumentComment(res.data);
    },
    onSuccess: (newComment) => {
      setCommentText('');
      queryClient.setQueryData(
        ['documents', 'comments', docId],
        (current: ReturnType<typeof normalizeDocumentComment>[] | undefined) => [
          newComment,
          ...(current ?? []).filter((comment) => comment.id !== newComment.id),
        ],
      );
      queryClient.invalidateQueries({ queryKey: ['documents', 'comments', docId] });
      toast.success('Gửi bình luận thành công!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Không thể gửi bình luận.');
    },
  });

  // Mutation: Delete Comment
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await apiClient.delete(`/documents/${docId}/comments/${commentId}`);
      return commentId;
    },
    onSuccess: (deletedCommentId) => {
      queryClient.setQueryData(
        ['documents', 'comments', docId],
        (current: ReturnType<typeof normalizeDocumentComment>[] | undefined) =>
          (current ?? []).filter((comment) => comment.id !== deletedCommentId),
      );
      queryClient.invalidateQueries({ queryKey: ['documents', 'comments', docId] });
      toast.success('Đã xóa bình luận.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Không thể xóa bình luận.');
    },
  });

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate(commentText.trim());
  };

  const handleRate = (stars: number) => {
    rateMutation.mutate(stars);
  };

  const handleDownload = async () => {
    if (!document?.fileUrl || isDownloading) return;

    setIsDownloading(true);
    try {
      const response = await apiClient.get(`/documents/${docId}/download`, { responseType: 'blob' });
      const extension = document.fileType?.trim().toLowerCase() || 'pdf';
      const fileName = `${document.title.replace(/[\\/:*?"<>|]/g, '_')}.${extension}`;
      const blobUrl = URL.createObjectURL(new Blob([response.data]));
      const link = window.document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
      const downloadCount = Number(response.headers['x-download-count']);
      if (Number.isFinite(downloadCount)) {
        queryClient.setQueryData(['documents', 'detail', docId], (current: typeof document | undefined) =>
          current ? { ...current, downloadCount } : current,
        );
        queryClient.setQueriesData(
          { queryKey: ['documents', 'list'] },
          (current: typeof document[] | undefined) =>
            current?.map((item) => item.id === docId ? { ...item, downloadCount } : item),
        );
        queryClient.setQueriesData(
          { queryKey: ['documents', 'popular'] },
          (current: typeof document[] | undefined) =>
            current?.map((item) => item.id === docId ? { ...item, downloadCount } : item),
        );
        queryClient.invalidateQueries({ queryKey: ['admin', 'documents', 'list'] });
      }
      toast.success('Tải tài liệu thành công. Tệp đang được lưu về máy của bạn.');
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải tài liệu. Vui lòng thử lại.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Helper: check if file is PDF

  if (isDocLoading) {
    return (
      <Shell>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          <div className="skeleton-shimmer" style={{ height: '40px', width: '40%' }} />
          <div style={{ display: 'flex', gap: 'var(--spacing-6)', flexWrap: 'wrap' }}>
            <div className="skeleton-shimmer" style={{ width: '220px', height: '300px', borderRadius: 'var(--radius-md)' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              <div className="skeleton-shimmer" style={{ height: '32px', width: '80%' }} />
              <div className="skeleton-shimmer" style={{ height: '24px', width: '30%' }} />
              <div className="skeleton-shimmer" style={{ height: '80px', width: '100%' }} />
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (docError || !document) {
    return (
      <Shell>
        <EmptyState
          title="Lỗi tải tài liệu"
          message="Không thể tìm thấy tài liệu này trong hệ thống hoặc đã xảy ra lỗi kết nối."
          icon={<BookOpen size={48} />}
          actionText="Về trang thư viện"
          onAction={() => navigate(returnPath)}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
        {/* Breadcrumb link */}
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)' }}>
          <Link to={returnPath} style={{ textDecoration: 'underline' }}>
            {returnLabel}
          </Link>{' '}
          / {document.title}
        </div>

        {/* Header Title Section */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 'var(--spacing-4)',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1 style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)', fontWeight: 700, color: 'var(--color-primary-950)', letterSpacing: '-0.015em' }}>
              {document.title}
            </h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-500)', marginTop: '6px' }}>
              Tác giả: <strong style={{ color: 'var(--color-slate-700)' }}>{document.author || 'Chưa rõ'}</strong> | Đăng tải bởi: {document.uploadedByName}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              onClick={() => favoriteMutation.mutate()}
              isLoading={favoriteMutation.isPending}
              style={{ color: isFavorited ? 'var(--color-danger-600)' : '', borderColor: isFavorited ? 'var(--color-danger-500)' : '' }}
            >
              <Heart size={16} fill={isFavorited ? 'var(--color-danger-600)' : 'transparent'} />
              <span>{isFavorited ? 'Đã yêu thích' : 'Yêu thích'}</span>
            </Button>
            
            {/* Open PDF file in a new tab */}
            <a href={document.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-md">
              <Eye size={16} />
              <span>Đọc ngay</span>
            </a>

            <Button variant="outline" onClick={handleDownload} isLoading={isDownloading}>
              <Download size={16} />
              <span>{isDownloading ? 'Đang tải...' : 'Tải xuống'}</span>
            </Button>
          </div>
        </div>

        {/* Main Document Details & Fallback Layout */}
        <div style={{ display: 'flex', gap: 'var(--spacing-6)', flexWrap: 'wrap' }}>
          {/* Cover image preview card */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '220px',
              height: '300px',
              backgroundColor: 'white',
              border: '1px solid var(--color-slate-200)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-book)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {document.coverUrl ? (
              <img
                src={document.coverUrl}
                alt={document.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <BookOpen size={64} style={{ color: 'var(--color-slate-300)' }} />
            )}
          </div>

          {/* Metadata info */}
          <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            <Card>
              <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                <div style={{ display: 'flex', gap: 'var(--spacing-4)', flexWrap: 'wrap' }}>
                  <Badge variant="primary">{document.categoryName}</Badge>
                  <Badge variant="accent">{document.fileType || 'PDF'}</Badge>
                  <Badge variant="info">{formatBytes(document.fileSize)}</Badge>
                </div>

                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-600)', lineHeight: '1.6', margin: 0 }}>
                  {document.description || 'Không có mô tả chi tiết cho tài liệu này.'}
                </p>

                {/* Info row */}
                <div
                  style={{
                    display: 'flex',
                    gap: 'var(--spacing-6)',
                    borderTop: '1px solid var(--color-slate-100)',
                    paddingTop: 'var(--spacing-4)',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)' }}>
                    <Eye size={16} />
                    <span>Lượt xem: <strong>{document.viewCount}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)' }}>
                    <Download size={16} />
                    <span>Lượt tải: <strong>{document.downloadCount}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)' }}>
                    <Calendar size={16} />
                    <span>Ngày đăng: <strong>{formatDate(document.createdAt)}</strong></span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Document rating stats */}
            <Card>
              <CardBody style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-8)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '100px' }}>
                  <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-slate-800)', lineHeight: '1' }}>
                    {ratingStats?.averageRating?.toFixed(1) || '0.0'}
                  </span>
                  <div style={{ display: 'flex', gap: '2px', margin: '4px 0' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < Math.round(ratingStats?.averageRating || 0) ? 'var(--color-warning-500)' : 'transparent'}
                        color={i < Math.round(ratingStats?.averageRating || 0) ? 'var(--color-warning-500)' : 'var(--color-slate-300)'}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)' }}>
                    ({ratingStats?.ratingCount || 0} lượt đánh giá)
                  </span>
                </div>

                {/* Rating interact tool */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-slate-700)' }}>
                    {ratingStats?.userRating ? 'Đánh giá của bạn' : 'Đánh giá tài liệu này'}
                  </h4>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {Array.from({ length: 5 }).map((_, i) => {
                      const starValue = i + 1;
                      const activeValue = hoverRating !== null ? hoverRating : (ratingStats?.userRating || 0);
                      const isGold = starValue <= activeValue;

                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleRate(starValue)}
                          onMouseEnter={() => setHoverRating(starValue)}
                          onMouseLeave={() => setHoverRating(null)}
                          style={{ cursor: 'pointer', transition: 'transform 100ms' }}
                          title={`Đánh giá ${starValue} sao`}
                        >
                          <Star
                            size={24}
                            fill={isGold ? 'var(--color-warning-500)' : 'transparent'}
                            color={isGold ? 'var(--color-warning-500)' : 'var(--color-slate-300)'}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)', margin: 0 }}>
                    Ý kiến của bạn giúp chúng tôi cải thiện chất lượng thư viện.
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        <div style={{ marginTop: 'var(--spacing-4)' }}>
          {/* Comments section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            <Card>
              <CardHeader>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={18} style={{ color: 'var(--color-primary-600)' }} />
                  <h3 style={{ fontSize: 'var(--text-base)', margin: 0 }}>Thảo luận ({comments.length})</h3>
                </div>
              </CardHeader>
              <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                {/* Comment composer */}
                <form onSubmit={handleSendComment} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                  <Textarea
                    placeholder="Chia sẻ ý kiến của bạn về tài liệu này..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={addCommentMutation.isPending}
                    rows={3}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button type="submit" variant="primary" isLoading={addCommentMutation.isPending} disabled={!commentText.trim()}>
                      Gửi bình luận
                    </Button>
                  </div>
                </form>

                {/* Comment List */}
                {isCommentsLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                    <div className="skeleton-shimmer" style={{ height: '50px', borderRadius: 'var(--radius-sm)' }} />
                    <div className="skeleton-shimmer" style={{ height: '50px', borderRadius: 'var(--radius-sm)' }} />
                  </div>
                ) : isCommentsError ? (
                  <div style={{ textAlign: 'center', padding: 'var(--spacing-6)', color: 'var(--color-danger-600)', fontSize: 'var(--text-xs)' }}>
                    <p style={{ margin: '0 0 var(--spacing-2)' }}>Không thể tải các bình luận đã lưu.</p>
                    <Button type="button" variant="outline" size="sm" onClick={() => refetchComments()}>
                      Thử tải lại
                    </Button>
                  </div>
                ) : comments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 'var(--spacing-6)', color: 'var(--color-slate-400)', fontSize: 'var(--text-xs)' }}>
                    Chưa có bình luận nào. Hãy là người đầu tiên thảo luận!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', maxHeight: '380px', overflowY: 'auto', paddingRight: 'var(--spacing-2)' }}>
                    {comments.map((comm) => {
                      // Ownership must be checked by the stable user id. The API
                      // displays fullName as authorName, so comparing it with the
                      // login username hides the delete action for most users.
                      const isOwner = user?.id === comm.userId;
                      return (
                        <div
                          key={comm.id}
                          style={{
                            display: 'flex',
                            gap: 'var(--spacing-3)',
                            padding: 'var(--spacing-3)',
                            backgroundColor: 'var(--color-slate-50)',
                            border: '1px solid var(--color-slate-200)',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          <Avatar fallback={comm.authorName} size={32} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-slate-700)' }}>
                                {comm.authorName}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', flexShrink: 0 }}>
                                <span style={{ fontSize: '10px', color: 'var(--color-slate-400)', whiteSpace: 'nowrap' }}>
                                  {comm.createdAt ? new Date(comm.createdAt).toLocaleString('vi-VN') : ''}
                                </span>

                                {/* Delete Comment (owner only) */}
                                {isOwner && (
                                  <button
                                    type="button"
                                    onClick={() => deleteCommentMutation.mutate(comm.id)}
                                    style={{
                                      width: '28px',
                                      height: '28px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0,
                                      padding: 0,
                                      color: 'var(--color-danger-500)',
                                      backgroundColor: 'var(--color-danger-50)',
                                      border: '1px solid var(--color-danger-100)',
                                      borderRadius: 'var(--radius-sm)',
                                      cursor: deleteCommentMutation.isPending ? 'not-allowed' : 'pointer',
                                      opacity: deleteCommentMutation.isPending ? 0.6 : 1,
                                    }}
                                    title="Xóa bình luận"
                                    aria-label="Xóa bình luận"
                                    disabled={deleteCommentMutation.isPending}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-600)', marginTop: '4px', margin: 0, wordBreak: 'break-word' }}>
                              {comm.content}
                            </p>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>

    </Shell>
  );
}
