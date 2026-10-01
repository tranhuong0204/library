import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { normalizeForumPost, normalizeForumCategory } from '@/lib/normalizers';
import { formatDate } from '@/lib/formatters';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import {
  MessageSquare,
  Eye,
  ThumbsUp,
  Plus,
  ArrowUpDown,
  Hash,
} from 'lucide-react';

export default function ForumFeedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState<'date' | 'likes' | 'views'>('date');

  const selectedCategoryId = searchParams.get('category') ? Number(searchParams.get('category')) : null;
  const searchQuery = searchParams.get('q') || '';

  // Query: Get forum categories
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['forum', 'categories'],
    queryFn: async () => {
      const res = await apiClient.get('/forum/categories');
      return (Array.isArray(res.data) ? res.data : []).map(normalizeForumCategory);
    },
  });

  // Query: Get forum posts
  const { data: posts = [], isLoading: isPostsLoading } = useQuery({
    queryKey: ['forum', 'posts', selectedCategoryId],
    queryFn: async () => {
      const path = selectedCategoryId ? `/forum/posts?categoryId=${selectedCategoryId}` : '/forum/posts';
      const res = await apiClient.get(path);
      return (Array.isArray(res.data) ? res.data : []).map(normalizeForumPost);
    },
  });

  // Mutation: Like / Unlike post
  const likeMutation = useMutation({
    mutationFn: async (payload: { id: number; liked: boolean }) => {
      if (payload.liked) {
        await apiClient.delete(`/forum/posts/${payload.id}/like`);
      } else {
        await apiClient.post(`/forum/posts/${payload.id}/like`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts', selectedCategoryId] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Thao tác thích bài viết thất bại.');
    },
  });

  // Client-side Search and Sorting Workaround
  const filteredPosts = posts
    .filter((post) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        post.title.toLowerCase().includes(q) ||
        post.content.toLowerCase().includes(q) ||
        post.authorName.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'likes') {
        return b.likeCount - a.likeCount;
      }
      if (sortBy === 'views') {
        return b.viewCount - a.viewCount;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handleCategorySelect = (categoryId: number | null) => {
    const params = new URLSearchParams(searchParams);
    if (categoryId) {
      params.set('category', String(categoryId));
    } else {
      params.delete('category');
    }
    setSearchParams(params);
  };

  const handleSearch = (q: string) => {
    const params = new URLSearchParams(searchParams);
    if (q) {
      params.set('q', q);
    } else {
      params.delete('q');
    }
    setSearchParams(params);
  };

  return (
    <AppShell>
      <PageHeader
        title="Diễn đàn trao đổi"
        description="Tham gia thảo luận về các chủ đề khoa học máy tính, trí tuệ nhân tạo và kinh nghiệm học tập."
        actions={
          <Button variant="primary" onClick={() => navigate('/forum/create')}>
            <Plus size={16} />
            <span>Tạo bài thảo luận</span>
          </Button>
        }
      />



      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 'var(--spacing-6)' }} className="forum-layout">
        {/* Left Categories Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }} className="forum-sidebar">
          <Card>
            <CardBody style={{ padding: 'var(--spacing-3)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-slate-800)', padding: 'var(--spacing-2) var(--spacing-3)', margin: 0 }}>
                Chủ đề diễn đàn
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: 'var(--spacing-2)' }}>
                <button
                  onClick={() => handleCategorySelect(null)}
                  className={`category-nav-btn ${selectedCategoryId === null ? 'category-nav-btn-active' : ''}`}
                >
                  <Hash size={14} />
                  <span>Tất cả thảo luận</span>
                </button>

                {isCategoriesLoading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="skeleton-shimmer" style={{ height: '36px', borderRadius: '4px', margin: '4px 0' }} />
                    ))
                  : categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.id)}
                        className={`category-nav-btn ${selectedCategoryId === cat.id ? 'category-nav-btn-active' : ''}`}
                      >
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: cat.color || 'var(--color-primary-500)',
                          }}
                        />
                        <span>{cat.name}</span>
                      </button>
                    ))}
              </div>
            </CardBody>
          </Card>
        </aside>

        {/* Center Posts Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          {/* Filters Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-4)', flexWrap: 'wrap' }}>
            <div style={{ maxWidth: '360px', width: '100%' }}>
              <SearchInput
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Tìm bài viết, nội dung thảo luận..."
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <ArrowUpDown size={16} style={{ color: 'var(--color-slate-400)' }} />
              <select
                className="form-select"
                style={{ width: '160px', padding: '4px 8px', height: '36px' }}
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
              >
                <option value="date">Mới nhất</option>
                <option value="likes">Yêu thích nhất</option>
                <option value="views">Xem nhiều nhất</option>
              </select>
            </div>
          </div>

          {/* Posts list */}
          {isPostsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="skeleton-shimmer" style={{ height: '22px', width: '60%' }} />
                    <div className="skeleton-shimmer" style={{ height: '14px', width: '40%' }} />
                    <div className="skeleton-shimmer" style={{ height: '40px', width: '100%' }} />
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <EmptyState
              title="Không có bài thảo luận"
              message={
                searchQuery
                  ? `Không tìm thấy bài viết nào chứa từ khóa "${searchQuery}"`
                  : 'Chưa có bài thảo luận nào được đăng tải trong chủ đề này.'
              }
              icon={<MessageSquare size={48} />}
              actionText="Viết bài đầu tiên"
              onAction={() => navigate('/forum/create')}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              {filteredPosts.map((post) => (
                <Card
                  key={post.id}
                  hoverable
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/forum/${post.id}`)}
                >
                  <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                    {/* Top Row: category and metadata */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Badge variant="primary" style={{ backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-700)' }}>
                        {post.categoryName}
                      </Badge>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)' }}>
                        Đăng bởi <strong>{post.authorName}</strong> &bull; {formatDate(post.createdAt)}
                      </span>
                    </div>

                    {/* Content Row */}
                    <div>
                      <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--color-primary-950)', margin: '0 0 8px 0' }}>
                        {post.title}
                      </h2>
                      <p
                        style={{
                          fontSize: 'var(--text-sm)',
                          color: 'var(--color-slate-600)',
                          margin: 0,
                          lineHeight: '1.6',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {post.content}
                      </p>
                    </div>

                    {/* Footer Row: interact items */}
                    <div
                      style={{
                        display: 'flex',
                        gap: 'var(--spacing-6)',
                        borderTop: '1px solid var(--color-slate-100)',
                        paddingTop: 'var(--spacing-3)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-slate-500)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          likeMutation.mutate({ id: post.id, liked: post.liked });
                        }}
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
                        <ThumbsUp size={14} fill={post.liked ? 'var(--color-primary-600)' : 'transparent'} />
                        <span>{post.likeCount} Thích</span>
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MessageSquare size={14} />
                        <span>{post.commentCount} Bình luận</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Eye size={14} />
                        <span>{post.viewCount} Lượt xem</span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .category-nav-btn {
          display: flex;
          align-items: center;
          gap: var(--spacing-3);
          width: 100%;
          padding: var(--spacing-2) var(--spacing-3);
          font-size: var(--text-xs);
          font-weight: 600;
          color: var(--color-slate-600);
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
          text-align: left;
          background: none;
          border: none;
          cursor: pointer;
        }
        .category-nav-btn:hover {
          background-color: var(--color-slate-100);
          color: var(--color-slate-900);
        }
        .category-nav-btn-active {
          background-color: var(--color-primary-50) !important;
          color: var(--color-primary-700) !important;
        }
        
        @media (max-width: 768px) {
          .forum-layout {
            grid-template-columns: 1fr !important;
          }
          .forum-sidebar {
            display: none !important;
          }
        }
      `}</style>
    </AppShell>
  );
}
