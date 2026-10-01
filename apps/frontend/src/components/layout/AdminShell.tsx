import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ChevronRight, FileText, FolderTree, LayoutDashboard, LogOut,
  Menu, Newspaper, ShieldCheck, Tags, UserRoundCog, Users, X,
} from 'lucide-react';
import { useAuth } from '@/app/providers';
import { preloadRoute } from '@/app/routePreloaders';
import { Avatar } from '@/components/ui/Avatar';
import { DropdownMenu } from '@/components/ui/DropdownMenu';

interface AdminShellProps { children: React.ReactNode }

const adminNavItems = [
  { label: 'Tổng quan', path: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Người dùng', path: '/admin/users', icon: Users },
  { label: 'Tài liệu', path: '/admin/documents', icon: FileText },
  { label: 'Danh mục tài liệu', path: '/admin/categories', icon: Tags },
  { label: 'Quản lý diễn đàn', path: '/admin/forum', icon: ShieldCheck, end: true },
  { label: 'Danh mục diễn đàn', path: '/admin/forum/categories', icon: FolderTree },
  { label: 'Tin tức & thông báo', path: '/admin/news', icon: Newspaper },
  { label: 'Quản lý nhóm', path: '/admin/groups', icon: UserRoundCog },
];

export const AdminShell = ({ children }: AdminShellProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => setMobileMenuOpen(false), [location.pathname]);

  const profileMenuItems = useMemo(() => [
    { label: 'Về trang chính', onClick: () => navigate('/'), icon: <ArrowLeft size={16} /> },
    { label: 'Đăng xuất', onClick: logout, icon: <LogOut size={16} />, danger: true },
  ], [logout, navigate]);

  const sidebar = (
    <>
      <div className="shell-brand admin-brand" onClick={() => navigate('/admin')} role="button" tabIndex={0}>
        <span className="shell-brand-mark">LA</span>
        <span><strong>Library AI</strong><small>Administration</small></span>
      </div>
      <div className="shell-nav-label">Trung tâm quản trị</div>
      <nav className="shell-nav" aria-label="Điều hướng quản trị">
        {adminNavItems.map(({ label, path, icon: Icon, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className={({ isActive }) => `shell-nav-link ${isActive ? 'is-active' : ''}`}
            onMouseEnter={() => preloadRoute(path)}
            onFocus={() => preloadRoute(path)}
          >
            <span className="shell-nav-icon"><Icon size={18} strokeWidth={1.8} /></span>
            <span>{label}</span><ChevronRight className="shell-nav-arrow" size={15} />
          </NavLink>
        ))}
      </nav>
      <button className="shell-ai-card admin-return-card" onClick={() => navigate('/')}>
        <span><ArrowLeft size={16} /> Giao diện người dùng</span>
        <strong>Về Library AI</strong>
        <small>Trở lại thư viện và không gian làm việc.</small>
      </button>
    </>
  );

  return (
    <div className="app-shell admin-shell">
      <aside className="shell-sidebar">{sidebar}</aside>
      {mobileMenuOpen && <button className="shell-drawer-backdrop" aria-label="Đóng menu" onClick={() => setMobileMenuOpen(false)} />}
      <aside className={`shell-mobile-drawer ${mobileMenuOpen ? 'is-open' : ''}`}>{sidebar}</aside>
      <div className="shell-stage">
        <header className="shell-header">
          <div className="shell-header-leading">
            <button className="icon-btn shell-menu-button" onClick={() => setMobileMenuOpen((open) => !open)} aria-label="Mở menu">
              {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
            <div className="shell-breadcrumb"><span>Quản trị</span><ChevronRight size={13} /><strong>{adminNavItems.find((item) => item.path === location.pathname)?.label || 'Hệ thống'}</strong></div>
          </div>
          <div className="shell-header-actions">
            <button className="btn btn-sm btn-outline shell-back-button" onClick={() => navigate('/')}><ArrowLeft size={15} /> Về trang chính</button>
            <DropdownMenu
              trigger={
                <button className="shell-user admin-user-trigger" aria-label="Mở menu quản trị viên">
                  <div className="shell-user-copy">
                    <strong>{user?.fullName || 'Quản trị viên'}</strong>
                    <small>Administrator</small>
                  </div>
                  <Avatar fallback={user?.fullName || 'A'} size={40} />
                </button>
              }
              items={profileMenuItems}
              align="right"
            />
          </div>
        </header>
        <main className="shell-main"><div className="route-content">{children}</div></main>
      </div>
    </div>
  );
};

export default AdminShell;
