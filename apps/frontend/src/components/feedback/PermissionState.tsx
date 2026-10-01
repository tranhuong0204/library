import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';

export const PermissionState = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-12) var(--spacing-6)',
        textAlign: 'center',
        backgroundColor: 'var(--color-slate-50)',
        border: '1px solid var(--color-slate-200)',
        borderRadius: 'var(--radius-md)',
        maxWidth: '480px',
        margin: 'var(--spacing-8) auto',
        gap: 'var(--spacing-5)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-warning-50)',
          color: 'var(--color-warning-600)',
        }}
      >
        <ShieldAlert size={36} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-slate-900)' }}>
          Quyền truy cập bị từ chối
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-500)', maxWidth: '38ch', margin: '0 auto' }}>
          Tài khoản của bạn không có đủ thẩm quyền để xem nội dung này. Vui lòng liên hệ Admin hoặc quay lại.
        </p>
      </div>
      <Button variant="primary" onClick={() => navigate(-1)}>
        Quay lại trang trước
      </Button>
    </div>
  );
};
export default PermissionState;
