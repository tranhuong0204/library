import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/app/providers';
import { apiClient } from '@/lib/api/client';
import { normalizeUser } from '@/lib/normalizers';
import { Input, PasswordInput } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { showSuccessToast } from '@/components/feedback/SuccessToast';
import { toast } from 'sonner';
import { BookOpen } from 'lucide-react';

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Vui lòng nhập tên đăng nhập hoặc email'),
  password: z.string().min(6, 'Mật khẩu phải có tối thiểu 6 ký tự'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const returnUrl = searchParams.get('returnUrl');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usernameOrEmail: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.post('/auth/login', data);
      
      const token = res.data.token;
      // DTO normalization
      const user = normalizeUser(res.data);
      
      login(token, user);
      showSuccessToast(
        'Đăng nhập thành công!',
        'Chào mừng bạn quay trở lại với LIBRARY.',
      );
      navigate(returnUrl || (user.role === 'ADMIN' ? '/admin' : '/'), { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại.');
      toast.error('Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell" style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#f8fafc' }}>
      {/* Visual Branding Split Banner (hidden on mobile) */}
      <div
        className="login-visual-side auth-visual"
        style={{
          flex: 1,
          backgroundColor: 'var(--color-primary-950)',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 'var(--spacing-12)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle glow layer */}
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            right: '-10%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(20, 184, 166, 0.15) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', zIndex: 10 }}>
          <BookOpen size={24} style={{ color: 'var(--color-accent-400)' }} />
          <span style={{ fontSize: 'var(--text-lg)', fontWeight: 800, letterSpacing: '1px' }}>
            LIBRARY
          </span>
        </div>

        <div style={{ zIndex: 10, maxWidth: '440px' }}>
          <h2 style={{ fontSize: 'var(--text-3xl)', color: 'white', fontWeight: 800, lineHeight: '1.2', marginBottom: 'var(--spacing-4)' }}>
            Nền tảng tri thức & Học tập thông minh hỗ trợ bởi AI
          </h2>
          <p style={{ color: 'var(--color-slate-300)', fontSize: 'var(--text-sm)', lineHeight: '1.6' }}>
            Tìm kiếm tài liệu học tập tối ưu, trò chuyện với trợ lý học thuật AI của bạn, thảo luận diễn đàn và cùng cộng tác với các nhóm học tập tại một không gian tập trung.
          </p>
        </div>

        <div style={{ color: 'var(--color-slate-400)', fontSize: 'var(--text-xs)', zIndex: 10 }}>
          &copy; {new Date().getFullYear()} Đội ngũ phát triển LIBRARY. Đạt chuẩn giáo dục số.
        </div>
      </div>

      {/* Form Content Side */}
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'var(--spacing-8) var(--spacing-10)',
          backgroundColor: 'white',
          boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.02)',
        }}
        className="login-form-side auth-form-panel"
      >
        <div style={{ marginBottom: 'var(--spacing-8)' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 850, color: 'var(--color-primary-950)', marginBottom: 'var(--spacing-1)' }}>
            Chào mừng quay lại
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-400)' }}>
            Đăng nhập vào tài khoản LIBRARY của bạn
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              padding: 'var(--spacing-3) var(--spacing-4)',
              backgroundColor: 'var(--color-danger-50)',
              border: '1px solid var(--color-danger-500)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-danger-700)',
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              marginBottom: 'var(--spacing-4)',
            }}
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
          <Input
            label="Tên đăng nhập hoặc email"
            placeholder="Nhập username hoặc email..."
            error={errors.usernameOrEmail?.message}
            disabled={loading}
            {...register('usernameOrEmail')}
          />

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
              <span />
              <Link
                to="/forgot-password"
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-primary-600)',
                  fontWeight: 600,
                }}
              >
                Quên mật khẩu?
              </Link>
            </div>
            <PasswordInput
              label="Mật khẩu"
              placeholder="Nhập mật khẩu..."
              error={errors.password?.message}
              disabled={loading}
              {...register('password')}
            />
          </div>

          <Button type="submit" variant="primary" size="lg" isLoading={loading} style={{ marginTop: 'var(--spacing-2)' }}>
            Đăng nhập
          </Button>
        </form>

        <div style={{ marginTop: 'var(--spacing-8)', textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)' }}>
          Chưa có tài khoản?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary-600)', fontWeight: 700 }}>
            Đăng ký thành viên
          </Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .login-visual-side {
            display: none !important;
          }
          .login-form-side {
            max-width: 100% !important;
            box-shadow: none !important;
            padding: var(--spacing-6) !important;
          }
        }
      `}</style>
    </div>
  );
}
