import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api/client';
import { Input, PasswordInput } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { BookOpen } from 'lucide-react';

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự')
      .max(50, 'Tên đăng nhập không vượt quá 50 ký tự')
      .regex(/^[a-zA-Z0-9_]+$/, 'Tên đăng nhập chỉ chấp nhận chữ cái, số và dấu gạch dưới'),
    email: z.string().email('Email không hợp lệ'),
    fullName: z.string().max(100, 'Họ tên không được vượt quá 100 ký tự').optional(),
    password: z.string().min(6, 'Mật khẩu phải chứa ít nhất 6 ký tự').max(100, 'Mật khẩu không được vượt quá 100 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận lại mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      fullName: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      // Exclude confirmPassword and major fields (major is not sent on registration)
      const payload = {
        username: data.username,
        email: data.email,
        password: data.password,
        fullName: data.fullName || undefined,
      };

      await apiClient.post('/auth/register', payload);
      toast.success('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err: any) {
      setErrorMessage(err.message || 'Đăng ký không thành công. Vui lòng thử lại.');
      toast.error('Đăng ký thất bại.');
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
            Khởi đầu hành trình học tập tương lai
          </h2>
          <p style={{ color: 'var(--color-slate-300)', fontSize: 'var(--text-sm)', lineHeight: '1.6' }}>
            Tham gia cộng đồng LIBRARY ngay hôm nay để nhận được sự hỗ trợ học tập đắc lực từ trí tuệ nhân tạo và kho tàng kiến thức phong phú.
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
        <div style={{ marginBottom: 'var(--spacing-6)' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 850, color: 'var(--color-primary-950)', marginBottom: 'var(--spacing-1)' }}>
            Đăng ký tài khoản
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-400)' }}>
            Trở thành thành viên hệ thống tri thức LIBRARY
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

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
          <Input
            label="Tên đăng nhập"
            placeholder="Nhập tên đăng nhập (a-z, 0-9)..."
            error={errors.username?.message}
            disabled={loading}
            {...register('username')}
          />

          <Input
            label="Địa chỉ email"
            type="email"
            placeholder="Nhập địa chỉ email..."
            error={errors.email?.message}
            disabled={loading}
            {...register('email')}
          />

          <Input
            label="Họ và tên"
            placeholder="Nhập đầy đủ họ tên..."
            error={errors.fullName?.message}
            disabled={loading}
            {...register('fullName')}
          />

          <PasswordInput
            label="Mật khẩu"
            placeholder="Tối thiểu 6 ký tự..."
            error={errors.password?.message}
            disabled={loading}
            {...register('password')}
          />

          <PasswordInput
            label="Xác nhận mật khẩu"
            placeholder="Nhập lại mật khẩu..."
            error={errors.confirmPassword?.message}
            disabled={loading}
            {...register('confirmPassword')}
          />

          <Button type="submit" variant="primary" size="lg" isLoading={loading} style={{ marginTop: 'var(--spacing-4)' }}>
            Đăng ký
          </Button>
        </form>

        <div style={{ marginTop: 'var(--spacing-6)', textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)' }}>
          Đã có tài khoản?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary-600)', fontWeight: 700 }}>
            Đăng nhập ngay
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
