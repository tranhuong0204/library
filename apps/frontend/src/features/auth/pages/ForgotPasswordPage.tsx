import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { apiClient } from '@/lib/api/client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { Mail, CheckCircle } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
});

type ForgotForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [developmentResetUrl, setDevelopmentResetUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotForm) => {
    setLoading(true);
    try {
      const response = await apiClient.post<{ message: string; resetUrl?: string }>(
        '/auth/forgot-password',
        data,
      );
      setDevelopmentResetUrl(response.data.resetUrl ?? null);
      setSuccess(true);
      toast.success('Đã gửi liên kết khôi phục!');
    } catch (err: any) {
      toast.error(err.message || 'Không thể yêu cầu khôi phục mật khẩu.');
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
        {success ? (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', alignItems: 'center' }}>
            <CheckCircle size={48} style={{ color: 'var(--color-success-600)' }} />
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-slate-800)', marginBottom: 'var(--spacing-2)' }}>
                Đã gửi yêu cầu khôi phục
              </h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-500)', lineHeight: '1.5' }}>
                Hệ thống đã nhận yêu cầu. Vui lòng kiểm tra hộp thư đến (hoặc thư rác) của bạn để lấy liên kết đặt lại mật khẩu mới.
              </p>
            </div>
            {developmentResetUrl && (
              <a
                href={developmentResetUrl}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                Mở trang đặt lại mật khẩu (môi trường phát triển)
              </a>
            )}
            <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
              Quay lại đăng nhập
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
            <div>
              <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-primary-950)', marginBottom: 'var(--spacing-1)' }}>
                Khôi phục mật khẩu
              </h1>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-400)' }}>
                Nhập email đã đăng ký để đặt lại mật khẩu của bạn
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              <Input
                label="Hộp thư đăng ký (Email)"
                placeholder="email@example.com"
                type="email"
                error={errors.email?.message}
                disabled={loading}
                {...register('email')}
              />

              <Button type="submit" variant="primary" size="lg" isLoading={loading}>
                <Mail size={16} />
                <span>Gửi liên kết khôi phục</span>
              </Button>
            </form>

            <div style={{ textAlign: 'center', fontSize: 'var(--text-xs)' }}>
              <Link to="/login" style={{ color: 'var(--color-primary-600)', fontWeight: 700 }}>
                Quay lại đăng nhập
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
