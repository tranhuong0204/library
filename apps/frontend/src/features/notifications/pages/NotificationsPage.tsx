import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { normalizeNotification } from '@/lib/normalizers';
import { formatDate } from '@/lib/formatters';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/feedback/EmptyState';
import { toast } from 'sonner';
import {
  Bell,
  Check,
  Trash2,
  Info,
  CheckCircle,
  AlertTriangle,
  Flame,
} from 'lucide-react';



export default function NotificationsPage() {
  const queryClient = useQueryClient();

  // Query: Get user notifications list
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications');
      return (Array.isArray(res.data) ? res.data : []).map(normalizeNotification);
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Mutation: Mark single read
  const readMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.put(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Không thể đánh dấu thông báo.');
    },
  });

  // Mutation: Mark all read
  const readAllMutation = useMutation({
    mutationFn: async () => {
      await apiClient.put('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] });
      toast.success('Đã đánh dấu tất cả thông báo là đã đọc!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Không thể đánh dấu đọc tất cả.');
    },
  });

  // Mutation: Delete notification
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] });
      toast.success('Đã xóa thông báo.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Không thể xóa thông báo.');
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return (
          <div style={{ padding: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success-50)', color: 'var(--color-success-600)' }}>
            <CheckCircle size={18} />
          </div>
        );
      case 'WARNING':
        return (
          <div style={{ padding: '8px', borderRadius: '50%', backgroundColor: 'var(--color-warning-50)', color: 'var(--color-warning-600)' }}>
            <AlertTriangle size={18} />
          </div>
        );
      case 'SYSTEM':
        return (
          <div style={{ padding: '8px', borderRadius: '50%', backgroundColor: 'var(--color-accent-50)', color: 'var(--color-accent-600)' }}>
            <Flame size={18} />
          </div>
        );
      default:
        return (
          <div style={{ padding: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-600)' }}>
            <Info size={18} />
          </div>
        );
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Thông báo của bạn"
        description="Theo dõi các hoạt động duyệt giáo trình, phê duyệt gia nhập nhóm học tập và phản hồi thảo luận từ giảng viên."
        actions={
          unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => readAllMutation.mutate()}
              isLoading={readAllMutation.isPending}
            >
              <Check size={16} />
              <span>Đọc tất cả ({unreadCount})</span>
            </Button>
          )
        }
      />

      <div style={{ marginTop: 'var(--spacing-2)' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            <div className="skeleton-shimmer" style={{ height: '76px', borderRadius: 'var(--radius-sm)' }} />
            <div className="skeleton-shimmer" style={{ height: '76px', borderRadius: 'var(--radius-sm)' }} />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            title="Hộp thư thông báo trống"
            message="Bạn chưa có thông báo mới nào vào lúc này."
            icon={<Bell size={48} />}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            {notifications.map((notif) => (
              <Card
                key={notif.id}
                onClick={() => !notif.isRead && readMutation.mutate(notif.id)}
                style={{
                  cursor: notif.isRead ? 'default' : 'pointer',
                  borderLeft: notif.isRead ? '3px solid var(--color-slate-200)' : '3px solid var(--color-primary-500)',
                  backgroundColor: notif.isRead ? 'white' : 'var(--color-primary-25)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <CardBody style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'center', padding: 'var(--spacing-4)' }}>
                  {getTypeIcon(notif.type)}

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: notif.isRead ? 700 : 900, color: 'var(--color-primary-950)', margin: 0 }}>
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-primary-600)',
                          }}
                        />
                      )}
                    </div>
                    
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-600)', marginTop: '4px', margin: 0, lineHeight: '1.4' }}>
                      {notif.message}
                    </p>

                    <span style={{ fontSize: '10px', color: 'var(--color-slate-400)', display: 'block', marginTop: '6px' }}>
                      {formatDate(notif.createdAt)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(notif.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-slate-400)',
                      padding: '8px',
                    }}
                    className="notif-delete-btn"
                    title="Xóa thông báo"
                  >
                    <Trash2 size={16} />
                  </button>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .notif-delete-btn:hover {
          color: var(--color-danger-500) !important;
        }
      `}</style>
    </AppShell>
  );
}
