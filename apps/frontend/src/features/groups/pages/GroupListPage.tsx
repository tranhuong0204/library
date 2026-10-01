import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { normalizeGroup } from '@/lib/normalizers';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { toast } from 'sonner';
import { Users, Shield, LogOut, ArrowRight, Hourglass } from 'lucide-react';

interface StudyGroupDto {
  id: number;
  name: string;
  description: string;
  subject: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  memberCount: number;
  createdById: number;
  createdByName: string;
  joined: boolean;
  joinStatus: 'JOINED' | 'PENDING' | 'NONE';
  owner: boolean;
  createdAt: string;
}

export default function GroupListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Leave group state
  const [leavingGroupId, setLeavingGroupId] = useState<number | null>(null);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);

  // Query: Get list of study groups
  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['groups', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/groups');
      return (Array.isArray(res.data) ? res.data : []).map(normalizeGroup);
    },
  });

  // Mutation: Join Group
  const joinMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const res = await apiClient.post(`/groups/${groupId}/join`);
      return res.data;
    },
    onSuccess: (resData, groupId) => {
      queryClient.invalidateQueries({ queryKey: ['groups', 'list'] });
      
      const isPending = resData?.joinStatus === 'PENDING' || resData?.status === 'PENDING';
      if (isPending) {
        toast.success('Yêu cầu tham gia nhóm đã được gửi, vui lòng chờ duyệt!');
      } else {
        toast.success('Đã tham gia nhóm học tập thành công!');
        navigate(`/groups/${groupId}`);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Không thể xin gia nhập nhóm.');
    },
  });

  // Mutation: Leave Group
  const leaveMutation = useMutation({
    mutationFn: async (groupId: number) => {
      await apiClient.delete(`/groups/${groupId}/leave`);
    },
    onSuccess: () => {
      setIsLeaveOpen(false);
      setLeavingGroupId(null);
      queryClient.invalidateQueries({ queryKey: ['groups', 'list'] });
      toast.success('Đã rời khỏi nhóm học tập.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Rời nhóm thất bại.');
    },
  });

  const handleOpenLeave = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setLeavingGroupId(id);
    setIsLeaveOpen(true);
  };

  const handleJoin = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    joinMutation.mutate(id);
  };

  const handleCardClick = (group: StudyGroupDto) => {
    if (group.joined) {
      navigate(`/groups/${group.id}`);
    } else {
      toast.info('Vui lòng tham gia nhóm để vào không gian làm việc.');
    }
  };

  const filteredGroups = groups.filter((g) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      g.name.toLowerCase().includes(q) ||
      g.subject.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q)
    );
  });

  return (
    <AppShell>
      <PageHeader
        title="Nhóm học tập"
        description="Tham gia các câu lạc bộ học thuật, nhóm tự học chuyên ngành để cùng thảo luận bài học và chia sẻ giáo trình."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
        {/* Search filter row */}
        <div style={{ maxWidth: '400px', width: '100%' }}>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Tìm kiếm nhóm học tập..."
          />
        </div>

        {/* Groups Grid list */}
        {isLoading ? (
          <div className="grid-responsive-cards">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="skeleton-shimmer" style={{ height: '24px', width: '50%' }} />
                  <div className="skeleton-shimmer" style={{ height: '14px', width: '30%' }} />
                  <div className="skeleton-shimmer" style={{ height: '40px', width: '100%' }} />
                </CardBody>
              </Card>
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          <EmptyState
            title="Không tìm thấy nhóm học tập"
            message={
              searchQuery
                ? `Không tìm thấy nhóm nào khớp với tên "${searchQuery}"`
                : 'Hiện tại hệ thống chưa được đăng ký nhóm học tập nào.'
            }
            icon={<Users size={48} />}
          />
        ) : (
          <div className="grid-responsive-cards">
            {filteredGroups.map((group) => (
              <Card
                key={group.id}
                hoverable
                onClick={() => handleCardClick(group as StudyGroupDto)}
                style={{
                  cursor: group.joined ? 'pointer' : 'default',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                <CardBody style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                    <Badge variant="primary" style={{ backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-700)' }}>
                      Môn học: {group.subject}
                    </Badge>
                    <Badge variant={group.visibility === 'PUBLIC' ? 'success' : 'accent'}>
                      {group.visibility === 'PUBLIC' ? 'Công khai' : 'Riêng tư'}
                    </Badge>
                  </div>

                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--color-primary-950)', margin: '4px 0 0 0' }}>
                    {group.name}
                  </h3>

                  <p
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-slate-500)',
                      margin: 0,
                      lineHeight: '1.5',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {group.description || 'Không có mô tả chi tiết cho nhóm học tập này.'}
                  </p>

                  {/* Badges status line */}
                  <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap', marginTop: '2px' }}>
                    {group.owner && (
                      <Badge variant="warning" style={{ fontSize: '10px', gap: '2px' }}>
                        <Shield size={10} /> Trưởng nhóm
                      </Badge>
                    )}
                    {group.joined && !group.owner && (
                      <Badge variant="info" style={{ fontSize: '10px' }}>
                        Đã tham gia
                      </Badge>
                    )}
                    {group.joinStatus === 'PENDING' && (
                      <Badge variant="warning" style={{ fontSize: '10px', gap: '2px', backgroundColor: 'var(--color-warning-50)', color: 'var(--color-warning-700)' }}>
                        <Hourglass size={10} /> Đang chờ duyệt
                      </Badge>
                    )}
                  </div>

                  {/* Card bottom actions */}
                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: 'var(--spacing-3)',
                      borderTop: '1px solid var(--color-slate-100)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)', fontWeight: 600 }}>
                      Sĩ số: {group.memberCount} thành viên
                    </span>

                    <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                      {/* Join / Leave buttons actions */}
                      {!group.joined && group.joinStatus !== 'PENDING' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleJoin(e, group.id)}
                          isLoading={joinMutation.isPending && joinMutation.variables === group.id}
                        >
                          Tham gia
                        </Button>
                      )}

                      {group.joinStatus === 'PENDING' && (
                        <Button variant="secondary" size="sm" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                          Chờ duyệt
                        </Button>
                      )}

                      {group.joined && !group.owner && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleOpenLeave(e, group.id)}
                          style={{ color: 'var(--color-danger-500)', borderColor: 'var(--color-danger-200)' }}
                        >
                          <LogOut size={12} />
                          <span>Rời nhóm</span>
                        </Button>
                      )}

                      {group.joined && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/groups/${group.id}`);
                          }}
                          style={{ gap: '2px' }}
                        >
                          <span>Vào nhóm</span>
                          <ArrowRight size={12} />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Leave group Confirm Dialog */}
      <ConfirmDialog
        isOpen={isLeaveOpen}
        onClose={() => setIsLeaveOpen(false)}
        onConfirm={() => leavingGroupId && leaveMutation.mutate(leavingGroupId)}
        title="Xác nhận rời khỏi nhóm"
        message="Bạn có chắc chắn muốn rời khỏi nhóm học tập này? Bạn sẽ không thể truy cập không gian chat thảo luận chung và chia sẻ tài nguyên nếu rời nhóm."
        confirmText="Rời nhóm"
        isDestructive
        isLoading={leaveMutation.isPending}
      />
    </AppShell>
  );
}
