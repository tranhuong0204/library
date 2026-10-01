import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { normalizeForumPost, normalizeForumReport } from '@/lib/normalizers';
import { formatDate } from '@/lib/formatters';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Textarea } from '@/components/ui/Textarea';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { toast } from 'sonner';
import { AlertOctagon, CheckCircle2, Eye, XCircle, Trash2, ShieldAlert } from 'lucide-react';

interface ReportDto {
  id: number;
  reportId: number;
  postId: number;
  postTitle: string;
  postContentPreview: string;
  targetType: 'POST' | 'COMMENT';
  targetId: number;
  commentId: number | null;
  parentPostId: number | null;
  commentContentPreview: string;
  reporterId: number;
  reporterUsername: string;
  reason: string;
  description: string;
  status: 'PENDING' | 'RESOLVED' | 'REJECTED';
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  adminNote: string | null;
}

export default function AdminForumPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('ALL');

  // Action Dialogs states
  const [selectedReport, setSelectedReport] = useState<ReportDto | null>(null);
  const [resolveAction, setResolveAction] = useState<'RESOLVE' | 'REJECT' | null>(null);
  const [adminNoteText, setAdminNoteText] = useState('');
  const [isNoteOpen, setIsNoteOpen] = useState(false);

  // Delete reported content state
  const [deletingReport, setDeletingReport] = useState<ReportDto | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [viewingReport, setViewingReport] = useState<ReportDto | null>(null);

  // Query: Get reports list & statistics
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'forum', 'reports', activeTab],
    queryFn: async () => {
      const statusParam = activeTab === 'ALL' ? '' : `?status=${activeTab}`;
      const res = await apiClient.get(`/admin/forum/reports${statusParam}`);
      
      const rawReports = Array.isArray(res.data?.reports) ? res.data.reports : [];
      return {
        reports: rawReports.map(normalizeForumReport),
        totalReports: res.data?.totalReports || 0,
        pendingReports: res.data?.pendingReports || 0,
        resolvedReports: res.data?.resolvedReports || 0,
        rejectedReports: res.data?.rejectedReports || 0,
      };
    },
  });

  const reportsList = data?.reports || [];

  const viewedPostId = viewingReport?.targetType === 'COMMENT'
    ? viewingReport.parentPostId
    : viewingReport?.postId;
  const { data: viewedPost, isLoading: isViewingContent, isError: isViewingContentError } = useQuery({
    queryKey: ['admin', 'forum', 'content-preview', viewedPostId],
    queryFn: async () => {
      const response = await apiClient.get(`/forum/posts/${viewedPostId}`);
      return normalizeForumPost(response.data);
    },
    enabled: viewingReport !== null && viewedPostId != null,
  });
  const viewedComment = viewingReport?.targetType === 'COMMENT'
    ? viewedPost?.comments.find((comment) => comment.id === viewingReport.commentId)
    : null;

  // Mutation: Resolve Report
  const resolveMutation = useMutation({
    mutationFn: async (payload: { reportId: number; note: string }) => {
      await apiClient.put(`/admin/forum/reports/${payload.reportId}/resolve`, {
        adminNote: payload.note,
      });
    },
    onSuccess: () => {
      setIsNoteOpen(false);
      setSelectedReport(null);
      setAdminNoteText('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'forum', 'reports'] });
      toast.success('Đã giải quyết báo cáo vi phạm.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Thao tác giải quyết báo cáo thất bại.');
    },
  });

  // Mutation: Reject Report
  const rejectMutation = useMutation({
    mutationFn: async (payload: { reportId: number; note: string }) => {
      await apiClient.put(`/admin/forum/reports/${payload.reportId}/reject`, {
        adminNote: payload.note,
      });
    },
    onSuccess: () => {
      setIsNoteOpen(false);
      setSelectedReport(null);
      setAdminNoteText('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'forum', 'reports'] });
      toast.success('Đã từ chối báo cáo vi phạm.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Thao tác từ chối báo cáo thất bại.');
    },
  });

  // Mutation: Delete reported post or comment
  const deleteContentMutation = useMutation({
    mutationFn: async (report: ReportDto) => {
      const endpoint = report.targetType === 'COMMENT'
        ? `/admin/forum/comments/${report.commentId}?reportId=${report.id}`
        : `/admin/forum/posts/${report.postId}?reportId=${report.id}`;
      await apiClient.delete(endpoint);
    },
    onSuccess: () => {
      setIsDeleteOpen(false);
      setDeletingReport(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'forum', 'reports'] });
      toast.success('Đã xóa nội dung vi phạm và tự động xử lý báo cáo!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Xóa nội dung vi phạm thất bại.');
    },
  });

  const handleOpenAction = (report: ReportDto, action: 'RESOLVE' | 'REJECT') => {
    setSelectedReport(report);
    setResolveAction(action);
    setAdminNoteText('');
    setIsNoteOpen(true);
  };

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !resolveAction) return;

    if (resolveAction === 'RESOLVE') {
      resolveMutation.mutate({ reportId: selectedReport.id, note: adminNoteText });
    } else {
      rejectMutation.mutate({ reportId: selectedReport.id, note: adminNoteText });
    }
  };

  const handleOpenDelete = (report: ReportDto) => {
    setDeletingReport(report);
    setIsDeleteOpen(true);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'PENDING') return <Badge variant="warning">Chờ xử lý</Badge>;
    if (status === 'RESOLVED') return <Badge variant="success">Đã giải quyết</Badge>;
    return <Badge variant="danger">Từ chối</Badge>;
  };

  const columns = [
    {
      header: 'Nội dung bị báo cáo',
      accessor: (row: ReportDto) => (
        <div>
          <Badge variant={row.targetType === 'COMMENT' ? 'info' : 'primary'}>
            {row.targetType === 'COMMENT' ? 'Bình luận' : 'Bài viết'}
          </Badge>
          <button
            type="button"
            onClick={() => setViewingReport(row)}
            style={{ display: 'block', padding: 0, border: 0, background: 'none', cursor: 'pointer', fontWeight: 700, color: 'var(--color-primary-700)', textDecoration: 'underline', textAlign: 'left' }}
          >
            {row.postTitle || 'Nội dung diễn đàn'}
          </button>
          <p style={{ fontSize: '10px', color: 'var(--color-slate-400)', margin: '2px 0 0 0', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Nội dung: {row.targetType === 'COMMENT' ? row.commentContentPreview : row.postContentPreview || 'Không có mô tả xem trước'}
          </p>
        </div>
      ),
    },
    {
      header: 'Người báo cáo',
      accessor: (row: ReportDto) => <span style={{ fontWeight: 600 }}>@{row.reporterUsername}</span>,
    },
    {
      header: 'Lý do & Mô tả',
      accessor: (row: ReportDto) => (
        <div>
          <span style={{ fontWeight: 600, fontSize: 'var(--text-xs)' }}>{row.reason}</span>
          {row.description && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)', margin: '2px 0 0 0' }}>
              {row.description}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Trạng thái',
      accessor: (row: ReportDto) => getStatusBadge(row.status),
    },
    {
      header: 'Ngày báo cáo',
      accessor: (row: ReportDto) => <span>{formatDate(row.createdAt)}</span>,
    },
    {
      header: 'Thao tác',
      accessor: (row: ReportDto) => (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(136px, 1fr))',
            gap: 'var(--spacing-2)',
            width: '100%',
            minWidth: 280,
          }}
        >
          {row.status === 'PENDING' ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setViewingReport(row)}
                style={{ width: '100%' }}
              >
                <Eye size={14} /> Xem nội dung
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleOpenDelete(row)}
                style={{ width: '100%' }}
              >
                <Trash2 size={14} /> Xóa {row.targetType === 'COMMENT' ? 'bình luận' : 'bài viết'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenAction(row, 'RESOLVE')}
                style={{ width: '100%' }}
              >
                <CheckCircle2 size={14} /> Đánh dấu xử lý
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleOpenAction(row, 'REJECT')}
                style={{ width: '100%' }}
              >
                <XCircle size={14} /> Bỏ qua
              </Button>
            </>
          ) : (
            <span style={{ fontSize: '10px', color: 'var(--color-slate-400)' }}>
              {row.resolvedBy ? `Xử lý bởi @${row.resolvedBy}` : 'Đã khóa'}
            </span>
          )}
        </div>
      ),
      className: 'w-28',
    },
  ];

  return (
    <AdminShell>
      <PageHeader
        title="Quản lý vi phạm Diễn đàn"
        description="Xem, kiểm duyệt và xóa bài viết hoặc bình luận bị báo cáo vi phạm tiêu chuẩn cộng đồng."
      />

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--spacing-4)',
          marginBottom: 'var(--spacing-6)',
        }}
      >
        <StatCard
          value={data?.totalReports || 0}
          label="Tổng số báo cáo"
          icon={<ShieldAlert size={24} />}
          iconBgColor="var(--color-slate-100)"
          iconColor="var(--color-slate-600)"
        />
        <StatCard
          value={data?.pendingReports || 0}
          label="Báo cáo chưa xử lý"
          icon={<AlertOctagon size={24} />}
          iconBgColor="var(--color-warning-50)"
          iconColor="var(--color-warning-600)"
        />
        <StatCard
          value={data?.resolvedReports || 0}
          label="Đã giải quyết"
          icon={<CheckCircle2 size={24} />}
          iconBgColor="var(--color-success-50)"
          iconColor="var(--color-success-600)"
        />
        <StatCard
          value={data?.rejectedReports || 0}
          label="Đã bác bỏ/bỏ qua"
          icon={<XCircle size={24} />}
          iconBgColor="var(--color-danger-50)"
          iconColor="var(--color-danger-600)"
        />
      </div>

      {/* Navigation Filter Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-slate-200)', gap: 'var(--spacing-6)', marginBottom: 'var(--spacing-6)' }}>
        <button
          onClick={() => setActiveTab('ALL')}
          className={`tab-btn-f ${activeTab === 'ALL' ? 'tab-btn-f-active' : ''}`}
        >
          Tất cả báo cáo
        </button>
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`tab-btn-f ${activeTab === 'PENDING' ? 'tab-btn-f-active' : ''}`}
        >
          Chưa xử lý
        </button>
        <button
          onClick={() => setActiveTab('RESOLVED')}
          className={`tab-btn-f ${activeTab === 'RESOLVED' ? 'tab-btn-f-active' : ''}`}
        >
          Đã giải quyết
        </button>
        <button
          onClick={() => setActiveTab('REJECTED')}
          className={`tab-btn-f ${activeTab === 'REJECTED' ? 'tab-btn-f-active' : ''}`}
        >
          Đã bác bỏ
        </button>
      </div>

      {/* Reports Table Grid */}
      <div>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            <div className="skeleton-shimmer" style={{ height: '56px', borderRadius: 'var(--radius-sm)' }} />
            <div className="skeleton-shimmer" style={{ height: '56px', borderRadius: 'var(--radius-sm)' }} />
          </div>
        ) : (
          <DataTable columns={columns} data={reportsList} emptyMessage="Không có báo cáo vi phạm nào khớp bộ lọc." />
        )}
      </div>

      <Dialog
        isOpen={viewingReport !== null}
        onClose={() => setViewingReport(null)}
        title={viewingReport?.targetType === 'COMMENT' ? 'Xem bình luận bị báo cáo' : 'Xem bài viết bị báo cáo'}
        maxWidth="820px"
        footer={viewingReport?.status === 'PENDING' ? (
          <>
            <Button variant="secondary" onClick={() => setViewingReport(null)}>Đóng</Button>
            <Button
              variant="danger"
              onClick={() => {
                const report = viewingReport;
                setViewingReport(null);
                if (report) handleOpenDelete(report);
              }}
            >
              <Trash2 size={15} /> Xóa {viewingReport.targetType === 'COMMENT' ? 'bình luận' : 'bài viết'}
            </Button>
          </>
        ) : <Button variant="secondary" onClick={() => setViewingReport(null)}>Đóng</Button>}
      >
        {isViewingContent ? (
          <div className="page-loader" role="status">Đang tải nội dung...</div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
            <div style={{ padding: 'var(--spacing-3)', borderRadius: 'var(--radius-sm)', background: 'var(--color-warning-50)' }}>
              <strong>Lý do báo cáo:</strong> {viewingReport?.reason}
              {viewingReport?.description && <p style={{ margin: '6px 0 0' }}>{viewingReport.description}</p>}
            </div>

            <div style={{ padding: 'var(--spacing-4)', border: '1px solid var(--color-slate-200)', borderRadius: 'var(--radius-sm)' }}>
              <Badge variant="primary">Bài viết gốc</Badge>
              <h3 style={{ margin: '10px 0 4px', color: 'var(--color-primary-950)' }}>{viewedPost?.title || viewingReport?.postTitle}</h3>
              {viewedPost && <small>Đăng bởi {viewedPost.authorName} · {formatDate(viewedPost.createdAt)}</small>}
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.65, marginBottom: 0 }}>
                {viewedPost?.content || viewingReport?.postContentPreview || 'Nội dung bài viết không còn tồn tại.'}
              </p>
            </div>

            {viewingReport?.targetType === 'COMMENT' && (
              <div style={{ padding: 'var(--spacing-4)', border: '2px solid var(--color-danger-200)', borderRadius: 'var(--radius-sm)', background: 'var(--color-danger-50)' }}>
                <Badge variant="danger">Bình luận bị báo cáo</Badge>
                {viewedComment && <small style={{ display: 'block', marginTop: 8 }}>Bình luận bởi {viewedComment.authorName} · {formatDate(viewedComment.createdAt)}</small>}
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.65, marginBottom: 0 }}>
                  {viewedComment?.content || viewingReport.commentContentPreview || 'Bình luận không còn tồn tại.'}
                </p>
              </div>
            )}

            {isViewingContentError && (
              <p style={{ color: 'var(--color-slate-500)', margin: 0 }}>
                Nội dung gốc có thể đã bị xóa; hệ thống đang hiển thị bản xem trước được lưu cùng báo cáo.
              </p>
            )}
          </div>
        )}
      </Dialog>

      {/* Action Admin Note Modal Dialog */}
      <Dialog
        isOpen={isNoteOpen}
        onClose={() => setIsNoteOpen(false)}
        title={resolveAction === 'RESOLVE' ? 'Xác nhận Giải quyết báo cáo vi phạm' : 'Xác nhận Bác bỏ/Bỏ qua báo cáo'}
      >
        <form onSubmit={handleActionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-600)', margin: 0 }}>
            Bạn đang đánh dấu báo cáo vi phạm bài viết <strong>"{selectedReport?.postTitle}"</strong> của tác giả.
          </p>
          <Textarea
            label="Ghi chú của Admin *"
            placeholder="Nhập lý do kiểm duyệt, ví dụ: Bài viết chứa nội dung spam / Đã kiểm duyệt nội dung hợp lệ..."
            required
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAdminNoteText(e.target.value)}
            rows={3}
          />
          <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end' }}>
            <Button variant="secondary" type="button" onClick={() => setIsNoteOpen(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant={resolveAction === 'RESOLVE' ? 'primary' : 'secondary'}
              isLoading={resolveMutation.isPending || rejectMutation.isPending}
            >
              Xác nhận
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete violating Post Confirm Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deletingReport && deleteContentMutation.mutate(deletingReport)}
        title={`Xác nhận xóa ${deletingReport?.targetType === 'COMMENT' ? 'bình luận' : 'bài viết'} vi phạm`}
        message={`Hành động này sẽ xóa ${deletingReport?.targetType === 'COMMENT' ? 'bình luận cùng các phản hồi trực thuộc' : 'bài viết cùng toàn bộ bình luận liên quan'} và tự động đánh dấu báo cáo là ĐÃ GIẢI QUYẾT. Bạn có chắc chắn?`}
        confirmText={deletingReport?.targetType === 'COMMENT' ? 'Xóa bình luận' : 'Xóa bài viết'}
        isDestructive
        isLoading={deleteContentMutation.isPending}
      />

      <style>{`
        .tab-btn-f {
          padding-bottom: var(--spacing-3);
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--color-slate-500);
          border: none;
          background: none;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all var(--transition-fast);
        }
        .tab-btn-f:hover {
          color: var(--color-slate-800);
        }
        .tab-btn-f-active {
          color: var(--color-primary-700) !important;
          border-bottom-color: var(--color-primary-700) !important;
        }
      `}</style>
    </AdminShell>
  );
}
