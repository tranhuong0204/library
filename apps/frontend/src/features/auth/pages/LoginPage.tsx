import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { apiClient } from '@/lib/api/client';
import { normalizeUser } from '@/lib/normalizers';
import { Input, PasswordInput } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { showSuccessToast } from '@/components/feedback/SuccessToast';
import { toast } from 'sonner';

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
      const user = normalizeUser(res.data);

      login(token, user);
      showSuccessToast(
        'Đăng nhập thành công!',
        'Chào mừng bạn quay trở lại với Library AI.',
      );
      const defaultRedirect =
        user.role === 'ADMIN' ? '/admin' : user.role === 'LIBRARIAN' ? '/admin/documents' : '/';
      navigate(returnUrl || defaultRedirect, { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại.');
      toast.error('Đăng nhập thất bại.');
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
            <h1>Chào mừng trở lại</h1>
            <p>Đăng nhập vào không gian học tập và nghiên cứu Library AI</p>
          </div>

          {/* Interactive Herbarium Tab Switcher */}
          <div className="herbarium-tab-switcher" role="tablist" aria-label="Tùy chọn tài khoản">
            <button
              type="button"
              role="tab"
              aria-selected="true"
              className="herbarium-tab-btn is-active"
            >
              Đăng nhập
            </button>
            <button
              type="button"
              role="tab"
              aria-selected="false"
              className="herbarium-tab-btn"
              onClick={() =>
                navigate(`/register${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`)
              }
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
              label="Tên đăng nhập hoặc email"
              placeholder="Nhập username hoặc email..."
              error={errors.usernameOrEmail?.message}
              disabled={loading}
              {...register('usernameOrEmail')}
            />

            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '2px',
                }}
              >
                <span />
                <Link
                  to="/forgot-password"
                  style={{
                    fontSize: '11px',
                    color: 'var(--dp-color-accent)',
                    fontWeight: 600,
                    textDecoration: 'none',
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
              Đăng nhập vào thư viện <ArrowRight size={15} />
            </Button>
          </form>

          <div className="herbarium-form-footer">
            Chưa có tài khoản học giả?{' '}
            <Link
              to={`/register${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`}
            >
              Đăng ký thành viên mới
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
