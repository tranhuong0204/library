import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ChevronRight, FileText, LayoutDashboard, LogOut,
  Menu, Newspaper, ShieldCheck, Tags, Users, X,
} from 'lucide-react';
import { useAuth } from '@/app/providers';
import { preloadRoute } from '@/app/routePreloaders';
import { Avatar } from '@/components/ui/Avatar';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { BrandLogo } from '@/components/ui/BrandLogo';

interface AdminShellProps { children: React.ReactNode }

export const AdminShell = ({ children }: AdminShellProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => setMobileMenuOpen(false), [location.pathname]);

  const isLibrarian = user?.role === 'LIBRARIAN';

  const navItems = useMemo(() => {
    if (isLibrarian) {
      return [
        { label: 'Tài liệu', path: '/admin/documents', icon: FileText },
        { label: 'Danh mục tài liệu', path: '/admin/categories', icon: Tags },
        { label: 'Quản lý bản quyền', path: '/admin/copyrights', icon: ShieldCheck },
      ];
    }
    return [
      { label: 'Tổng quan', path: '/admin', icon: LayoutDashboard, end: true },
      { label: 'Người dùng', path: '/admin/users', icon: Users },
      { label: 'Tài liệu', path: '/admin/documents', icon: FileText },
      { label: 'Danh mục tài liệu', path: '/admin/categories', icon: Tags },
      { label: 'Quản lý bản quyền', path: '/admin/copyrights', icon: ShieldCheck },
      { label: 'Tin tức & thông báo', path: '/admin/news', icon: Newspaper },
    ];
  }, [isLibrarian]);

  const profileMenuItems = useMemo(() => [
    { label: 'Về trang chính', onClick: () => navigate('/'), icon: <ArrowLeft size={16} /> },
    { label: 'Đăng xuất', onClick: logout, icon: <LogOut size={16} />, danger: true },
  ], [logout, navigate]);

  const defaultHomePath = isLibrarian ? '/admin/documents' : '/admin';

  const sidebar = (
    <>
      <div className="shell-brand admin-brand" onClick={() => navigate(defaultHomePath)} role="button" tabIndex={0}>
        <BrandLogo subtitle={isLibrarian ? 'Nghiệp vụ thủ thư' : 'Hệ thống quản trị'} variant="light" />
      </div>
      <div className="shell-nav-label">{isLibrarian ? 'Nghiệp vụ thủ thư' : 'Trung tâm quản trị'}</div>
      <nav className="shell-nav" aria-label="Điều hướng quản trị">
        {navItems.map(({ label, path, icon: Icon, end }) => (
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
            <div className="shell-breadcrumb">
              <span>{isLibrarian ? 'Thủ thư' : 'Quản trị'}</span>
              <ChevronRight size={13} />
              <strong>{navItems.find((item) => item.path === location.pathname)?.label || 'Hệ thống'}</strong>
            </div>
          </div>
          <div className="shell-header-actions">
            <button className="btn btn-sm btn-outline shell-back-button" onClick={() => navigate('/')}><ArrowLeft size={15} /> Về trang chính</button>
            <DropdownMenu
              trigger={
                <button className="shell-user admin-user-trigger" aria-label={isLibrarian ? 'Mở menu thủ thư' : 'Mở menu quản trị viên'}>
                  <div className="shell-user-copy">
                    <strong>{user?.fullName || (isLibrarian ? 'Thủ thư' : 'Quản trị viên')}</strong>
                    <small>{isLibrarian ? 'Thủ thư' : 'Administrator'}</small>
                  </div>
                  <Avatar fallback={user?.fullName || (isLibrarian ? 'L' : 'A')} size={40} />
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
