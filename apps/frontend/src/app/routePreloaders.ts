import type { ComponentType } from 'react';

type PageModule = Promise<{ default: ComponentType<any> }>;
type PageLoader = () => PageModule;

export const pageLoaders = {
  landing: () => import('@/features/landing/pages/LandingPage'),
  login: () => import('@/features/auth/pages/LoginPage'),
  register: () => import('@/features/auth/pages/RegisterPage'),
  forgotPassword: () => import('@/features/auth/pages/ForgotPasswordPage'),
  resetPassword: () => import('@/features/auth/pages/ResetPasswordPage'),
  home: () => import('@/features/documents/pages/HomePage'),
  library: () => import('@/features/documents/pages/LibraryPage'),
  documentDetail: () => import('@/features/documents/pages/DocumentDetailPage'),
  favorites: () => import('@/features/documents/pages/FavoritesPage'),
  ai: () => import('@/features/ai/pages/AiWorkspacePage'),
  news: () => import('@/features/news/pages/NewsFeedPage'),
  newsDetail: () => import('@/features/news/pages/NewsDetailPage'),
  notifications: () => import('@/features/notifications/pages/NotificationsPage'),
  profile: () => import('@/features/users/pages/ProfilePage'),
  adminDashboard: () => import('@/features/admin/pages/AdminDashboardPage'),
  adminUsers: () => import('@/features/admin/pages/AdminUsersPage'),
  adminDocuments: () => import('@/features/admin/pages/AdminDocumentsPage'),
  adminCategories: () => import('@/features/admin/pages/AdminCategoriesPage'),
  adminNews: () => import('@/features/admin/pages/AdminNewsPage'),
  forbidden: () => import('@/components/feedback/ForbiddenPage'),
  notFound: () => import('@/components/feedback/NotFoundPage'),
} satisfies Record<string, PageLoader>;

const routeLoaders: Array<[test: (path: string) => boolean, load: PageLoader]> = [
  [(path) => path === '/', pageLoaders.landing],
  [(path) => path === '/library', pageLoaders.library],
  [(path) => path.startsWith('/library/'), pageLoaders.documentDetail],
  [(path) => path === '/favorites', pageLoaders.favorites],
  [(path) => path === '/ai', pageLoaders.ai],
  [(path) => path === '/news', pageLoaders.news],
  [(path) => path.startsWith('/news/'), pageLoaders.newsDetail],
  [(path) => path === '/notifications', pageLoaders.notifications],
  [(path) => path === '/profile', pageLoaders.profile],
  [(path) => path === '/admin', pageLoaders.adminDashboard],
  [(path) => path === '/admin/users', pageLoaders.adminUsers],
  [(path) => path === '/admin/documents', pageLoaders.adminDocuments],
  [(path) => path === '/admin/categories', pageLoaders.adminCategories],
  [(path) => path === '/admin/news', pageLoaders.adminNews],
];

export const preloadRoute = (path: string): void => {
  routeLoaders.find(([test]) => test(path))?.[1]();
};

export const preloadMainNavigation = (): void => {
  [
    pageLoaders.home,
    pageLoaders.library,
    pageLoaders.favorites,
    pageLoaders.ai,
    pageLoaders.news,
    pageLoaders.notifications,
    pageLoaders.profile,
  ].forEach((load) => load());
};
