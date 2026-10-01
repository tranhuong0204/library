import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api/client';
import { normalizeCategory, normalizeDocument } from '@/lib/normalizers';
import type { DocumentItem } from '@/types';
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

const categorySchema = z.object({
  name: z.string().min(2, 'Tên danh mục phải chứa tối thiểu 2 ký tự').max(100, 'Tên danh mục không được vượt quá 100 ký tự'),
  description: z.string().max(255, 'Mô tả không được vượt quá 255 ký tự').default(''),
});

type CategoryForm = z.infer<typeof categorySchema>;

interface CategoryDto {
  id: number;
  name: string;
  description: string;
}

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [viewingCategory, setViewingCategory] = useState<CategoryDto | null>(null);

  // Query: get list of categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin', 'categories', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/categories');
      return (Array.isArray(res.data) ? res.data : []).map(normalizeCategory);
    },
  });

  const { data: categoryDocuments = [], isLoading: isDocumentsLoading } = useQuery<DocumentItem[]>({
    queryKey: ['admin', 'categories', viewingCategory?.id, 'documents'],
    queryFn: async () => {
      const res = await apiClient.get('/documents', { params: { categoryId: viewingCategory!.id } });
      return (Array.isArray(res.data) ? res.data : []).map(normalizeDocument);
    },
    enabled: viewingCategory !== null,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '' },
  });

  // Mutation: Create Category
  const createMutation = useMutation({
    mutationFn: async (data: CategoryForm) => {
      const res = await apiClient.post('/categories', data);
      return res.data;
    },
    onSuccess: () => {
      setIsOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'list'] });
      toast.success('Tạo danh mục mới thành công!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Tạo danh mục thất bại.');
    },
  });

  // Mutation: Update Category
  const updateMutation = useMutation({
    mutationFn: async (payload: { id: number; data: CategoryForm }) => {
      const res = await apiClient.put(`/categories/${payload.id}`, payload.data);
      return res.data;
    },
    onSuccess: () => {
      setIsOpen(false);
      setEditingCategory(null);
      reset();
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'list'] });
      toast.success('Cập nhật danh mục thành công!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Cập nhật danh mục thất bại.');
    },
  });

  // Mutation: Delete Category
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      setIsDeleteOpen(false);
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'list'] });
      toast.success('Xóa danh mục thành công!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Xóa danh mục thất bại. Danh mục có thể đang chứa tài liệu.');
    },
  });

  const handleOpenCreate = () => {
    setEditingCategory(null);
    reset({ name: '', description: '' });
    setIsOpen(true);
  };

  const handleOpenEdit = (category: CategoryDto) => {
    setEditingCategory(category);
    reset({ name: category.name, description: category.description || '' });
    setIsOpen(true);
  };

  const handleOpenDelete = (id: number) => {
    setDeletingId(id);
    setIsDeleteOpen(true);
  };

  const onSubmit = (data: CategoryForm) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    {
      header: 'Mã số',
      accessor: (row: CategoryDto) => <strong>#{row.id}</strong>,
      className: 'w-16',
    },
    {
      header: 'Tên danh mục',
      accessor: (row: CategoryDto) => (
        <button
          type="button"
          onClick={() => setViewingCategory(row)}
          style={{ fontWeight: 600, color: 'var(--color-primary-700)', textAlign: 'left' }}
          title="Xem tài liệu thuộc danh mục"
        >
          {row.name}
        </button>
      ),
    },
    {
      header: 'Mô tả',
      accessor: (row: CategoryDto) => <span style={{ color: 'var(--color-slate-500)' }}>{row.description || 'Không có mô tả'}</span>,
    },
    {
      header: 'Thao tác',
      accessor: (row: CategoryDto) => (
        <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
          <button onClick={() => setViewingCategory(row)} className="icon-btn" aria-label="Xem tài liệu thuộc danh mục" title="Xem tài liệu">
            <Eye size={16} />
          </button>
          <button onClick={() => handleOpenEdit(row)} className="icon-btn" aria-label="Sửa danh mục">
            <Edit size={16} />
          </button>
          <button onClick={() => handleOpenDelete(row.id)} className="icon-btn" style={{ color: 'var(--color-danger-500)' }} aria-label="Xóa danh mục">
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
        title="Quản lý danh mục tài liệu"
        description="Đăng ký, thiết lập và phân loại các chủ đề tài liệu học tập trong thư viện LIBRARY."
        actions={
          <Button variant="primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>Tạo danh mục mới</span>
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
          <DataTable columns={columns} data={categories} emptyMessage="Chưa có danh mục tài liệu nào." />
        )}
      </div>

      <Dialog
        isOpen={viewingCategory !== null}
        onClose={() => setViewingCategory(null)}
        title={`Tài liệu thuộc danh mục: ${viewingCategory?.name || ''}`}
        maxWidth="760px"
      >
        {isDocumentsLoading ? (
          <div className="skeleton-shimmer" style={{ height: '180px', borderRadius: 'var(--radius-sm)' }} />
        ) : categoryDocuments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--color-slate-500)' }}>
            Danh mục này chưa có tài liệu.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)', maxHeight: '60vh', overflowY: 'auto' }}>
            {categoryDocuments.map((document) => (
              <div key={document.id} style={{ padding: 'var(--spacing-4)', border: '1px solid var(--color-slate-200)', borderRadius: 'var(--radius-sm)' }}>
                <strong style={{ color: 'var(--color-primary-800)' }}>{document.title}</strong>
                <div style={{ marginTop: '4px', fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)' }}>
                  Tác giả: {document.author || 'Chưa rõ'} · {document.viewCount} lượt xem · {document.downloadCount} lượt tải
                </div>
                {document.description && (
                  <p style={{ margin: '8px 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-slate-600)', lineHeight: 1.5 }}>
                    {document.description}
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
        title={editingCategory ? 'Chỉnh sửa danh mục' : 'Tạo danh mục tài liệu mới'}
      >
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <Input
            label="Tên danh mục"
            placeholder="Nhập tên danh mục..."
            error={errors.name?.message}
            disabled={createMutation.isPending || updateMutation.isPending}
            {...register('name')}
          />

          <Textarea
            label="Mô tả danh mục"
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
              Lưu danh mục
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Xác nhận xóa danh mục"
        message="Bạn có chắc chắn muốn xóa danh mục này? Thao tác này không thể hoàn tác và chỉ có thể thực hiện nếu danh mục trống (không chứa tài liệu)."
        confirmText="Xóa danh mục"
        isDestructive
        isLoading={deleteMutation.isPending}
      />
    </AdminShell>
  );
}
