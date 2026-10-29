import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { Input, PasswordInput } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { toast } from 'sonner';

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự')
      .max(50, 'Tên đăng nhập không vượt quá 50 ký tự')
      .regex(/^[a-zA-Z0-9_]+$/, 'Tên đăng nhập chỉ chấp nhận chữ cái, số và dấu gạch dưới'),
    email: z.string().email('Email không hợp lệ'),
    fullName: z.string().max(100, 'Họ tên không được vượt quá 100 ký tự').optional(),
    password: z
      .string()
      .min(6, 'Mật khẩu phải chứa ít nhất 6 ký tự')
      .max(100, 'Mật khẩu không được vượt quá 100 ký tự'),
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
    <div className="herbarium-page-wrap">
      {/* Top Navigation Bar */}
      <div className="herbarium-topbar">
        <Link to="/" className="herbarium-back-link" aria-label="Trở về trang chủ thư viện">
          <ArrowLeft size={16} />
          <span>Về trang chủ</span>
        </Link>
        <BrandLogo compact size="sm" />
      </div>

      {/* Sage Window Specimen Frame */}
      <div className="herbarium-specimen-frame">
        <div className="herbarium-paper-card">
          {/* Header with Terracotta Wax Seal */}
          <div className="herbarium-header">
            <div className="herbarium-wax-seal" title="Con dấu tri thức Botanical">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                <path d="M8 9h6" />
                <path d="M12 5.5c1.2 0 2 .8 2.2 1.8" />
              </svg>
            </div>
            <h1>Ghi danh học giả</h1>
            <p>Khởi đầu hành trình học tập và nghiên cứu sâu rộng cùng AI</p>
          </div>

          {/* Interactive Herbarium Tab Switcher */}
          <div className="herbarium-tab-switcher" role="tablist" aria-label="Tùy chọn tài khoản">
            <button
              type="button"
              role="tab"
              aria-selected="false"
              className="herbarium-tab-btn"
              onClick={() => navigate('/login')}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              role="tab"
              aria-selected="true"
              className="herbarium-tab-btn is-active"
            >
              Đăng ký
            </button>
          </div>

          {errorMessage && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'var(--color-danger-50)',
                border: '1px solid var(--color-danger-500)',
                borderRadius: '12px',
                color: 'var(--color-danger-700)',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                marginBottom: '16px',
              }}
            >
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="herbarium-form">
            <Input
              label="Tên đăng nhập"
              placeholder="Ví dụ: scholar_2026..."
              error={errors.username?.message}
              disabled={loading}
              {...register('username')}
            />

            <Input
              label="Địa chỉ Email"
              type="email"
              placeholder="name@university.edu.vn..."
              error={errors.email?.message}
              disabled={loading}
              {...register('email')}
            />

            <Input
              label="Họ và tên (Tùy chọn)"
              placeholder="Nguyễn Văn A..."
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

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              style={{
                width: '100%',
                marginTop: '10px',
                borderRadius: '999px',
                minHeight: '46px',
              }}
            >
              Tạo tài khoản học giả <ArrowRight size={15} />
            </Button>
          </form>

          <div className="herbarium-form-footer">
            Đã có tài khoản thành viên?{' '}
            <Link to="/login">
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: '20px',
          color: 'var(--dp-color-field-line)',
          fontSize: '11px',
          letterSpacing: 'var(--dp-typography-label-tracking)',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <ShieldCheck size={13} color="var(--dp-color-accent)" />
        <span>Library AI · Không gian học thuật số chuẩn mực</span>
      </div>
    </div>
  );
}
