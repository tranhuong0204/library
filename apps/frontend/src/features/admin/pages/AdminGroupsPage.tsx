import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit, Eye, Plus, Search, Trash2, UserCheck, Users } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { normalizeGroup, normalizeGroupMember } from '@/lib/normalizers';
import { formatDate } from '@/lib/formatters';
import type { GroupMember, StudyGroup } from '@/types';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { Dialog } from '@/components/ui/Dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';

const groupSchema = z.object({
  name: z.string().trim().min(2, 'Tên nhóm phải có ít nhất 2 ký tự').max(100, 'Tên nhóm không vượt quá 100 ký tự'),
  subject: z.string().trim().min(2, 'Vui lòng nhập môn học hoặc lĩnh vực').max(100, 'Môn học không vượt quá 100 ký tự'),
  description: z.string().max(255, 'Mô tả không vượt quá 255 ký tự').optional().default(''),
  visibility: z.enum(['PUBLIC', 'PRIVATE']),
});

type GroupForm = z.infer<typeof groupSchema>;

export default function AdminGroupsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingGroup, setEditingGroup] = useState<StudyGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<StudyGroup | null>(null);
  const [requestGroup, setRequestGroup] = useState<StudyGroup | null>(null);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['admin', 'groups', 'list'],
    queryFn: async () => {
      const response = await apiClient.get('/groups');
      return (Array.isArray(response.data) ? response.data : []).map(normalizeGroup);
    },
  });

  const { data: joinRequests = [], isLoading: isRequestsLoading } = useQuery({
    queryKey: ['admin', 'groups', requestGroup?.id, 'requests'],
    queryFn: async () => {
      const response = await apiClient.get(`/groups/${requestGroup!.id}/join-requests`);
      return (Array.isArray(response.data) ? response.data : []).map(normalizeGroupMember);
    },
    enabled: requestGroup !== null,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<GroupForm>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: '', subject: '', description: '', visibility: 'PUBLIC' },
  });

  useEffect(() => {
    if (!editingGroup) return;
    reset({
      name: editingGroup.name,
      subject: editingGroup.subject,
      description: editingGroup.description || '',
      visibility: editingGroup.visibility,
    });
  }, [editingGroup, reset]);

  const refreshGroups = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'groups'] });
    queryClient.invalidateQueries({ queryKey: ['groups', 'list'] });
  };

  const openCreateDialog = () => {
    reset({ name: '', subject: '', description: '', visibility: 'PUBLIC' });
    setIsCreating(true);
  };

  const createMutation = useMutation({
    mutationFn: async (data: GroupForm) => apiClient.post('/groups', data),
    onSuccess: () => {
      setIsCreating(false);
      refreshGroups();
      toast.success('Tạo nhóm học tập thành công.');
    },
    onError: (error: any) => toast.error(error.message || 'Không thể tạo nhóm học tập.'),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: GroupForm) => apiClient.put(`/groups/${editingGroup!.id}`, data),
    onSuccess: () => {
      setEditingGroup(null);
      refreshGroups();
      toast.success('Cập nhật nhóm học tập thành công.');
    },
    onError: (error: any) => toast.error(error.message || 'Không thể cập nhật nhóm học tập.'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (groupId: number) => apiClient.delete(`/groups/${groupId}`),
    onSuccess: () => {
      setDeletingGroup(null);
      refreshGroups();
      toast.success('Đã xóa nhóm học tập.');
    },
    onError: (error: any) => toast.error(error.message || 'Không thể xóa nhóm học tập.'),
  });

  const approveMutation = useMutation({
    mutationFn: async (memberId: number) => apiClient.post(`/groups/${requestGroup!.id}/join-requests/${memberId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'groups', requestGroup?.id, 'requests'] });
      refreshGroups();
      toast.success('Đã phê duyệt yêu cầu tham gia.');
    },
    onError: (error: any) => toast.error(error.message || 'Không thể phê duyệt yêu cầu.'),
  });

  const rejectMutation = useMutation({
    mutationFn: async (memberId: number) => apiClient.post(`/groups/${requestGroup!.id}/join-requests/${memberId}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'groups', requestGroup?.id, 'requests'] });
      toast.success('Đã từ chối yêu cầu tham gia.');
    },
    onError: (error: any) => toast.error(error.message || 'Không thể từ chối yêu cầu.'),
  });

  const filteredGroups = useMemo(() => {
    const keyword = searchQuery.trim().toLocaleLowerCase('vi');
    if (!keyword) return groups;
    return groups.filter((group) => [group.name, group.subject, group.description, group.createdByName]
      .some((value) => (value || '').toLocaleLowerCase('vi').includes(keyword)));
  }, [groups, searchQuery]);

  const columns = [
    {
      header: 'Nhóm học tập',
      accessor: (group: StudyGroup) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
          <span className="shell-nav-icon"><Users size={18} /></span>
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-slate-900)' }}>{group.name}</p>
            <small style={{ color: 'var(--color-slate-500)' }}>{group.subject}</small>
          </div>
        </div>
      ),
    },
    { header: 'Chủ nhóm', accessor: (group: StudyGroup) => <span>{group.createdByName || 'Không xác định'}</span> },
    { header: 'Thành viên', accessor: (group: StudyGroup) => <strong>{group.memberCount ?? 0}</strong> },
    {
      header: 'Hiển thị',
      accessor: (group: StudyGroup) => (
        <Badge variant={group.visibility === 'PRIVATE' ? 'warning' : 'success'}>
          {group.visibility === 'PRIVATE' ? 'Riêng tư' : 'Công khai'}
        </Badge>
      ),
    },
    { header: 'Ngày tạo', accessor: (group: StudyGroup) => <span>{group.createdAt ? formatDate(group.createdAt) : '-'}</span> },
    {
      header: 'Thao tác',
      accessor: (group: StudyGroup) => (
        <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
          <Button size="sm" variant="outline" onClick={() => setRequestGroup(group)}><UserCheck size={15} /> Yêu cầu</Button>
          <Button size="sm" variant="outline" onClick={() => navigate(`/admin/groups/${group.id}`)}><Eye size={15} /> Xem</Button>
          <Button size="sm" variant="outline" onClick={() => setEditingGroup(group)}><Edit size={15} /> Sửa</Button>
          <Button size="sm" variant="danger" onClick={() => setDeletingGroup(group)}><Trash2 size={15} /> Xóa</Button>
        </div>
      ),
    },
  ];

  const requestColumns = [
    {
      header: 'Người dùng',
      accessor: (member: GroupMember) => (
        <div><strong>{member.fullName || member.username}</strong><div style={{ color: 'var(--color-slate-500)', fontSize: 'var(--text-xs)' }}>@{member.username}</div></div>
      ),
    },
    { header: 'Email', accessor: (member: GroupMember) => <span>{member.email || '-'}</span> },
    {
      header: 'Thao tác',
      accessor: (member: GroupMember) => (
        <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
          <Button size="sm" onClick={() => approveMutation.mutate(member.id)} isLoading={approveMutation.isPending && approveMutation.variables === member.id}>Duyệt</Button>
          <Button size="sm" variant="danger" onClick={() => rejectMutation.mutate(member.id)} isLoading={rejectMutation.isPending && rejectMutation.variables === member.id}>Từ chối</Button>
        </div>
      ),
    },
  ];

  return (
    <AdminShell>
      <PageHeader
        title="Quản lý nhóm học tập"
        description="Tạo, theo dõi, cập nhật, xóa nhóm và xử lý các yêu cầu tham gia nhóm trên toàn hệ thống."
        actions={<Button onClick={openCreateDialog}><Plus size={16} /> Tạo nhóm học tập</Button>}
      />
      <div style={{ marginBottom: 'var(--spacing-5)', maxWidth: 520, position: 'relative' }}>
        <Search size={17} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--color-slate-400)' }} />
        <input className="form-input" style={{ paddingLeft: 42 }} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tìm theo tên nhóm, môn học hoặc chủ nhóm..." aria-label="Tìm kiếm nhóm học tập" />
      </div>
      {isLoading ? <div className="page-loader" role="status">Đang tải danh sách nhóm...</div> : <DataTable columns={columns} data={filteredGroups} emptyMessage="Chưa có nhóm học tập phù hợp." />}

      <Dialog
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        title="Tạo nhóm học tập mới"
        footer={<><Button variant="secondary" onClick={() => setIsCreating(false)} disabled={createMutation.isPending}>Hủy</Button><Button onClick={handleSubmit((data) => createMutation.mutate(data))} isLoading={createMutation.isPending}>Tạo nhóm</Button></>}
      >
        <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
          <Input label="Tên nhóm *" error={errors.name?.message} {...register('name')} />
          <Input label="Môn học / Lĩnh vực *" error={errors.subject?.message} {...register('subject')} />
          <Textarea label="Mô tả" rows={4} error={errors.description?.message} {...register('description')} />
          <Select label="Chế độ hiển thị" options={[{ value: 'PUBLIC', label: 'Công khai' }, { value: 'PRIVATE', label: 'Riêng tư' }]} error={errors.visibility?.message} {...register('visibility')} />
        </form>
      </Dialog>

      <Dialog
        isOpen={editingGroup !== null}
        onClose={() => setEditingGroup(null)}
        title="Cập nhật nhóm học tập"
        footer={<><Button variant="secondary" onClick={() => setEditingGroup(null)} disabled={updateMutation.isPending}>Hủy</Button><Button onClick={handleSubmit((data) => updateMutation.mutate(data))} isLoading={updateMutation.isPending}>Lưu thay đổi</Button></>}
      >
        <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
          <Input label="Tên nhóm *" error={errors.name?.message} {...register('name')} />
          <Input label="Môn học / Lĩnh vực *" error={errors.subject?.message} {...register('subject')} />
          <Textarea label="Mô tả" rows={4} error={errors.description?.message} {...register('description')} />
          <Select label="Chế độ hiển thị" options={[{ value: 'PUBLIC', label: 'Công khai' }, { value: 'PRIVATE', label: 'Riêng tư' }]} error={errors.visibility?.message} {...register('visibility')} />
        </form>
      </Dialog>

      <Dialog isOpen={requestGroup !== null} onClose={() => setRequestGroup(null)} title={`Yêu cầu tham gia - ${requestGroup?.name || ''}`} maxWidth="900px">
        {isRequestsLoading ? <p>Đang tải yêu cầu...</p> : <DataTable columns={requestColumns} data={joinRequests} emptyMessage="Nhóm không có yêu cầu tham gia đang chờ." />}
      </Dialog>

      <ConfirmDialog
        isOpen={deletingGroup !== null}
        onClose={() => setDeletingGroup(null)}
        onConfirm={() => deletingGroup && deleteMutation.mutate(deletingGroup.id)}
        title="Xóa nhóm học tập"
        message={`Bạn có chắc muốn xóa nhóm “${deletingGroup?.name || ''}”? Tin nhắn, thành viên và tệp liên quan cũng sẽ bị xóa.`}
        confirmText="Xóa nhóm"
        isDestructive
        isLoading={deleteMutation.isPending}
      />
    </AdminShell>
  );
}
