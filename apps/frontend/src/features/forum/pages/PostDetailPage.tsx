import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { normalizeForumPost, normalizeForumComment } from '@/lib/normalizers';
import { formatDate } from '@/lib/formatters';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useAuth } from '@/app/providers';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  Eye,
  Flag,
  CornerDownRight,
  Reply,
  Pencil,
  Trash2,
  Download,
  FileText,
} from 'lucide-react';

interface CommentNode {
  id: number;
  content: string;
  userId: number;
  authorName: string;
  parentId: number | null;
  likeCount: number;
  liked: boolean;
  createdAt: string;
  replies?: CommentNode[];
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const postId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [commentText, setCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  
  // Flag / Report dialog state
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);

  // Query: Fetch post details
  const { data: post, isLoading: isPostLoading, error } = useQuery({
    queryKey: ['forum', 'posts', 'detail', postId],
    queryFn: async () => {
      const res = await apiClient.get(`/forum/posts/${postId}`);
      return normalizeForumPost(res.data);
    },
    enabled: !isNaN(postId),
  });

  // Mutation: Like / Unlike post
  const likePostMutation = useMutation({
    mutationFn: async () => {
      if (post?.liked) {
        await apiClient.delete(`/forum/posts/${postId}/like`);
      } else {
        await apiClient.post(`/forum/posts/${postId}/like`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts', 'detail', postId] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Thao tác thích bài viết thất bại.');
    },
  });

  // Mutation: Like / Unlike comment
  const likeCommentMutation = useMutation({
    mutationFn: async (payload: { commentId: number; liked: boolean }) => {
      if (payload.liked) {
        await apiClient.delete(`/forum/comments/${payload.commentId}/like`);
      } else {
        await apiClient.post(`/forum/comments/${payload.commentId}/like`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts', 'detail', postId] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Thao tác thích bình luận thất bại.');
    },
  });

  // Mutation: Create Comment / Reply
  const addCommentMutation = useMutation({
    mutationFn: async (payload: { content: string; parentId?: number }) => {
      const res = await apiClient.post(`/forum/posts/${postId}/comments`, {
        content: payload.content,
        parentId: payload.parentId,
      });
      return normalizeForumComment(res.data);
    },
    onSuccess: () => {
      setCommentText('');
      setReplyText('');
      setReplyingToId(null);
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts', 'detail', postId] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts'] });
      toast.success('Gửi bình luận thành công!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Không thể gửi bình luận.');
    },
  });

  // Mutation: Report Post or Comment
  const reportMutation = useMutation({
    mutationFn: async (payload: { reason: string; description?: string }) => {
      const endpoint = reportingCommentId === null
        ? `/forum/posts/${postId}/report`
        : `/forum/comments/${reportingCommentId}/report`;
      await apiClient.post(endpoint, payload);
    },
    onSuccess: () => {
      setIsReportOpen(false);
      setReportingCommentId(null);
      setReportReason('');
      setReportDesc('');
      toast.success('Đã gửi báo cáo vi phạm lên hệ thống quản trị.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Không thể gửi báo cáo.');
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/forum/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['forum', 'posts', 'detail', postId] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts'] });
      toast.success('Xóa bài viết thành công!');
      navigate('/forum', { replace: true });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Không thể xóa bài viết.');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await apiClient.delete(`/forum/comments/${commentId}`);
    },
    onSuccess: () => {
      setDeletingCommentId(null);
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts', 'detail', postId] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts'] });
      toast.success('Xóa bình luận thành công!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Không thể xóa bình luận.');
    },
  });

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate({ content: commentText.trim() });
  };

  const handleSendReply = (parentId: number) => {
    if (!replyText.trim()) return;
    addCommentMutation.mutate({ content: replyText.trim(), parentId });
  };

  const handleSendReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    reportMutation.mutate({
      reason: reportReason.trim(),
      description: reportDesc.trim() || undefined,
    });
  };

  // Build recursive comment tree from flat list DTO
  const buildCommentTree = (flat: CommentNode[]): CommentNode[] => {
    const map: Record<number, CommentNode & { replies: CommentNode[] }> = {};
    const roots: CommentNode[] = [];

    flat.forEach((c) => {
      map[c.id] = { ...c, replies: [] };
    });

    flat.forEach((c) => {
      const node = map[c.id];
      if (c.parentId && map[c.parentId]) {
        map[c.parentId].replies.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort replies chronologically
    Object.values(map).forEach((node) => {
      node.replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });

    return roots;
  };

  const commentTree = post?.comments ? buildCommentTree(post.comments as CommentNode[]) : [];

  if (isPostLoading) {
    return (
      <AppShell>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          <div className="skeleton-shimmer" style={{ height: '24px', width: '30%' }} />
          <div className="skeleton-shimmer" style={{ height: '40px', width: '70%' }} />
          <div className="skeleton-shimmer" style={{ height: '160px', width: '100%', borderRadius: 'var(--radius-md)' }} />
        </div>
      </AppShell>
    );
  }

  if (error || !post) {
    return (
      <AppShell>
        <EmptyState
          title="Không tìm thấy bài viết"
          message="Bài thảo luận này không tồn tại trong hệ thống hoặc đã bị gỡ bỏ."
          icon={<MessageSquare size={48} />}
          actionText="Về trang diễn đàn"
          onAction={() => navigate('/forum')}
        />
      </AppShell>
    );
  }

  const isPostOwner = !!user && post.userId === user.id;

  // Recursive Comment Node Component
  const RenderCommentNode = ({ node, depth = 0 }: { node: CommentNode; depth: number }) => {
    const isReplying = replyingToId === node.id;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
        <div
          style={{
            display: 'flex',
            gap: 'var(--spacing-3)',
            padding: 'var(--spacing-3)',
            backgroundColor: 'white',
            border: '1px solid var(--color-slate-200)',
            borderRadius: 'var(--radius-sm)',
            marginLeft: `${depth * 24}px`,
            position: 'relative',
          }}
        >
          {depth > 0 && (
            <div
              style={{
                position: 'absolute',
                left: '-16px',
                top: '18px',
                color: 'var(--color-slate-300)',
              }}
            >
              <CornerDownRight size={14} />
            </div>
          )}

          <Avatar fallback={node.authorName} size={32} />
          
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-slate-700)' }}>
                {node.authorName}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--color-slate-400)' }}>
                {node.createdAt ? new Date(node.createdAt).toLocaleString('vi-VN') : ''}
              </span>
            </div>
            
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-700)', marginTop: '4px', margin: 0, wordBreak: 'break-word' }}>
              {node.content}
            </p>

            <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginTop: '8px', fontSize: 'var(--text-xs)' }}>
              <button
                onClick={() => likeCommentMutation.mutate({ commentId: node.id, liked: node.liked })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: node.liked ? 'var(--color-primary-600)' : 'var(--color-slate-400)',
                  fontWeight: node.liked ? 700 : 500,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <ThumbsUp size={12} fill={node.liked ? 'var(--color-primary-600)' : 'transparent'} />
                <span>{node.likeCount} Thích</span>
              </button>

              <button
                onClick={() => {
                  setReplyText('');
                  setReplyingToId(isReplying ? null : node.id);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: 'var(--color-slate-400)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Reply size={12} />
                <span>Trả lời</span>
              </button>

              {node.userId !== user?.id && (
                <button
                  type="button"
                  onClick={() => {
                    setReportingCommentId(node.id);
                    setIsReportOpen(true);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-danger-500)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <Flag size={12} />
                  <span>Báo cáo</span>
                </button>
              )}

              {(node.userId === user?.id || user?.role === 'ADMIN') && (
                <button
                  type="button"
                  onClick={() => setDeletingCommentId(node.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: 'var(--color-danger-600)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={12} />
                  <span>Xóa</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Inline reply box */}
        {isReplying && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-2)',
              marginLeft: `${(depth + 1) * 24}px`,
              padding: 'var(--spacing-3)',
              backgroundColor: 'var(--color-slate-50)',
              border: '1px solid var(--color-slate-200)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-slate-500)' }}>
              Phản hồi {node.authorName}
            </span>
            <Textarea
              placeholder="Nhập nội dung câu trả lời..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={2}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="secondary" size="sm" onClick={() => setReplyingToId(null)}>
                Hủy
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSendReply(node.id)}
                disabled={!replyText.trim()}
                isLoading={addCommentMutation.isPending}
              >
                Gửi phản hồi
              </Button>
            </div>
          </div>
        )}

        {/* Recursive replies mapping */}
        {node.replies && node.replies.map((reply) => (
          <RenderCommentNode key={reply.id} node={reply} depth={depth + 1} />
        ))}
      </div>
    );
  };

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
        {/* Breadcrumbs navigation */}
        <div>
          <Link
            to="/forum"
            className="btn btn-sm btn-text"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', paddingLeft: 0 }}
          >
            <ArrowLeft size={14} />
            <span>Quay lại Diễn đàn</span>
          </Link>
        </div>

        {/* Post Core Details Card */}
        <Card>
          <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', padding: 'var(--spacing-6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <Badge variant="primary">{post.categoryName}</Badge>
              
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)' }}>
                Đăng bởi <strong>{post.authorName}</strong> &bull; {formatDate(post.createdAt)}
              </span>
            </div>

            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 850, color: 'var(--color-primary-950)', margin: 0 }}>
              {post.title}
            </h1>

            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-700)', lineHeight: '1.6', whiteSpace: 'pre-wrap', margin: 0 }}>
              {post.content}
            </p>

            {post.attachmentUrl && (
              post.attachmentType === 'IMAGE' ? (
                <a href={post.attachmentUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', width: 'fit-content' }}>
                  <img
                    src={post.attachmentUrl}
                    alt={post.attachmentName || 'Ảnh đính kèm'}
                    style={{ maxWidth: '100%', maxHeight: '480px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-slate-200)' }}
                  />
                </a>
              ) : (
                <a
                  href={post.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', width: 'fit-content', padding: 'var(--spacing-3)', border: '1px solid var(--color-slate-200)', borderRadius: 'var(--radius-sm)', color: 'var(--color-primary-700)' }}
                >
                  <FileText size={20} />
                  <span>{post.attachmentName || 'Tệp đính kèm'}</span>
                  <Download size={16} />
                </a>
              )
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid var(--color-slate-100)',
                paddingTop: 'var(--spacing-4)',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', gap: 'var(--spacing-4)', fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)' }}>
                <button
                  type="button"
                  onClick={() => likePostMutation.mutate()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: post.liked ? 'var(--color-primary-600)' : '',
                    fontWeight: post.liked ? 700 : 500,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <ThumbsUp size={16} fill={post.liked ? 'var(--color-primary-600)' : 'transparent'} />
                  <span>{post.likeCount} Thích</span>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquare size={16} />
                  <span>{post.commentCount} Bình luận</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Eye size={16} />
                  <span>{post.viewCount} Lượt xem</span>
                </div>
              </div>

              {isPostOwner ? (
                <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/forum/${postId}/edit`)}
                  >
                    <Pencil size={14} />
                    <span>Sửa bài viết</span>
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setIsDeleteOpen(true)}
                  >
                    <Trash2 size={14} />
                    <span>Xóa bài viết</span>
                  </Button>
                </div>
              ) : (
                <Button
                  variant="text"
                  size="sm"
                  onClick={() => {
                    setReportingCommentId(null);
                    setIsReportOpen(true);
                  }}
                  style={{ color: 'var(--color-danger-600)', gap: '4px' }}
                >
                  <Flag size={14} />
                  <span>Báo cáo vi phạm</span>
                </Button>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Discussion Section */}
        <div style={{ marginTop: 'var(--spacing-4)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--color-primary-950)', margin: 0 }}>
            Bình luận
          </h2>

          {/* Root Comment Composer */}
          <form onSubmit={handleSendComment} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
            <Textarea
              placeholder="Nhập nội dung chia sẻ, thảo luận của bạn..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={addCommentMutation.isPending}
              rows={3}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="primary" disabled={!commentText.trim()} isLoading={addCommentMutation.isPending}>
                Gửi bình luận
              </Button>
            </div>
          </form>

          {/* Comments tree display */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-2)' }}>
            {commentTree.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 'var(--spacing-8)',
                  backgroundColor: 'white',
                  border: '1px solid var(--color-slate-200)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-slate-400)',
                  fontSize: 'var(--text-xs)',
                }}
              >
                Chưa có thảo luận nào cho bài viết này. Hãy là người đầu tiên tham gia thảo luận!
              </div>
            ) : (
              commentTree.map((rootNode) => (
                <RenderCommentNode key={rootNode.id} node={rootNode} depth={0} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Flag / Report Dialog */}
      <Dialog isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} title={`Báo cáo ${reportingCommentId === null ? 'bài viết' : 'bình luận'} vi phạm`}>
        <form onSubmit={handleSendReport} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <Input
            label="Lý do báo cáo *"
            placeholder="Ví dụ: Nội dung xúc phạm, spam, chia sẻ tệp độc hại..."
            required
            value={reportReason}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReportReason(e.target.value)}
          />

          <Textarea
            label="Mô tả chi tiết"
            placeholder="Mô tả cụ thể hành vi vi phạm để ban quản trị kiểm duyệt..."
            value={reportDesc}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReportDesc(e.target.value)}
            rows={3}
          />

          <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end' }}>
            <Button variant="secondary" type="button" onClick={() => setIsReportOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="danger" disabled={!reportReason.trim()} isLoading={reportMutation.isPending}>
              Gửi báo cáo
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        isOpen={deletingCommentId !== null}
        onClose={() => setDeletingCommentId(null)}
        onConfirm={() => deletingCommentId !== null && deleteCommentMutation.mutate(deletingCommentId)}
        title="Xóa bình luận"
        message="Bạn có chắc chắn muốn xóa bình luận này? Các phản hồi trực thuộc bình luận cũng sẽ bị xóa và không thể khôi phục."
        confirmText="Xóa bình luận"
        isDestructive
        isLoading={deleteCommentMutation.isPending}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deletePostMutation.mutate()}
        title="Xóa bài viết"
        message="Bạn có chắc chắn muốn xóa bài viết này? Toàn bộ bình luận và lượt thích liên quan cũng sẽ bị xóa. Hành động này không thể hoàn tác."
        confirmText="Xóa bài viết"
        isDestructive
        isLoading={deletePostMutation.isPending}
      />
    </AppShell>
  );
}
