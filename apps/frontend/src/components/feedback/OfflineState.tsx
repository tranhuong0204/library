import { WifiOff } from 'lucide-react';

export const OfflineState = () => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--spacing-3)',
        padding: 'var(--spacing-3) var(--spacing-4)',
        backgroundColor: 'var(--color-slate-800)',
        color: 'white',
        fontSize: 'var(--text-sm)',
        fontWeight: 600,
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <WifiOff size={18} style={{ color: 'var(--color-accent-400)' }} />
      <span>Không có kết nối mạng. Ứng dụng đang chạy ở chế độ offline.</span>
    </div>
  );
};
export default OfflineState;
