import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-slate-50)',
        padding: 'var(--spacing-6)',
        textAlign: 'center',
        gap: 'var(--spacing-6)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-primary-50)',
          color: 'var(--color-primary-700)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <FileQuestion size={44} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-primary-950)' }}>
          404 - Không tìm thấy trang
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-500)', maxWidth: '42ch', margin: '0 auto' }}>
          Đường dẫn bạn yêu cầu không tồn tại trong hệ thống, đã bị di dời hoặc bị xóa bỏ.
        </p>
      </div>
      <Button variant="primary" onClick={() => navigate('/')}>
        Trở về Trang chủ
      </Button>
    </div>
  );
}
