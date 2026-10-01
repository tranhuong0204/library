import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/app/providers';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { normalizeUser } from '@/lib/normalizers';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input, PasswordInput } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { toast } from 'sonner';
import { User as UserIcon, Lock, Activity, Eye, FileText, MessageSquare } from 'lucide-react';

// Validation Schemas
const profileSchema = z.object({
  fullName: z.string().min(1, 'Họ tên không được để trống').max(100, 'Họ tên không vượt quá 100 ký tự'),
  email: z.string().email('Email không đúng định dạng'),
  major: z.string().max(100, 'Chuyên ngành không vượt quá 100 ký tự').default(''),
});

const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Vui lòng nhập mật khẩu cũ'),
    newPassword: z.string().min(6, 'Mật khẩu mới phải có tối thiểu 6 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');

  // Query: get complete user details
  const { data: profileDetails, isLoading: isProfileLoading } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: async () => {
      const res = await apiClient.get('/users/me');
      return normalizeUser(res.data);
    },
    enabled: !!user,
  });

  // Query: get user activity list
  const { data: activities = [], isLoading: isActivityLoading } = useQuery({
    queryKey: ['users', 'activity'],
    queryFn: async () => {
      const res = await apiClient.get('/users/activity');
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!user && activeTab === 'activity',
  });

  // Mutation: Update Profile details
  const profileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const res = await apiClient.put('/users/me', data);
      return normalizeUser(res.data);
    },
    onSuccess: (updatedData) => {
      updateUser(updatedData);
      queryClient.setQueryData(['users', 'me'], updatedData);
      toast.success('Cập nhật hồ sơ thành công!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Không thể cập nhật hồ sơ.');
    },
  });

  // Mutation: Change Password
  const passwordMutation = useMutation({
    mutationFn: async (data: PasswordForm) => {
      await apiClient.put('/users/change-password', {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => {
      resetPasswordForm();
      toast.success('Đổi mật khẩu thành công!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Không thể đổi mật khẩu.');
    },
  });

  // Form setups
  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: errorsProfile },
    reset: resetProfileForm,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: profileDetails
      ? {
          fullName: profileDetails.fullName,
          email: profileDetails.email,
          major: profileDetails.major,
        }
      : undefined,
  });

  const {
    register: regPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: errorsPassword },
    reset: resetPasswordForm,
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onUpdateProfile = (data: ProfileForm) => {
    profileMutation.mutate(data);
  };

  const onChangePassword = (data: PasswordForm) => {
    passwordMutation.mutate(data);
  };

  // Helper: Activity Icon picker
  const getActivityIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('view') || t.includes('read')) return <Eye size={16} />;
    if (t.includes('comment') || t.includes('reply')) return <MessageSquare size={16} />;
    return <FileText size={16} />;
  };

  const tabsConfig = [
    {
      id: 'profile',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserIcon size={16} /> Hồ sơ cá nhân
        </span>
      ),
      content: (
        <Card>
          <CardHeader>
            <h3 style={{ fontSize: 'var(--text-lg)' }}>Thông tin tài khoản</h3>
          </CardHeader>
          <CardBody>
            {isProfileLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                <div className="skeleton-shimmer" style={{ height: '40px', borderRadius: 'var(--radius-sm)' }} />
                <div className="skeleton-shimmer" style={{ height: '40px', borderRadius: 'var(--radius-sm)' }} />
                <div className="skeleton-shimmer" style={{ height: '40px', borderRadius: 'var(--radius-sm)' }} />
              </div>
            ) : (
              <form onSubmit={handleProfileSubmit(onUpdateProfile)}>
                <Input
                  label="Tên đăng nhập"
                  value={profileDetails?.username}
                  disabled
                  readOnly
                  containerClassName="form-group-disabled"
                  style={{ backgroundColor: 'var(--color-slate-50)', color: 'var(--color-slate-500)' }}
                />

                <Input
                  label="Họ và tên"
                  placeholder="Nhập họ và tên của bạn..."
                  error={errorsProfile.fullName?.message}
                  disabled={profileMutation.isPending}
                  {...regProfile('fullName')}
                />

                <Input
                  label="Địa chỉ email"
                  placeholder="name@example.com"
                  type="email"
                  error={errorsProfile.email?.message}
                  disabled={profileMutation.isPending}
                  {...regProfile('email')}
                />

                <Input
                  label="Chuyên ngành học tập"
                  placeholder="Ví dụ: Công nghệ thông tin, Kinh tế đối ngoại..."
                  error={errorsProfile.major?.message}
                  disabled={profileMutation.isPending}
                  {...regProfile('major')}
                />

                <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-6)' }}>
                  <Button type="submit" variant="primary" isLoading={profileMutation.isPending}>
                    Lưu thay đổi
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => resetProfileForm()}
                    disabled={profileMutation.isPending}
                  >
                    Hủy
                  </Button>
                </div>
              </form>
            )}
          </CardBody>
        </Card>
      ),
    },
    {
      id: 'password',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={16} /> Đổi mật khẩu
        </span>
      ),
      content: (
        <Card>
          <CardHeader>
            <h3 style={{ fontSize: 'var(--text-lg)' }}>Thiết lập mật khẩu mới</h3>
          </CardHeader>
          <CardBody>
            <form onSubmit={handlePasswordSubmit(onChangePassword)}>
              <PasswordInput
                label="Mật khẩu cũ"
                placeholder="Nhập mật khẩu hiện tại..."
                error={errorsPassword.oldPassword?.message}
                disabled={passwordMutation.isPending}
                {...regPassword('oldPassword')}
              />

              <PasswordInput
                label="Mật khẩu mới"
                placeholder="Mật khẩu mới (tối thiểu 6 ký tự)..."
                error={errorsPassword.newPassword?.message}
                disabled={passwordMutation.isPending}
                {...regPassword('newPassword')}
              />

              <PasswordInput
                label="Xác nhận mật khẩu mới"
                placeholder="Nhập lại mật khẩu mới..."
                error={errorsPassword.confirmPassword?.message}
                disabled={passwordMutation.isPending}
                {...regPassword('confirmPassword')}
              />

              <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-6)' }}>
                <Button type="submit" variant="primary" isLoading={passwordMutation.isPending}>
                  Cập nhật mật khẩu
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => resetPasswordForm()}
                  disabled={passwordMutation.isPending}
                >
                  Đặt lại form
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ),
    },
    {
      id: 'activity',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} /> Lịch sử hoạt động
        </span>
      ),
      content: (
        <Card>
          <CardHeader>
            <h3 style={{ fontSize: 'var(--text-lg)' }}>Nhật ký hoạt động hệ thống</h3>
          </CardHeader>
          <CardBody>
            {isActivityLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                <div className="skeleton-shimmer" style={{ height: '60px', borderRadius: 'var(--radius-sm)' }} />
                <div className="skeleton-shimmer" style={{ height: '60px', borderRadius: 'var(--radius-sm)' }} />
                <div className="skeleton-shimmer" style={{ height: '60px', borderRadius: 'var(--radius-sm)' }} />
              </div>
            ) : activities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--color-slate-400)' }}>
                Chưa ghi nhận hoạt động nào của bạn.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', position: 'relative' }}>
                {/* Timeline connector line */}
                <div
                  style={{
                    position: 'absolute',
                    left: '20px',
                    top: '20px',
                    bottom: '20px',
                    width: '2px',
                    backgroundColor: 'var(--color-slate-200)',
                    zIndex: 1,
                  }}
                />

                {activities.map((act: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      gap: 'var(--spacing-4)',
                      alignItems: 'flex-start',
                      zIndex: 2,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-primary-50)',
                        color: 'var(--color-primary-600)',
                        border: '2px solid white',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      {getActivityIcon(act.activityType || act.action || '')}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        padding: 'var(--spacing-3) var(--spacing-4)',
                        backgroundColor: 'var(--color-slate-50)',
                        border: '1px solid var(--color-slate-200)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-slate-800)', margin: 0 }}>
                        {act.description || act.message || 'Hoạt động hệ thống'}
                      </p>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)' }}>
                        {act.createdAt || act.timestamp || 'Gần đây'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      ),
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Hồ sơ tài khoản"
        description="Quản lý thông tin cá nhân học tập, mật khẩu đăng nhập bảo mật và nhật ký hoạt động hệ thống."
      />

      <div style={{ marginTop: 'var(--spacing-4)' }}>
        <Tabs tabs={tabsConfig} activeTab={activeTab} onChange={setActiveTab} />
      </div>
    </AppShell>
  );
}
