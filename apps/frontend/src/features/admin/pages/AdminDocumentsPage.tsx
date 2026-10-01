import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api/client';
import { normalizeDocument, normalizeCategory } from '@/lib/normalizers';
import { formatBytes, formatDate } from '@/lib/formatters';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { DataTable } from '@/components/ui/DataTable';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, BookOpen, Eye, Download } from 'lucide-react';

const documentSchema = z.object({
  title: z.string().min(3, 'Tiêu đề tài liệu phải có tối thiểu 3 ký tự').max(150, 'Tiêu đề không được vượt quá 150 ký tự'),
  author: z.string().max(100, 'Tên tác giả không vượt quá 100 ký tự').optional().default(''),
  description: z.string().max(1000, 'Mô tả không vượt quá 1000 ký tự').optional().default(''),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục tài liệu'),
});

type DocumentForm = z.infer<typeof documentSchema>;

interface DocumentDto {
  id: number;
  title: string;
  author: string;
  description: string;
  categoryId: number;
  categoryName: string;
  fileSize: number;
  fileType: string;
  viewCount: number;
  downloadCount: number;
  createdAt: string;
}

export default function AdminDocumentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentDto | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Custom states for file uploads
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Query: Get documents list
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['admin', 'documents', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/documents');
      return (Array.isArray(res.data) ? res.data : []).map(normalizeDocument);
    },
  });

  // Query: Get categories (for select options dropdown)
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/categories');
      return (Array.isArray(res.data) ? res.data : []).map(normalizeCategory);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DocumentForm>({
    resolver: zodResolver(documentSchema),
    defaultValues: { title: '', author: '', description: '', categoryId: '' },
  });

  // Mutation: Create Document (Multipart)
  const createMutation = useMutation({
    mutationFn: async (payload: { data: DocumentForm; pdf: File; cover: File | null }) => {
      const formData = new FormData();
      formData.append('title', payload.data.title);
      if (payload.data.author) formData.append('author', payload.data.author);
      if (payload.data.description) formData.append('description', payload.data.description);
      formData.append('categoryId', payload.data.categoryId);
      formData.append('document', payload.pdf);
      if (payload.cover) {
        formData.append('thumbnail', payload.cover);
      }

      const res = await apiClient.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      handleCloseModal();
      queryClient.invalidateQueries({ queryKey: ['admin', 'documents', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['documents', 'list'] });
      toast.success('Đăng tải tài liệu thành công!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Đăng tải tài liệu thất bại.');
    },
  });

  // Mutation: Update Document (Multipart)
  const updateMutation = useMutation({
    mutationFn: async (payload: { id: number; data: DocumentForm; pdf: File | null; cover: File | null }) => {
      const formData = new FormData();
      formData.append('title', payload.data.title);
      if (payload.data.author) formData.append('author', payload.data.author);
      if (payload.data.description) formData.append('description', payload.data.description);
      formData.append('categoryId', payload.data.categoryId);
      if (payload.pdf) {
        formData.append('document', payload.pdf);
      }
      if (payload.cover) {
        formData.append('thumbnail', payload.cover);
      }

      const res = await apiClient.put(`/documents/${payload.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      handleCloseModal();
      queryClient.invalidateQueries({ queryKey: ['admin', 'documents', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['documents', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['documents', 'detail'] });
      toast.success('Cập nhật tài liệu thành công!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Cập nhật tài liệu thất bại.');
    },
  });

  // Mutation: Delete Document
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/documents/${id}`);
    },
    onSuccess: () => {
      setIsDeleteOpen(false);
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'documents', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['documents', 'list'] });
      toast.success('Xóa tài liệu và dữ liệu vector AI thành công!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Xóa tài liệu thất bại.');
    },
  });

  const handleOpenCreate = () => {
    setEditingDoc(null);
    setPdfFile(null);
    setCoverImage(null);
    setFileError(null);
    reset({ title: '', author: '', description: '', categoryId: '' });
    setIsOpen(true);
  };

  const handleOpenEdit = (doc: DocumentDto) => {
    setEditingDoc(doc);
    setPdfFile(null);
    setCoverImage(null);
    setFileError(null);
    reset({
      title: doc.title,
      author: doc.author || '',
      description: doc.description || '',
      categoryId: String(doc.categoryId),
    });
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setEditingDoc(null);
    setPdfFile(null);
    setCoverImage(null);
    setFileError(null);
    reset();
  };

  const handleOpenDelete = (id: number) => {
    setDeletingId(id);
    setIsDeleteOpen(true);
  };

  const onSubmit = (data: DocumentForm) => {
    setFileError(null);

    // Document file is strictly required only when creating
    if (!editingDoc && !pdfFile) {
      setFileError('Vui lòng chọn tệp tài liệu PDF để đăng tải.');
      return;
    }

    if (editingDoc) {
      updateMutation.mutate({
        id: editingDoc.id,
        data,
        pdf: pdfFile,
        cover: coverImage,
      });
    } else {
      createMutation.mutate({
        data,
        pdf: pdfFile!,
        cover: coverImage,
      });
    }
  };

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

  const columns = [
    {
      header: 'Tiêu đề',
      accessor: (row: DocumentDto) => (
        <div className="admin-document-title-cell">
          <div className="admin-document-icon">
            <BookOpen size={18} />
          </div>
          <div className="admin-document-title-copy">
            <button
              type="button"
              onClick={() => navigate(`/admin/documents/${row.id}`)}
              className="admin-document-title-link"
              title="Xem chi tiết tài liệu"
            >
              {row.title}
            </button>
            <span className="admin-document-meta">
              Tác giả: {row.author || 'Chưa rõ'} | {formatBytes(row.fileSize)} ({row.fileType})
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Danh mục',
      accessor: (row: DocumentDto) => <span className="admin-document-category">{row.categoryName}</span>,
    },
    {
      header: 'Lượt xem/tải',
      accessor: (row: DocumentDto) => (
        <div className="admin-document-stats">
          <div title="Lượt xem">
            <Eye size={13} /> <span>{row.viewCount}</span>
          </div>
          <div title="Lượt tải">
            <Download size={13} /> <span>{row.downloadCount}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Ngày tải lên',
      accessor: (row: DocumentDto) => <span className="admin-document-date">{formatDate(row.createdAt)}</span>,
    },
    {
      header: 'Thao tác',
      accessor: (row: DocumentDto) => (
        <div className="admin-document-actions">
          <button onClick={() => navigate(`/admin/documents/${row.id}`)} className="icon-btn admin-document-action-view" aria-label="Xem chi tiết tài liệu" title="Xem chi tiết">
            <Eye size={16} />
          </button>
          <button onClick={() => handleOpenEdit(row)} className="icon-btn admin-document-action-edit" aria-label="Sửa tài liệu" title="Chỉnh sửa">
            <Edit size={16} />
          </button>
          <button onClick={() => handleOpenDelete(row.id)} className="icon-btn admin-document-action-delete" aria-label="Xóa tài liệu" title="Xóa">
            <Trash2 size={16} />
          </button>
        </div>
      ),
      className: 'admin-document-actions-column',
    },
  ];

  return (
    <AdminShell>
      <PageHeader
        title="Quản lý tài liệu"
        description="Đăng tải tệp tài liệu PDF, cập nhật bìa, phân loại và kiểm duyệt tài nguyên thư viện."
        actions={
          <Button variant="primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>Tải lên tài liệu mới</span>
          </Button>
        }
      />

      <div style={{ marginTop: 'var(--spacing-6)' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            <div className="skeleton-shimmer" style={{ height: '56px', borderRadius: 'var(--radius-sm)' }} />
            <div className="skeleton-shimmer" style={{ height: '56px', borderRadius: 'var(--radius-sm)' }} />
            <div className="skeleton-shimmer" style={{ height: '56px', borderRadius: 'var(--radius-sm)' }} />
          </div>
        ) : (
          <DataTable className="admin-documents-table" columns={columns} data={documents} emptyMessage="Chưa có tài liệu nào đăng tải." />
        )}
      </div>

      {/* Upload/Edit Modal */}
      <Dialog
        isOpen={isOpen}
        onClose={handleCloseModal}
        title={editingDoc ? 'Chỉnh sửa thông tin tài liệu' : 'Tải lên tài liệu mới'}
        maxWidth="600px"
      >
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
          <Input
            label="Tiêu đề tài liệu *"
            placeholder="Nhập tiêu đề tài liệu học tập..."
            error={errors.title?.message}
            disabled={createMutation.isPending || updateMutation.isPending}
            {...register('title')}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }} className="form-grid-split">
            <Input
              label="Tác giả"
              placeholder="Nhập tên tác giả..."
              error={errors.author?.message}
              disabled={createMutation.isPending || updateMutation.isPending}
              {...register('author')}
            />

            <Select
              label="Danh mục *"
              placeholder="Chọn danh mục phân loại..."
              options={categoryOptions}
              error={errors.categoryId?.message}
              disabled={createMutation.isPending || updateMutation.isPending}
              {...register('categoryId')}
            />
          </div>

          <Textarea
            label="Mô tả tóm tắt"
            placeholder="Nhập mô tả tóm tắt nội dung tài liệu..."
            error={errors.description?.message}
            disabled={createMutation.isPending || updateMutation.isPending}
            rows={3}
            {...register('description')}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }} className="form-grid-split">
            {/* PDF File Dropzone */}
            <FileDropzone
              onFileSelect={setPdfFile}
              accept=".pdf"
              maxSizeMB={50}
              label={editingDoc ? 'Thay thế tệp PDF (Tùy chọn)' : 'Tệp tài liệu PDF *'}
              error={fileError || undefined}
            />

            {/* Cover Image Dropzone */}
            <FileDropzone
              onFileSelect={setCoverImage}
              accept=".png,.jpg,.jpeg"
              maxSizeMB={5}
              label="Bìa tài liệu (Tùy chọn)"
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end', marginTop: 'var(--spacing-4)' }}>
            <Button
              variant="secondary"
              type="button"
              onClick={handleCloseModal}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending || updateMutation.isPending}>
              Lưu tài liệu
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Xác nhận xóa tài liệu"
        message="Bạn có chắc chắn muốn xóa tài liệu này? Thao tác này sẽ xóa tệp PDF lưu trữ và gỡ bỏ toàn bộ dữ liệu vector AI liên quan khỏi hệ thống."
        confirmText="Xóa tài liệu"
        isDestructive
        isLoading={deleteMutation.isPending}
      />

      <style>{`
        @media (max-width: 600px) {
          .form-grid-split {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </AdminShell>
  );
}
