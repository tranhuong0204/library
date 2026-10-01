import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { normalizeForumCategory, normalizeForumPost } from '@/lib/normalizers';
import { useAuth } from '@/app/providers';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/feedback/EmptyState';

const postSchema = z.object({
  title: z
    .string()
    .min(5, 'Tiêu đề cuộc thảo luận tối thiểu phải có 5 ký tự')
    .max(250, 'Tiêu đề không được vượt quá 250 ký tự'),
  categoryId: z.string().min(1, 'Vui lòng chọn chủ đề liên quan'),
  content: z.string().min(10, 'Nội dung chi tiết tối thiểu phải có 10 ký tự'),
});

type PostForm = z.infer<typeof postSchema>;

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const postId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: post, isLoading: isPostLoading, error } = useQuery({
    queryKey: ['forum', 'posts', 'detail', postId],
    queryFn: async () => {
      const res = await apiClient.get(`/forum/posts/${postId}`);
      return normalizeForumPost(res.data);
    },
    enabled: !Number.isNaN(postId),
  });

  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['forum', 'categories'],
    queryFn: async () => {
      const res = await apiClient.get('/forum/categories');
      return (Array.isArray(res.data) ? res.data : []).map(normalizeForumCategory);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PostForm>({
    resolver: zodResolver(postSchema),
    defaultValues: { title: '', categoryId: '', content: '' },
  });

  useEffect(() => {
    if (post) {
      reset({
        title: post.title,
        categoryId: String(post.categoryId),
        content: post.content,
      });
    }
  }, [post, reset]);

  const updatePostMutation = useMutation({
    mutationFn: async (data: PostForm) => {
      const res = await apiClient.put(`/forum/posts/${postId}`, {
        title: data.title.trim(),
        content: data.content.trim(),
        categoryId: Number(data.categoryId),
      });
      return normalizeForumPost(res.data);
    },
    onSuccess: (updatedPost) => {
      queryClient.setQueryData(['forum', 'posts', 'detail', postId], updatedPost);
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts'] });
      toast.success('Cập nhật bài viết thành công!');
      navigate(`/forum/${postId}`, { replace: true });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Không thể cập nhật bài viết.');
    },
  });

  if (isPostLoading) {
    return (
      <AppShell>
        <div className="skeleton-shimmer" style={{ height: '320px', borderRadius: 'var(--radius-md)' }} />
      </AppShell>
    );
  }

  if (error || !post) {
    return (
      <AppShell>
        <EmptyState
          title="Không tìm thấy bài viết"
          message="Bài viết không tồn tại hoặc đã bị xóa."
          actionText="Về trang diễn đàn"
          onAction={() => navigate('/forum')}
        />
      </AppShell>
    );
  }

  if (!user || post.userId !== user.id) {
    return (
      <AppShell>
        <EmptyState
          title="Bạn không có quyền chỉnh sửa"
          message="Chỉ tác giả mới được phép chỉnh sửa bài viết này."
          actionText="Quay lại bài viết"
          onAction={() => navigate(`/forum/${postId}`)}
        />
      </AppShell>
    );
  }

  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
        <div>
          <button
            onClick={() => navigate(`/forum/${postId}`)}
            className="btn btn-sm btn-text"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', paddingLeft: 0 }}
          >
            <ArrowLeft size={14} />
            <span>Quay lại bài viết</span>
          </button>
        </div>

        <PageHeader
          title="Chỉnh sửa bài viết"
          description="Cập nhật tiêu đề, chủ đề hoặc nội dung cuộc thảo luận của bạn."
        />

        <div style={{ maxWidth: '720px', width: '100%', marginTop: 'var(--spacing-2)' }}>
          <form
            onSubmit={handleSubmit((data) => updatePostMutation.mutate(data))}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}
          >
            <Input
              label="Tiêu đề cuộc thảo luận *"
              error={errors.title?.message}
              disabled={updatePostMutation.isPending}
              {...register('title')}
            />

            <Select
              label="Chủ đề diễn đàn *"
              placeholder="Chọn chủ đề thảo luận phù hợp..."
              options={categoryOptions}
              error={errors.categoryId?.message}
              disabled={updatePostMutation.isPending || isCategoriesLoading}
              {...register('categoryId')}
            />

            <Textarea
              label="Nội dung thảo luận chi tiết *"
              error={errors.content?.message}
              disabled={updatePostMutation.isPending}
              rows={10}
              {...register('content')}
            />

            <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end', marginTop: 'var(--spacing-4)' }}>
              <Button
                variant="secondary"
                type="button"
                onClick={() => navigate(`/forum/${postId}`)}
                disabled={updatePostMutation.isPending}
              >
                Hủy
              </Button>
              <Button type="submit" variant="primary" isLoading={updatePostMutation.isPending}>
                <Save size={16} />
                <span>Lưu thay đổi</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
