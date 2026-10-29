import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Bell, BookOpen, ChevronRight, Heart, Home, LayoutDashboard, LogOut,
  Menu, MessageSquareCode, Newspaper, Search,
  Sparkles, User as UserIcon, X,
} from 'lucide-react';
import { useAuth } from '@/app/providers';
import { preloadMainNavigation, preloadRoute } from '@/app/routePreloaders';
import { apiClient } from '@/lib/api/client';
import { normalizeNotification } from '@/lib/normalizers';
import { buildLibrarySearchPath, findActiveNavigationItem } from '@/lib/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { BrandLogo } from '@/components/ui/BrandLogo';

interface AppShellProps { children: React.ReactNode }

const navigationItems = [
  { label: 'Trang chủ', path: '/', icon: Home, end: true },
  { label: 'Thư viện tài liệu', path: '/library', icon: BookOpen },
  { label: 'Tài liệu yêu thích', path: '/favorites', icon: Heart },
  { label: 'AI Workspace', path: '/ai', icon: MessageSquareCode },
  { label: 'Tin tức', path: '/news', icon: Newspaper },
  { label: 'Thông báo', path: '/notifications', icon: Bell },
];

export const AppShell = ({ children }: AppShellProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  useEffect(() => setMobileMenuOpen(false), [location.pathname]);
  useEffect(() => {
    const run = () => preloadMainNavigation();
    const id = window.requestIdleCallback?.(run, { timeout: 1800 });
    const timer = id === undefined ? window.setTimeout(run, 700) : undefined;
    return () => {
      if (id !== undefined) window.cancelIdleCallback?.(id);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: async () => {
      const response = await apiClient.get('/notifications');
      return (Array.isArray(response.data) ? response.data : []).map(normalizeNotification);
    },
    refetchInterval: 15000,
    enabled: !!user,
  });
  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const activeNavigationItem = findActiveNavigationItem(navigationItems, location.pathname);

  const submitGlobalSearch = (event: React.FormEvent) => {
    event.preventDefault();
    navigate(buildLibrarySearchPath(globalSearch));
  };

  const profileMenuItems = useMemo(() => [
    { label: 'Hồ sơ cá nhân', onClick: () => navigate('/profile'), icon: <UserIcon size={16} /> },
    ...(user?.role === 'ADMIN'
      ? [{ label: 'Trang quản trị', onClick: () => navigate('/admin'), icon: <LayoutDashboard size={16} /> }]
      : user?.role === 'LIBRARIAN'
      ? [{ label: 'Nghiệp vụ thủ thư', onClick: () => navigate('/admin/documents'), icon: <BookOpen size={16} /> }]
      : []),
    { label: 'Đăng xuất', onClick: logout, icon: <LogOut size={16} />, danger: true },
  ], [logout, navigate, user?.role]);

  const sidebar = (
    <>
      <div
        className="shell-brand"
        onClick={() => navigate('/')}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') navigate('/');
        }}
        role="button"
        tabIndex={0}
      >
        <BrandLogo subtitle="Knowledge Workspace" variant="light" />
      </div>
      <div className="shell-nav-label">Không gian làm việc</div>
      <nav className="shell-nav" aria-label="Điều hướng chính">
        {navigationItems.map(({ label, path, icon: Icon, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className={({ isActive }) => `shell-nav-link ${isActive ? 'is-active' : ''}`}
            onMouseEnter={() => preloadRoute(path)}
            onFocus={() => preloadRoute(path)}
            onTouchStart={() => preloadRoute(path)}
          >
            <span className="shell-nav-icon">
              <Icon size={18} strokeWidth={1.8} />
              {path === '/notifications' && unreadCount > 0 && <i>{unreadCount > 99 ? '99+' : unreadCount}</i>}
            </span>
            <span>{label}</span>
            <ChevronRight className="shell-nav-arrow" size={15} />
          </NavLink>
        ))}
      </nav>
      <button className="shell-ai-card" onClick={() => navigate('/ai')}>
        <span><Sparkles size={16} /> Trợ lý tri thức</span>
        <strong>Hỏi Library AI</strong>
        <small>Tóm tắt tài liệu và khám phá kiến thức nhanh hơn.</small>
      </button>
    </>
  );

  return (
    <div className="app-shell">
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
              <span>Library AI</span><ChevronRight size={13} /><strong>{activeNavigationItem?.label || 'Không gian tri thức'}</strong>
            </div>
          </div>
          <div className="shell-header-center">
            <form className="shell-global-search" onSubmit={submitGlobalSearch}>
              <Search size={16} />
              <input
                value={globalSearch}
                onChange={(event) => setGlobalSearch(event.target.value)}
                placeholder="Tìm tài liệu, giáo trình..."
                aria-label="Tìm kiếm nhanh trong thư viện"
              />
              <kbd>Enter</kbd>
            </form>
          </div>
          <div className="shell-header-actions">
            <button
              className="icon-btn shell-notification-button"
              onClick={() => navigate('/notifications')}
              aria-label={`Thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ''}`}
            >
              <Bell size={19} />
              {unreadCount > 0 && <i>{unreadCount > 9 ? '9+' : unreadCount}</i>}
            </button>
            {user?.role === 'ADMIN' && (
              <button
                className="btn btn-sm btn-outline shell-back-button shell-admin-entry-button"
                onClick={() => navigate('/admin')}
              >
                <LayoutDashboard size={15} /> Trang quản trị
              </button>
            )}
            {user?.role === 'LIBRARIAN' && (
              <button
                className="btn btn-sm btn-outline shell-back-button shell-admin-entry-button"
                onClick={() => navigate('/admin/documents')}
              >
                <BookOpen size={15} /> Nghiệp vụ thủ thư
              </button>
            )}
            <DropdownMenu
              trigger={
                <button className="shell-user" aria-label="Mở menu tài khoản">
                  <div className="shell-user-copy">
                    <strong>{user?.fullName || 'Thành viên'}</strong>
                    <small>{user?.role === 'ADMIN' ? 'Quản trị viên' : user?.role === 'LIBRARIAN' ? 'Thủ thư' : 'Học viên'}</small>
                  </div>
                  <Avatar fallback={user?.fullName || (user?.role === 'LIBRARIAN' ? 'L' : 'U')} size={40} />
                </button>
              }
              items={profileMenuItems}
              align="right"
            />
          </div>
        </header>
        <main className="shell-main">
          <div className="route-content">{children}</div>
        </main>
      </div>
      <nav className="shell-bottom-nav" aria-label="Điều hướng nhanh trên thiết bị di động">
        {navigationItems.slice(0, 6).filter((item) => !['/favorites'].includes(item.path)).map(({ label, path, icon: Icon, end }) => (
          <NavLink key={path} to={path} end={end} className={({ isActive }) => isActive ? 'is-active' : ''}>
            <Icon size={19} strokeWidth={1.9} />
            <span>{label.replace(' tài liệu', '').replace(' học tập', '')}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default AppShell;
