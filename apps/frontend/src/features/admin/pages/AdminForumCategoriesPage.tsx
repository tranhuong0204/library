import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api/client';
import { normalizeForumCategory, normalizeForumPost } from '@/lib/normalizers';
import type { ForumPost } from '@/types';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { DataTable } from '@/components/ui/DataTable';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';

const forumCategorySchema = z.object({
  name: z.string().min(2, 'Tên chủ đề phải chứa tối thiểu 2 ký tự').max(100, 'Tên không vượt quá 100 ký tự'),
  description: z.string().max(255, 'Mô tả không vượt quá 255 ký tự').default(''),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Mã màu phải ở định dạng Hex (ví dụ: #4f46e5)').default('#4f46e5'),
});

type ForumCategoryForm = z.infer<typeof forumCategorySchema>;

interface ForumCategoryDto {
  id: number;
  name: string;
  description: string;
  color?: string;
}

export default function AdminForumCategoriesPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ForumCategoryDto | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [viewingCategory, setViewingCategory] = useState<ForumCategoryDto | null>(null);

  // Query: Get forum categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin', 'forum', 'categories', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/forum/categories');
      return (Array.isArray(res.data) ? res.data : []).map(normalizeForumCategory);
    },
  });

  const { data: categoryPosts = [], isLoading: isPostsLoading } = useQuery<ForumPost[]>({
    queryKey: ['admin', 'forum', 'categories', viewingCategory?.id, 'posts'],
    queryFn: async () => {
      const res = await apiClient.get('/forum/posts', { params: { categoryId: viewingCategory!.id } });
      return (Array.isArray(res.data) ? res.data : []).map(normalizeForumPost);
    },
    enabled: viewingCategory !== null,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForumCategoryForm>({
    resolver: zodResolver(forumCategorySchema),
    defaultValues: { name: '', description: '', color: '#4f46e5' },
  });

  // Mutation: Create Category
  const createMutation = useMutation({
    mutationFn: async (data: ForumCategoryForm) => {
      const res = await apiClient.post('/forum/categories', data);
      return res.data;
    },
    onSuccess: () => {
      setIsOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['admin', 'forum', 'categories', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'categories'] });
      toast.success('Tạo chủ đề diễn đàn mới thành công!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Tạo chủ đề thất bại.');
    },
  });

  // Mutation: Update Category
  const updateMutation = useMutation({
    mutationFn: async (payload: { id: number; data: ForumCategoryForm }) => {
      const res = await apiClient.put(`/forum/categories/${payload.id}`, payload.data);
      return res.data;
    },
    onSuccess: () => {
      setIsOpen(false);
      setEditingCategory(null);
      reset();
      queryClient.invalidateQueries({ queryKey: ['admin', 'forum', 'categories', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'categories'] });
      toast.success('Cập nhật chủ đề diễn đàn thành công!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Cập nhật chủ đề thất bại.');
    },
  });

  // Mutation: Delete Category
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/forum/categories/${id}`);
    },
    onSuccess: () => {
      setIsDeleteOpen(false);
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'forum', 'categories', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'categories'] });
      toast.success('Xóa chủ đề diễn đàn thành công!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Xóa chủ đề thất bại. Có thể đang tồn tại bài viết trong chủ đề này.');
    },
  });

  const handleOpenCreate = () => {
    setEditingCategory(null);
    reset({ name: '', description: '', color: '#4f46e5' });
    setIsOpen(true);
  };

  const handleOpenEdit = (category: ForumCategoryDto) => {
    setEditingCategory(category);
    reset({
      name: category.name,
      description: category.description || '',
      color: category.color || '#4f46e5',
    });
    setIsOpen(true);
  };

  const handleOpenDelete = (id: number) => {
    setDeletingId(id);
    setIsDeleteOpen(true);
  };

  const onSubmit = (data: ForumCategoryForm) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    {
      header: 'Mã số',
      accessor: (row: ForumCategoryDto) => <strong>#{row.id}</strong>,
      className: 'w-16',
    },
    {
      header: 'Chủ đề',
      accessor: (row: ForumCategoryDto) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: row.color || 'var(--color-primary-500)',
            }}
          />
          <button
            type="button"
            onClick={() => setViewingCategory(row)}
            style={{ fontWeight: 600, color: 'var(--color-primary-700)', textAlign: 'left' }}
            title="Xem bài viết thuộc chủ đề"
          >
            {row.name}
          </button>
        </div>
      ),
    },
    {
      header: 'Mô tả',
      accessor: (row: ForumCategoryDto) => <span style={{ color: 'var(--color-slate-500)' }}>{row.description || 'Không có mô tả'}</span>,
    },
    {
      header: 'Thao tác',
      accessor: (row: ForumCategoryDto) => (
        <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
          <button onClick={() => setViewingCategory(row)} className="icon-btn" aria-label="Xem bài viết thuộc chủ đề" title="Xem bài viết">
            <Eye size={16} />
          </button>
          <button onClick={() => handleOpenEdit(row)} className="icon-btn" aria-label="Sửa chủ đề">
            <Edit size={16} />
          </button>
          <button onClick={() => handleOpenDelete(row.id)} className="icon-btn" style={{ color: 'var(--color-danger-500)' }} aria-label="Xóa chủ đề">
            <Trash2 size={16} />
          </button>
        </div>
      ),
      className: 'w-24',
    },
  ];

  return (
    <AdminShell>
      <PageHeader
        title="Quản lý chủ đề diễn đàn"
        description="Đăng ký, thiết lập, phân loại và cập nhật mã màu các chủ đề thảo luận trên diễn đàn LIBRARY."
        actions={
          <Button variant="primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>Tạo chủ đề mới</span>
          </Button>
        }
      />

      <div style={{ marginTop: 'var(--spacing-6)' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            <div className="skeleton-shimmer" style={{ height: '48px', borderRadius: 'var(--radius-sm)' }} />
            <div className="skeleton-shimmer" style={{ height: '48px', borderRadius: 'var(--radius-sm)' }} />
            <div className="skeleton-shimmer" style={{ height: '48px', borderRadius: 'var(--radius-sm)' }} />
          </div>
        ) : (
          <DataTable columns={columns} data={categories} emptyMessage="Chưa có chủ đề diễn đàn nào." />
        )}
      </div>

      <Dialog
        isOpen={viewingCategory !== null}
        onClose={() => setViewingCategory(null)}
        title={`Bài viết thuộc chủ đề: ${viewingCategory?.name || ''}`}
        maxWidth="760px"
      >
        {isPostsLoading ? (
          <div className="skeleton-shimmer" style={{ height: '180px', borderRadius: 'var(--radius-sm)' }} />
        ) : categoryPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--color-slate-500)' }}>
            Chủ đề này chưa có bài viết.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)', maxHeight: '60vh', overflowY: 'auto' }}>
            {categoryPosts.map((post) => (
              <div key={post.id} style={{ padding: 'var(--spacing-4)', border: '1px solid var(--color-slate-200)', borderRadius: 'var(--radius-sm)' }}>
                <strong style={{ color: 'var(--color-primary-800)' }}>{post.title}</strong>
                <div style={{ marginTop: '4px', fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)' }}>
                  Đăng bởi {post.authorName || 'Thành viên'} · {post.viewCount} lượt xem · {post.commentCount} bình luận
                </div>
                {post.content && (
                  <p style={{ margin: '8px 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-slate-600)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {post.content}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Dialog>

      {/* Create / Edit Dialog */}
      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingCategory ? 'Chỉnh sửa chủ đề diễn đàn' : 'Tạo chủ đề diễn đàn mới'}
      >
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <Input
            label="Tên chủ đề *"
            placeholder="Nhập tên chủ đề thảo luận..."
            error={errors.name?.message}
            disabled={createMutation.isPending || updateMutation.isPending}
            {...register('name')}
          />

          <Input
            label="Mã màu Hex *"
            placeholder="Mã màu HEX (Ví dụ: #4f46e5)..."
            error={errors.color?.message}
            disabled={createMutation.isPending || updateMutation.isPending}
            {...register('color')}
          />

          <Textarea
            label="Mô tả chủ đề"
            placeholder="Nhập mô tả tóm tắt..."
            error={errors.description?.message}
            disabled={createMutation.isPending || updateMutation.isPending}
            {...register('description')}
          />

          <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end', marginTop: 'var(--spacing-4)' }}>
            <Button variant="secondary" type="button" onClick={() => setIsOpen(false)} disabled={createMutation.isPending || updateMutation.isPending}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending || updateMutation.isPending}>
              Lưu chủ đề
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Xác nhận xóa chủ đề"
        message="Bạn có chắc chắn muốn xóa chủ đề diễn đàn này? Thao tác này không thể hoàn tác và chỉ thực hiện được nếu không có bài thảo luận nào thuộc chủ đề này."
        confirmText="Xóa chủ đề"
        isDestructive
        isLoading={deleteMutation.isPending}
      />
    </AdminShell>
  );
}
