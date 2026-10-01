import PermissionState from './PermissionState';

export default function ForbiddenPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-slate-50)',
        padding: 'var(--spacing-4)',
      }}
    >
      <PermissionState />
    </div>
  );
}
