import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Dialog } from '@/components/ui/Dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { showSuccessToast } from '@/components/feedback/SuccessToast';
import { normalizeUser } from '@/lib/normalizers';
import { toast } from 'sonner';
import { Shield, ShieldAlert, Trash2, Edit, Plus, Eye, BookOpen } from 'lucide-react';

interface UserDto {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: 'USER' | 'ADMIN' | 'LIBRARIAN';
  active: boolean;
  createdAt?: string;
}

interface UserFormData {
  username: string;
  email: string;
  fullName: string;
  password: string;
  role: 'USER' | 'ADMIN' | 'LIBRARIAN';
}

const emptyUserForm: UserFormData = {
  username: '', email: '', fullName: '', password: '', role: 'USER',
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  
  // Role Dialog states
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'USER' | 'ADMIN' | 'LIBRARIAN'>('USER');

  // Delete User states
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<UserDto | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [userForm, setUserForm] = useState<UserFormData>(emptyUserForm);

  // Query: Get all users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'users', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/users');
      return Array.isArray(res.data) ? res.data.map(normalizeUser) : [];
    },
  });

  const saveUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const payload = { ...data, username: data.username.trim(), email: data.email.trim(), fullName: data.fullName.trim() };
      const res = editingUserId
        ? await apiClient.put(`/admin/users/${editingUserId}`, payload)
        : await apiClient.post('/admin/users', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'list'] });
      setIsUserFormOpen(false);
      setUserForm(emptyUserForm);
      if (editingUserId) {
        showSuccessToast(
          'Cập nhật người dùng thành công.',
          'Thông tin tài khoản đã được lưu lại.',
        );
      } else {
        showSuccessToast(
          'Tạo người dùng thành công.',
          'Tài khoản mới đã sẵn sàng để đăng nhập.',
        );
      }
      setEditingUserId(null);
    },
    onError: (err: any) => toast.error(err.message || 'Không thể lưu người dùng.'),
  });

  // Mutation: Toggle User Status
  const toggleStatusMutation = useMutation({
    mutationFn: async (payload: { id: number; enabled: boolean }) => {
      const res = await apiClient.put(`/admin/users/${payload.id}/status`, {
        enabled: payload.enabled,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'list'] });
      
      const enabled = data?.user?.active ?? data?.user?.enabled ?? false;
      if (enabled) {
        toast.success('Đã mở khóa tài khoản người dùng!');
      } else {
        toast.warning('Đã khóa tài khoản người dùng!');
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Thay đổi trạng thái tài khoản thất bại.');
    },
  });

  // Mutation: Change User Role
  const changeRoleMutation = useMutation({
    mutationFn: async (payload: { id: number; role: 'USER' | 'ADMIN' | 'LIBRARIAN' }) => {
      const res = await apiClient.put(`/admin/users/${payload.id}/role`, {
        role: payload.role,
      });
      return res.data;
    },
    onSuccess: () => {
      setIsRoleOpen(false);
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'list'] });
      toast.success('Cập nhật vai trò người dùng thành công!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Thay đổi quyền người dùng thất bại.');
    },
  });

  // Mutation: Delete User
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/admin/users/${id}`);
    },
    onSuccess: () => {
      setIsDeleteOpen(false);
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'list'] });
      showSuccessToast(
        'Đã xóa tài khoản người dùng vĩnh viễn.',
        'Tài khoản và dữ liệu liên quan đã được loại bỏ.',
      );
    },
    onError: (err: any) => {
      toast.error(err.message || 'Xóa tài khoản người dùng thất bại.');
    },
  });

  const handleOpenRole = (user: UserDto) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setIsRoleOpen(true);
  };

  const handleRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    changeRoleMutation.mutate({ id: selectedUser.id, role: selectedRole });
  };

  const handleOpenDelete = (id: number) => {
    setDeletingId(id);
    setIsDeleteOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingUserId(null);
    setUserForm(emptyUserForm);
    setIsUserFormOpen(true);
  };

  const handleOpenEdit = async (id: number) => {
    try {
      const res = await apiClient.get(`/admin/users/${id}`);
      const user = normalizeUser(res.data);
      setEditingUserId(id);
      setUserForm({ username: user.username, email: user.email, fullName: user.fullName, password: '', role: user.role });
      setIsUserFormOpen(true);
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải chi tiết người dùng.');
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.username.trim() || !userForm.email.trim() || (!editingUserId && userForm.password.length < 6)) {
      toast.error('Vui lòng nhập đủ username, email và mật khẩu tối thiểu 6 ký tự.');
      return;
    }
    if (editingUserId && userForm.password && userForm.password.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    saveUserMutation.mutate(userForm);
  };

  const columns = [
    {
      header: 'Mã số',
      accessor: (row: UserDto) => <strong>#{row.id}</strong>,
      className: 'w-16',
    },
    {
      header: 'Học viên',
      accessor: (row: UserDto) => (
        <div>
          <button
            type="button"
            onClick={() => setViewingUser(row)}
            style={{ fontWeight: 700, display: 'block', color: 'var(--color-primary-700)', textAlign: 'left' }}
            title="Xem thông tin người dùng"
          >
            {row.fullName || row.username}
          </button>
          <span style={{ fontSize: '10px', color: 'var(--color-slate-400)' }}>@{row.username}</span>
        </div>
      ),
    },
    {
      header: 'Địa chỉ email',
      accessor: (row: UserDto) => <span>{row.email}</span>,
    },
    {
      header: 'Quyền hạn',
      accessor: (row: UserDto) => {
        const isAdmin = row.role === 'ADMIN';
        const isLibrarian = row.role === 'LIBRARIAN';
        if (isAdmin) {
          return (
            <Badge variant="warning" style={{ gap: '4px' }}>
              <ShieldAlert size={10} />
              <span>Quản trị viên</span>
            </Badge>
          );
        }
        if (isLibrarian) {
          return (
            <Badge variant="info" style={{ gap: '4px' }}>
              <BookOpen size={10} />
              <span>Thủ thư</span>
            </Badge>
          );
        }
        return (
          <Badge variant="primary" style={{ gap: '4px' }}>
            <Shield size={10} />
            <span>Học viên</span>
          </Badge>
        );
      },
      className: 'w-32',
    },
    {
      header: 'Trạng thái',
      accessor: (row: UserDto) => {
        const isAdmin = row.role === 'ADMIN';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <Switch
              checked={isAdmin || row.active}
              onChange={(e) => toggleStatusMutation.mutate({ id: row.id, enabled: e.target.checked })}
              disabled={isAdmin || (toggleStatusMutation.isPending && toggleStatusMutation.variables?.id === row.id)}
              title={isAdmin ? 'Tài khoản quản trị luôn hoạt động' : undefined}
            />
            {isAdmin && <span style={{ fontSize: '10px', color: 'var(--color-slate-500)' }}>Luôn hoạt động</span>}
          </div>
        );
      },
      className: 'w-24',
    },
    {
      header: 'Thao tác',
      accessor: (row: UserDto) => (
        <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
          <button onClick={() => setViewingUser(row)} className="icon-btn" title="Xem thông tin người dùng">
            <Eye size={16} />
          </button>
          <button onClick={() => handleOpenEdit(row.id)} className="icon-btn" title="Sửa thông tin">
            <Edit size={16} />
          </button>
          <button onClick={() => handleOpenRole(row)} className="icon-btn" title="Thay đổi quyền">
            <Shield size={16} />
          </button>
          <button
            onClick={() => handleOpenDelete(row.id)}
            className="icon-btn"
            style={{ color: 'var(--color-danger-500)' }}
            title="Xóa tài khoản"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
      className: 'w-24',
    },
  ];

  const roleOptions = [
    { value: 'USER', label: 'Học viên (Quyền truy cập tiêu chuẩn)' },
    { value: 'LIBRARIAN', label: 'Thủ thư (Quản lý tài liệu, danh mục & bản quyền)' },
    { value: 'ADMIN', label: 'Quản trị viên (Toàn quyền hệ thống)' },
  ];

  return (
    <AdminShell>
      <PageHeader
        title="Quản lý người dùng"
        description="Kiểm soát cơ sở dữ liệu học viên, phân quyền quản trị viên và khóa hoặc mở khóa tài khoản."
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--spacing-4)' }}>
        <Button variant="primary" onClick={handleOpenCreate}>
          <Plus size={16} /> Thêm người dùng
        </Button>
      </div>

      <div style={{ marginTop: 'var(--spacing-6)' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            <div className="skeleton-shimmer" style={{ height: '48px', borderRadius: 'var(--radius-sm)' }} />
            <div className="skeleton-shimmer" style={{ height: '48px', borderRadius: 'var(--radius-sm)' }} />
          </div>
        ) : (
          <DataTable columns={columns} data={users} emptyMessage="Hệ thống chưa đăng ký tài khoản học viên nào." />
        )}
      </div>

      <Dialog
        isOpen={viewingUser !== null}
        onClose={() => setViewingUser(null)}
        title="Thông tin người dùng"
      >
        {viewingUser && (
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 'var(--spacing-4)', fontSize: 'var(--text-sm)' }}>
            <span style={{ color: 'var(--color-slate-500)' }}>Mã tài khoản</span>
            <strong>#{viewingUser.id}</strong>
            <span style={{ color: 'var(--color-slate-500)' }}>Họ và tên</span>
            <strong>{viewingUser.fullName || 'Chưa cập nhật'}</strong>
            <span style={{ color: 'var(--color-slate-500)' }}>Tên đăng nhập</span>
            <strong>@{viewingUser.username}</strong>
            <span style={{ color: 'var(--color-slate-500)' }}>Email</span>
            <strong>{viewingUser.email}</strong>
            <span style={{ color: 'var(--color-slate-500)' }}>Vai trò</span>
            <strong>{viewingUser.role === 'ADMIN' ? 'Quản trị viên' : viewingUser.role === 'LIBRARIAN' ? 'Thủ thư' : 'Học viên'}</strong>
            <span style={{ color: 'var(--color-slate-500)' }}>Trạng thái</span>
            <strong style={{ color: viewingUser.active ? 'var(--color-success-600)' : 'var(--color-danger-600)' }}>
              {viewingUser.active ? 'Đang hoạt động' : 'Đã khóa'}
            </strong>
            <span style={{ color: 'var(--color-slate-500)' }}>Ngày tạo</span>
            <strong>{viewingUser.createdAt ? new Date(viewingUser.createdAt).toLocaleString('vi-VN') : 'Không có dữ liệu'}</strong>
          </div>
        )}
      </Dialog>

      <Dialog
        isOpen={isUserFormOpen}
        onClose={() => setIsUserFormOpen(false)}
        title={editingUserId ? 'Cập nhật người dùng' : 'Thêm người dùng'}
      >
        <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <Input label="Tên đăng nhập *" value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} disabled={saveUserMutation.isPending} />
          <Input label="Email *" type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} disabled={saveUserMutation.isPending} />
          <Input label="Họ và tên" value={userForm.fullName} onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })} disabled={saveUserMutation.isPending} />
          <Input label={editingUserId ? 'Mật khẩu mới (để trống nếu giữ nguyên)' : 'Mật khẩu *'} type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} disabled={saveUserMutation.isPending} />
          <Select label="Vai trò *" options={roleOptions} value={userForm.role} onChange={(e: any) => setUserForm({ ...userForm, role: e.target.value })} disabled={saveUserMutation.isPending} />
          <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end' }}>
            <Button variant="secondary" type="button" onClick={() => setIsUserFormOpen(false)}>Hủy</Button>
            <Button type="submit" variant="primary" isLoading={saveUserMutation.isPending}>Lưu người dùng</Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Role Dialog Modal */}
      <Dialog isOpen={isRoleOpen} onClose={() => setIsRoleOpen(false)} title="Cập nhật quyền người dùng">
        <form onSubmit={handleRoleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-600)', margin: 0 }}>
            Bạn đang cập nhật vai trò truy cập của học viên <strong>{selectedUser?.fullName}</strong> (@{selectedUser?.username}).
          </p>

          <Select
            label="Chọn vai trò mới *"
            placeholder="Chọn quyền truy cập..."
            options={roleOptions}
            value={selectedRole}
            onChange={(e: any) => setSelectedRole(e.target.value)}
            disabled={changeRoleMutation.isPending}
          />

          <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end', marginTop: 'var(--spacing-4)' }}>
            <Button variant="secondary" type="button" onClick={() => setIsRoleOpen(false)} disabled={changeRoleMutation.isPending}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={changeRoleMutation.isPending}>
              Cập nhật vai trò
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete User Confirm Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Xác nhận xóa tài khoản vĩnh viễn"
        message="Hành động này sẽ xóa vĩnh viễn tài khoản người dùng này khỏi cơ sở dữ liệu hệ thống, hủy bỏ mọi bài thảo luận, tài liệu và lịch sử đính kèm của người dùng. Bạn có chắc chắn muốn tiếp tục?"
        confirmText="Xóa tài khoản"
        isDestructive
        isLoading={deleteMutation.isPending}
      />
    </AdminShell>
  );
}
