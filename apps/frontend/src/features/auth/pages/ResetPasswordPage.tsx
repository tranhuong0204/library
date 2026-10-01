import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api/client';
import { PasswordInput } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, 'Mật khẩu mới phải có tối thiểu 6 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận lại mật khẩu'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type ResetForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetForm) => {
    if (!token) {
      toast.error('Không tìm thấy mã khôi phục mật khẩu trong đường dẫn.');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', {
        token,
        newPassword: data.newPassword,
      });
      setSuccess(true);
      toast.success('Đặt lại mật khẩu thành công!');
    } catch (err: any) {
      toast.error(err.message || 'Mã xác thực không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-centered"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        padding: 'var(--spacing-4)',
      }}
    >
      <div
        className="card auth-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: 'var(--spacing-8)',
          backgroundColor: 'white',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {!token ? (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', alignItems: 'center' }}>
            <AlertTriangle size={48} style={{ color: 'var(--color-danger-500)' }} />
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-slate-800)', marginBottom: 'var(--spacing-2)' }}>
                Yêu cầu không hợp lệ
              </h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-500)', lineHeight: '1.5' }}>
                Đường dẫn này thiếu mã xác thực hợp lệ. Vui lòng kiểm tra lại liên kết trong email hoặc gửi lại yêu cầu mới.
              </p>
            </div>
            <Link to="/forgot-password" className="btn btn-outline" style={{ width: '100%' }}>
              Yêu cầu đặt lại mật khẩu mới
            </Link>
          </div>
        ) : success ? (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', alignItems: 'center' }}>
            <CheckCircle2 size={48} style={{ color: 'var(--color-success-600)' }} />
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-slate-800)', marginBottom: 'var(--spacing-2)' }}>
                Đặt lại mật khẩu thành công!
              </h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-500)', lineHeight: '1.5' }}>
                Mật khẩu của bạn đã được thay đổi. Bạn có thể tiếp tục sử dụng mật khẩu mới để đăng nhập vào hệ thống.
              </p>
            </div>
            <Button variant="primary" onClick={() => navigate('/login')} style={{ width: '100%' }}>
              Đăng nhập ngay
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
            <div>
              <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-primary-950)', marginBottom: 'var(--spacing-1)' }}>
                Đặt lại mật khẩu mới
              </h1>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-400)' }}>
                Nhập mật khẩu mới cho tài khoản của bạn
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              <PasswordInput
                label="Mật khẩu mới"
                placeholder="Nhập mật khẩu mới..."
                error={errors.newPassword?.message}
                disabled={loading}
                {...register('newPassword')}
              />

              <PasswordInput
                label="Xác nhận mật khẩu mới"
                placeholder="Nhập lại mật khẩu mới..."
                error={errors.confirmPassword?.message}
                disabled={loading}
                {...register('confirmPassword')}
              />

              <Button type="submit" variant="primary" size="lg" isLoading={loading}>
                Xác nhận thay đổi
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
