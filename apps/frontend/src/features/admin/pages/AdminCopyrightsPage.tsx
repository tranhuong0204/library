import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api/client';
import { normalizeCopyright, normalizeDocument } from '@/lib/normalizers';
import { formatDate } from '@/lib/formatters';
import type { DocumentCopyrightItem, DocumentItem } from '@/types';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Eye, ShieldCheck, Search } from 'lucide-react';

const copyrightSchema = z.object({
  documentId: z.string().min(1, 'Vui lòng chọn tài liệu liên kết'),
  copyrightOwner: z.string().min(2, 'Chủ sở hữu bản quyền phải có tối thiểu 2 ký tự').max(255, 'Không vượt quá 255 ký tự'),
  author: z.string().max(255, 'Tên tác giả không vượt quá 255 ký tự').optional().default(''),
  licenseType: z.string().min(1, 'Vui lòng chọn loại giấy phép bản quyền'),
  certificateNumber: z.string().max(100, 'Số chứng nhận không vượt quá 100 ký tự').optional().default(''),
  registrationDate: z.string().optional().default(''),
  expirationDate: z.string().optional().default(''),
  terms: z.string().max(2000, 'Điều khoản không vượt quá 2000 ký tự').optional().default(''),
});

type CopyrightForm = z.infer<typeof copyrightSchema>;

const licenseOptions = [
  { value: 'COPYRIGHT', label: 'Bản quyền tác giả (Copyright - Đọc Online, cấm tải)' },
  { value: 'CREATIVE_COMMONS', label: 'Giấy phép Creative Commons (Cho phép tải & trích dẫn)' },
  { value: 'PUBLIC_DOMAIN', label: 'Miền công cộng (Public Domain - Tự do toàn quyền)' },
  { value: 'OPEN_ACCESS', label: 'Truy cập mở (Open Access - Tự do phi thương mại)' },
];

export default function AdminCopyrightsPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingCopyright, setEditingCopyright] = useState<DocumentCopyrightItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [viewingCopyright, setViewingCopyright] = useState<DocumentCopyrightItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Query: get list of copyrights
  const { data: copyrights = [], isLoading } = useQuery<DocumentCopyrightItem[]>({
    queryKey: ['admin', 'copyrights', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/copyrights');
      return (Array.isArray(res.data) ? res.data : []).map(normalizeCopyright);
    },
  });

  // Query: get documents for dropdown selection
  const { data: documents = [] } = useQuery<DocumentItem[]>({
    queryKey: ['admin', 'documents', 'dropdown'],
    queryFn: async () => {
      const res = await apiClient.get('/documents');
      return (Array.isArray(res.data) ? res.data : []).map(normalizeDocument);
    },
  });

  const documentOptions = useMemo(() => [
    { value: '', label: '-- Chọn tài liệu --' },
    ...documents.map((doc) => ({
      value: String(doc.id),
      label: `#${doc.id} - ${doc.title}`,
    })),
  ], [documents]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<CopyrightForm>({
    resolver: zodResolver(copyrightSchema),
    defaultValues: {
      documentId: '',
      copyrightOwner: '',
      author: '',
      licenseType: 'COPYRIGHT',
      certificateNumber: '',
      registrationDate: '',
      expirationDate: '',
      terms: '',
    },
  });

  // Filtered list based on search query
  const filteredCopyrights = useMemo(() => {
    if (!searchQuery.trim()) return copyrights;
    const term = searchQuery.toLowerCase().trim();
    return copyrights.filter((item) =>
      (item.documentTitle && item.documentTitle.toLowerCase().includes(term)) ||
      item.copyrightOwner.toLowerCase().includes(term) ||
      (item.author && item.author.toLowerCase().includes(term)) ||
      (item.certificateNumber && item.certificateNumber.toLowerCase().includes(term)) ||
      item.licenseType.toLowerCase().includes(term)
    );
  }, [copyrights, searchQuery]);

  // Mutation: Create
  const createMutation = useMutation({
    mutationFn: async (data: CopyrightForm) => {
      const payload = {
        documentId: Number(data.documentId),
        copyrightOwner: data.copyrightOwner,
        author: data.author || null,
        licenseType: data.licenseType,
        certificateNumber: data.certificateNumber || null,
        registrationDate: data.registrationDate ? `${data.registrationDate}T00:00:00` : null,
        expirationDate: data.expirationDate ? `${data.expirationDate}T00:00:00` : null,
        terms: data.terms || null,
      };
      const res = await apiClient.post('/copyrights', payload);
      return res.data;
    },
    onSuccess: () => {
      setIsOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['admin', 'copyrights', 'list'] });
      toast.success('Thêm hồ sơ bản quyền thành công!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Thêm hồ sơ bản quyền thất bại.');
    },
  });

  // Mutation: Update
  const updateMutation = useMutation({
    mutationFn: async (payload: { id: number; data: CopyrightForm }) => {
      const body = {
        documentId: Number(payload.data.documentId),
        copyrightOwner: payload.data.copyrightOwner,
        author: payload.data.author || null,
        licenseType: payload.data.licenseType,
        certificateNumber: payload.data.certificateNumber || null,
        registrationDate: payload.data.registrationDate ? `${payload.data.registrationDate}T00:00:00` : null,
        expirationDate: payload.data.expirationDate ? `${payload.data.expirationDate}T00:00:00` : null,
        terms: payload.data.terms || null,
      };
      const res = await apiClient.put(`/copyrights/${payload.id}`, body);
      return res.data;
    },
    onSuccess: () => {
      setIsOpen(false);
      setEditingCopyright(null);
      reset();
      queryClient.invalidateQueries({ queryKey: ['admin', 'copyrights', 'list'] });
      toast.success('Cập nhật hồ sơ bản quyền thành công!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Cập nhật hồ sơ bản quyền thất bại.');
    },
  });

  // Mutation: Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(`/copyrights/${id}`);
      return res.data;
    },
    onSuccess: () => {
      setIsDeleteOpen(false);
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'copyrights', 'list'] });
      toast.success('Xóa hồ sơ bản quyền thành công!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Xóa hồ sơ bản quyền thất bại.');
    },
  });

  const handleOpenCreate = () => {
    setEditingCopyright(null);
    reset({
      documentId: '',
      copyrightOwner: '',
      author: '',
      licenseType: 'COPYRIGHT',
      certificateNumber: '',
      registrationDate: '',
      expirationDate: '',
      terms: '',
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (item: DocumentCopyrightItem) => {
    setEditingCopyright(item);
    setValue('documentId', String(item.documentId));
    setValue('copyrightOwner', item.copyrightOwner);
    setValue('author', item.author || '');
    setValue('licenseType', item.licenseType);
    setValue('certificateNumber', item.certificateNumber || '');
    setValue('registrationDate', item.registrationDate ? item.registrationDate.substring(0, 10) : '');
    setValue('expirationDate', item.expirationDate ? item.expirationDate.substring(0, 10) : '');
    setValue('terms', item.terms || '');
    setIsOpen(true);
  };

  const handleOpenDelete = (id: number) => {
    setDeletingId(id);
    setIsDeleteOpen(true);
  };

  const onSubmit = (data: CopyrightForm) => {
    if (editingCopyright) {
      updateMutation.mutate({ id: editingCopyright.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getLicenseBadge = (license: string) => {
    switch (license) {
      case 'COPYRIGHT':
        return <Badge variant="warning">Bản quyền nghiêm ngặt</Badge>;
      case 'CREATIVE_COMMONS':
        return <Badge variant="success">Creative Commons</Badge>;
      case 'PUBLIC_DOMAIN':
        return <Badge variant="info">Miền công cộng</Badge>;
      case 'OPEN_ACCESS':
        return <Badge variant="primary">Truy cập mở</Badge>;
      default:
        return <Badge variant="accent">{license}</Badge>;
    }
  };

  const columns = [
    {
      header: 'Mã',
      accessor: (row: DocumentCopyrightItem) => <strong>#{row.id}</strong>,
      className: 'w-16',
    },
    {
      header: 'Tài liệu liên kết',
      accessor: (row: DocumentCopyrightItem) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <strong style={{ color: 'var(--color-primary-600)' }}>
            {row.documentTitle || `Tài liệu #${row.documentId}`}
          </strong>
          <span style={{ fontSize: '11px', color: 'var(--color-slate-400)' }}>Mã tài liệu: #{row.documentId}</span>
        </div>
      ),
    },
    {
      header: 'Chủ sở hữu & Tác giả',
      accessor: (row: DocumentCopyrightItem) => (
        <div>
          <div><strong>{row.copyrightOwner}</strong></div>
          {row.author && <span style={{ fontSize: '12px', color: 'var(--color-slate-500)' }}>Tác giả: {row.author}</span>}
        </div>
      ),
    },
    {
      header: 'Loại bản quyền',
      accessor: (row: DocumentCopyrightItem) => getLicenseBadge(row.licenseType),
      className: 'w-40',
    },
    {
      header: 'Số chứng nhận',
      accessor: (row: DocumentCopyrightItem) => (
        <code style={{ fontSize: '12px', background: 'var(--color-slate-100)', padding: '2px 6px', borderRadius: '4px' }}>
          {row.certificateNumber || 'Chưa cấp'}
        </code>
      ),
      className: 'w-36',
    },
    {
      header: 'Ngày đăng ký',
      accessor: (row: DocumentCopyrightItem) => <span>{row.registrationDate ? formatDate(row.registrationDate) : 'Chưa cập nhật'}</span>,
      className: 'w-28',
    },
    {
      header: 'Thao tác',
      accessor: (row: DocumentCopyrightItem) => (
        <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
          <button onClick={() => setViewingCopyright(row)} className="icon-btn" title="Xem chi tiết">
            <Eye size={16} />
          </button>
          <button onClick={() => handleOpenEdit(row)} className="icon-btn" title="Chỉnh sửa">
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleOpenDelete(row.id)}
            className="icon-btn"
            style={{ color: 'var(--color-danger-500)' }}
            title="Xóa hồ sơ"
          >
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
        title="Quản lý bản quyền tài liệu"
        description="Theo dõi quyền sở hữu trí tuệ, số chứng nhận đăng ký bản quyền, điều khoản cấp phép và hạn sử dụng tài liệu."
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--spacing-4)', gap: 'var(--spacing-4)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate-400)' }} />
          <Input
            placeholder="Tìm theo tài liệu, chủ sở hữu, số CN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
        <Button variant="primary" onClick={handleOpenCreate}>
          <Plus size={16} /> Thêm hồ sơ bản quyền
        </Button>
      </div>

      <div style={{ marginTop: 'var(--spacing-6)' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            <div className="skeleton-shimmer" style={{ height: '48px', borderRadius: 'var(--radius-sm)' }} />
            <div className="skeleton-shimmer" style={{ height: '48px', borderRadius: 'var(--radius-sm)' }} />
            <div className="skeleton-shimmer" style={{ height: '48px', borderRadius: 'var(--radius-sm)' }} />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredCopyrights}
            emptyMessage={searchQuery ? 'Không tìm thấy hồ sơ bản quyền phù hợp với từ khóa.' : 'Chưa có hồ sơ bản quyền nào trong hệ thống.'}
          />
        )}
      </div>

      {/* Dialog: Create / Edit Copyright */}
      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingCopyright ? 'Chỉnh sửa hồ sơ bản quyền' : 'Thêm hồ sơ bản quyền mới'}
      >
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '4px' }}>
              Tài liệu liên kết <span style={{ color: 'var(--color-danger-500)' }}>*</span>
            </label>
            <Select
              {...register('documentId')}
              options={documentOptions}
              error={errors.documentId?.message}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '4px' }}>
              Chủ sở hữu bản quyền <span style={{ color: 'var(--color-danger-500)' }}>*</span>
            </label>
            <Input
              {...register('copyrightOwner')}
              placeholder="VD: Nhà xuất bản Đại học Quốc gia, Tác giả..."
              error={errors.copyrightOwner?.message}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '4px' }}>
                Tác giả gốc
              </label>
              <Input
                {...register('author')}
                placeholder="VD: Ashish Vaswani, GS. Nguyễn Văn A..."
                error={errors.author?.message}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '4px' }}>
                Loại bản quyền <span style={{ color: 'var(--color-danger-500)' }}>*</span>
              </label>
              <Select
                {...register('licenseType')}
                options={licenseOptions}
                error={errors.licenseType?.message}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '4px' }}>
                Số chứng nhận đăng ký
              </label>
              <Input
                {...register('certificateNumber')}
                placeholder="VD: VN-COPYRIGHT-0001"
                error={errors.certificateNumber?.message}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '4px' }}>
                Ngày đăng ký
              </label>
              <Input
                type="date"
                {...register('registrationDate')}
                error={errors.registrationDate?.message}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '4px' }}>
              Ngày hết hạn (nếu có)
            </label>
            <Input
              type="date"
              {...register('expirationDate')}
              error={errors.expirationDate?.message}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '4px' }}>
              Điều khoản cấp phép & ghi chú
            </label>
            <Textarea
              {...register('terms')}
              rows={3}
              placeholder="VD: Bản quyền thuộc tác giả và đơn vị xuất bản. Cho phép sử dụng phục vụ mục đích nghiên cứu học tập..."
              error={errors.terms?.message}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-2)' }}>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
            >
              <ShieldCheck size={16} />
              {editingCopyright ? 'Lưu thay đổi' : 'Thêm hồ sơ bản quyền'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Dialog: View Details */}
      <Dialog
        isOpen={viewingCopyright !== null}
        onClose={() => setViewingCopyright(null)}
        title="Chi tiết hồ sơ bản quyền"
      >
        {viewingCopyright && (
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 'var(--spacing-4)', fontSize: 'var(--text-sm)' }}>
            <span style={{ color: 'var(--color-slate-500)' }}>Mã hồ sơ</span>
            <strong>#{viewingCopyright.id}</strong>

            <span style={{ color: 'var(--color-slate-500)' }}>Tài liệu</span>
            <strong>{viewingCopyright.documentTitle || `#${viewingCopyright.documentId}`}</strong>

            <span style={{ color: 'var(--color-slate-500)' }}>Chủ sở hữu</span>
            <strong>{viewingCopyright.copyrightOwner}</strong>

            <span style={{ color: 'var(--color-slate-500)' }}>Tác giả</span>
            <span>{viewingCopyright.author || 'Chưa cập nhật'}</span>

            <span style={{ color: 'var(--color-slate-500)' }}>Loại giấy phép</span>
            <div>{getLicenseBadge(viewingCopyright.licenseType)}</div>

            <span style={{ color: 'var(--color-slate-500)' }}>Số chứng nhận</span>
            <code>{viewingCopyright.certificateNumber || 'Chưa cấp'}</code>

            <span style={{ color: 'var(--color-slate-500)' }}>Ngày đăng ký</span>
            <span>{viewingCopyright.registrationDate ? formatDate(viewingCopyright.registrationDate) : 'Không có dữ liệu'}</span>

            <span style={{ color: 'var(--color-slate-500)' }}>Ngày hết hạn</span>
            <span>{viewingCopyright.expirationDate ? formatDate(viewingCopyright.expirationDate) : 'Vô thời hạn'}</span>

            <span style={{ color: 'var(--color-slate-500)' }}>Điều khoản sử dụng</span>
            <p style={{ margin: 0, whiteSpace: 'pre-line', lineHeight: 1.5, background: 'var(--color-slate-50)', padding: '8px 12px', borderRadius: '4px' }}>
              {viewingCopyright.terms || 'Theo quy định hiện hành của Thư viện số và Luật Sở hữu trí tuệ.'}
            </p>

            <span style={{ color: 'var(--color-slate-500)' }}>Cập nhật lần cuối</span>
            <span>{viewingCopyright.updatedAt ? new Date(viewingCopyright.updatedAt).toLocaleString('vi-VN') : 'Không có dữ liệu'}</span>
          </div>
        )}
      </Dialog>

      {/* Confirm Dialog: Delete */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => {
          if (deletingId) deleteMutation.mutate(deletingId);
        }}
        title="Xóa hồ sơ bản quyền"
        message="Bạn có chắc chắn muốn xóa hồ sơ bản quyền này không? Hành động này không thể hoàn tác."
        confirmText="Xóa vĩnh viễn"
        isDestructive
        isLoading={deleteMutation.isPending}
      />
    </AdminShell>
  );
}
