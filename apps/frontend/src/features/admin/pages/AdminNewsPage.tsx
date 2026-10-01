import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api/client';
import { normalizeNews } from '@/lib/normalizers';
import { formatDate } from '@/lib/formatters';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Globe, FileText, Check } from 'lucide-react';

const newsSchema = z.object({
  title: z.string().min(5, 'Tiêu đề tin tức phải chứa tối thiểu 5 ký tự').max(150, 'Tiêu đề không được vượt quá 150 ký tự'),
  category: z.string().min(2, 'Vui lòng nhập chuyên mục tin tức (ví dụ: Thông báo, Sự kiện...)'),
  summary: z.string().min(10, 'Tóm tắt bài viết tối thiểu phải có 10 ký tự').max(255, 'Tóm tắt không được vượt quá 255 ký tự'),
  content: z.string().min(20, 'Nội dung chi tiết bài viết tối thiểu phải có 20 ký tự'),
  thumbnailUrl: z.string().url('Đường dẫn ảnh bìa không hợp lệ (phải bắt đầu bằng http/https)').or(z.literal('')),
  featured: z.boolean().default(false),
  status: z.enum(['DRAFT', 'PUBLISHED'], {
    required_error: 'Vui lòng chọn trạng thái bài viết',
  }),
});

type NewsForm = z.infer<typeof newsSchema>;

interface NewsDto {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  thumbnailUrl: string | null;
  category: string;
  featured: boolean;
  viewCount: number;
  status: 'DRAFT' | 'PUBLISHED';
  createdAt: string;
  updatedAt: string;
}

export default function AdminNewsPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsDto | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Query: Get all news (for admin, including drafts)
  const { data: newsList = [], isLoading } = useQuery({
    queryKey: ['admin', 'news', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/news');
      return (Array.isArray(res.data) ? res.data : []).map(normalizeNews);
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<NewsForm>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: '',
      category: '',
      summary: '',
      content: '',
      thumbnailUrl: '',
      featured: false,
      status: 'DRAFT',
    },
  });

  // Watch values for custom components like Switch
  const featuredValue = watch('featured');

  // Mutation: Create News
  const createMutation = useMutation({
    mutationFn: async (data: NewsForm) => {
      const res = await apiClient.post('/admin/news', data);
      return res.data;
    },
    onSuccess: () => {
      setIsOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['admin', 'news', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['news', 'published'] });
      toast.success('Đăng bài viết tin tức mới thành công!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Tạo bài viết thất bại.');
    },
  });

  // Mutation: Update News
  const updateMutation = useMutation({
    mutationFn: async (payload: { id: number; data: NewsForm }) => {
      const res = await apiClient.put(`/admin/news/${payload.id}`, payload.data);
      return res.data;
    },
    onSuccess: () => {
      setIsOpen(false);
      setEditingNews(null);
      reset();
      queryClient.invalidateQueries({ queryKey: ['admin', 'news', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['news', 'published'] });
      toast.success('Cập nhật bài viết thành công!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Cập nhật bài viết thất bại.');
    },
  });

  // Mutation: Delete News
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/admin/news/${id}`);
    },
    onSuccess: () => {
      setIsDeleteOpen(false);
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'news', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['news', 'published'] });
      toast.success('Xóa bài viết tin tức thành công!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Xóa bài viết thất bại.');
    },
  });

  const handleOpenCreate = () => {
    setEditingNews(null);
    reset({
      title: '',
      category: '',
      summary: '',
      content: '',
      thumbnailUrl: '',
      featured: false,
      status: 'DRAFT',
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (news: NewsDto) => {
    setEditingNews(news);
    reset({
      title: news.title,
      category: news.category,
      summary: news.summary,
      content: news.content,
      thumbnailUrl: news.thumbnailUrl || '',
      featured: news.featured,
      status: news.status,
    });
    setIsOpen(true);
  };

  const handleOpenDelete = (id: number) => {
    setDeletingId(id);
    setIsDeleteOpen(true);
  };

  const onSubmit = (data: NewsForm) => {
    if (editingNews) {
      updateMutation.mutate({ id: editingNews.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'PUBLISHED') {
      return (
        <Badge variant="success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Globe size={10} /> Công khai
        </Badge>
      );
    }
    return (
      <Badge variant="warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <FileText size={10} /> Bản nháp
      </Badge>
    );
  };

  const columns = [
    {
      header: 'Tin tức',
      accessor: (row: NewsDto) => (
        <div style={{ display: 'flex', gap: 'var(--spacing-3)', alignItems: 'center' }}>
          {row.thumbnailUrl ? (
            <img
              src={row.thumbnailUrl}
              alt=""
              style={{ width: '48px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--color-slate-200)' }}
            />
          ) : (
            <div style={{ width: '48px', height: '36px', borderRadius: '4px', backgroundColor: 'var(--color-slate-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
          )}
          <div>
            <span style={{ fontWeight: 700, display: 'block', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.title}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--color-slate-400)' }}>Chuyên mục: {row.category}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Nổi bật',
      accessor: (row: NewsDto) => (
        row.featured ? (
          <Badge variant="warning" style={{ gap: '2px' }}><Check size={10} /> Nổi bật</Badge>
        ) : (
          <span style={{ color: 'var(--color-slate-400)', fontSize: 'var(--text-xs)' }}>Không</span>
        )
      ),
      className: 'w-24',
    },
    {
      header: 'Trạng thái',
      accessor: (row: NewsDto) => getStatusBadge(row.status),
      className: 'w-28',
    },
    {
      header: 'Lượt xem',
      accessor: (row: NewsDto) => <span style={{ fontWeight: 600 }}>{row.viewCount} xem</span>,
      className: 'w-20',
    },
    {
      header: 'Ngày tạo',
      accessor: (row: NewsDto) => <span>{formatDate(row.createdAt)}</span>,
      className: 'w-28',
    },
    {
      header: 'Thao tác',
      accessor: (row: NewsDto) => (
        <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
          <button onClick={() => handleOpenEdit(row)} className="icon-btn" aria-label="Sửa bài viết">
            <Edit size={16} />
          </button>
          <button onClick={() => handleOpenDelete(row.id)} className="icon-btn" style={{ color: 'var(--color-danger-500)' }} aria-label="Xóa bài viết">
            <Trash2 size={16} />
          </button>
        </div>
      ),
      className: 'w-24',
    },
  ];

  const statusOptions = [
    { value: 'DRAFT', label: 'Bản nháp (Chỉ lưu trữ)' },
    { value: 'PUBLISHED', label: 'Công bố (Hiển thị trang chủ)' },
  ];

  return (
    <AdminShell>
      <PageHeader
        title="Quản lý tin tức và bản tin"
        description="Đăng bài viết mới, quản lý chuyên mục, sự kiện hoặc chuyển đổi trạng thái hiển thị của các bản tin khoa học LIBRARY."
        actions={
          <Button variant="primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>Viết tin tức mới</span>
          </Button>
        }
      />

      <div style={{ marginTop: 'var(--spacing-6)' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            <div className="skeleton-shimmer" style={{ height: '48px', borderRadius: 'var(--radius-sm)' }} />
            <div className="skeleton-shimmer" style={{ height: '48px', borderRadius: 'var(--radius-sm)' }} />
          </div>
        ) : (
          <DataTable columns={columns} data={newsList} emptyMessage="Chưa có tin tức nào được soạn thảo." />
        )}
      </div>

      {/* Create / Edit Dialog Modal */}
      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingNews ? 'Chỉnh sửa bài viết tin tức' : 'Viết tin tức / sự kiện mới'}
        maxWidth="800px"
      >
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-4)' }}>
            <Input
              label="Tiêu đề bài viết *"
              placeholder="Nhập tiêu đề tin tức, thông báo..."
              error={errors.title?.message}
              disabled={createMutation.isPending || updateMutation.isPending}
              {...register('title')}
            />

            <Input
              label="Chuyên mục *"
              placeholder="Ví dụ: Thông báo, Sự kiện, Học tập..."
              error={errors.category?.message}
              disabled={createMutation.isPending || updateMutation.isPending}
              {...register('category')}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-4)' }}>
            <Input
              label="Đường dẫn hình ảnh bìa (Thumbnail URL)"
              placeholder="Đường dẫn ảnh bìa (http/https)..."
              error={errors.thumbnailUrl?.message}
              disabled={createMutation.isPending || updateMutation.isPending}
              {...register('thumbnailUrl')}
            />

            <Select
              label="Trạng thái *"
              placeholder="Chọn trạng thái..."
              options={statusOptions}
              error={errors.status?.message}
              disabled={createMutation.isPending || updateMutation.isPending}
              {...register('status')}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--spacing-3) var(--spacing-4)',
              backgroundColor: 'var(--color-slate-50)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-slate-200)',
            }}
          >
            <div>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-primary-950)', display: 'block' }}>
                Tin tức nổi bật (Featured Banner)
              </span>
              <span style={{ fontSize: '10px', color: 'var(--color-slate-500)' }}>
                Đưa bài đăng này hiển thị dạng Banner lớn tại đầu trang chủ tin tức.
              </span>
            </div>
            <Switch
              checked={featuredValue}
              onChange={(e) => setValue('featured', e.target.checked)}
              disabled={createMutation.isPending || updateMutation.isPending}
            />
          </div>

          <Input
            label="Mô tả tóm tắt ngắn (Summary) *"
            placeholder="Nhập tóm tắt ngắn hiển thị trên thẻ card (tối đa 255 ký tự)..."
            error={errors.summary?.message}
            disabled={createMutation.isPending || updateMutation.isPending}
            {...register('summary')}
          />

          <Textarea
            label="Nội dung chi tiết bài viết (Hỗ trợ Markdown) *"
            placeholder="Nhập nội dung tin tức, thông tin sự kiện chi tiết..."
            error={errors.content?.message}
            disabled={createMutation.isPending || updateMutation.isPending}
            rows={12}
            {...register('content')}
          />

          <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end', marginTop: 'var(--spacing-4)' }}>
            <Button variant="secondary" type="button" onClick={() => setIsOpen(false)} disabled={createMutation.isPending || updateMutation.isPending}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending || updateMutation.isPending}>
              Lưu bài viết
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete news confirm dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Xác nhận xóa bài viết"
        message="Bạn có chắc chắn muốn xóa bài viết tin tức này? Thao tác này sẽ gỡ bài viết vĩnh viễn khỏi toàn bộ hệ thống hiển thị và không thể phục hồi."
        confirmText="Xóa bài viết"
        isDestructive
        isLoading={deleteMutation.isPending}
      />
    </AdminShell>
  );
}
