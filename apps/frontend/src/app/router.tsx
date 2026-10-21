import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './providers';
import { pageLoaders } from './routePreloaders';

// Loading Fallback Component
const PageLoader: React.FC = () => (
  <div className="page-loader" role="status" aria-live="polite">
    <div className="page-loader-mark"><span>LA</span></div>
    <div className="page-loader-copy">
      <strong>Đang chuẩn bị không gian của bạn</strong>
      <span>Chỉ mất một chút thời gian...</span>
    </div>
  </div>
);

// ----------------------------------------------------
// Route Guards
// ----------------------------------------------------
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageLoader />;

  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const returnUrl = query.get('returnUrl');

  if (isLoading) return <PageLoader />;

  if (isAuthenticated) {
    const destination = returnUrl ? decodeURIComponent(returnUrl) : (user?.role === 'ADMIN' ? '/admin' : '/');
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
};

const RootRoute: React.FC<{ landing: React.ReactNode; home: React.ReactNode }> = ({ landing, home }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;

  return <>{isAuthenticated ? home : landing}</>;
};

// ----------------------------------------------------
// Lazy Loaded Pages
// ----------------------------------------------------
// Auth Pages
const LandingPage = lazy(pageLoaders.landing);
const LoginPage = lazy(pageLoaders.login);
const RegisterPage = lazy(pageLoaders.register);
const ForgotPasswordPage = lazy(pageLoaders.forgotPassword);
const ResetPasswordPage = lazy(pageLoaders.resetPassword);

// Main Pages
const HomePage = lazy(pageLoaders.home);
const LibraryPage = lazy(pageLoaders.library);
const DocumentDetailPage = lazy(pageLoaders.documentDetail);
const FavoritesPage = lazy(pageLoaders.favorites);
const AiWorkspacePage = lazy(pageLoaders.ai);

const NewsFeedPage = lazy(pageLoaders.news);
const NewsDetailPage = lazy(pageLoaders.newsDetail);
const NotificationsPage = lazy(pageLoaders.notifications);
const ProfilePage = lazy(pageLoaders.profile);

// Admin Pages
const AdminDashboardPage = lazy(pageLoaders.adminDashboard);
const AdminUsersPage = lazy(pageLoaders.adminUsers);
const AdminDocumentsPage = lazy(pageLoaders.adminDocuments);
const AdminCategoriesPage = lazy(pageLoaders.adminCategories);
const AdminNewsPage = lazy(pageLoaders.adminNews);

// Feedback Pages
const ForbiddenPage = lazy(pageLoaders.forbidden);
const NotFoundPage = lazy(pageLoaders.notFound);

// ----------------------------------------------------
// Router Component
// ----------------------------------------------------
export const AppRouter: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public / Auth routes */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
        
        {/* User Shell routes */}
        <Route path="/" element={<RootRoute landing={<LandingPage />} home={<HomePage />} />} />
        <Route path="/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
        <Route path="/library/:id" element={<ProtectedRoute><DocumentDetailPage /></ProtectedRoute>} />
        <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
        <Route path="/ai" element={<ProtectedRoute><AiWorkspacePage /></ProtectedRoute>} />

        <Route path="/news" element={<ProtectedRoute><NewsFeedPage /></ProtectedRoute>} />
        <Route path="/news/:id" element={<ProtectedRoute><NewsDetailPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        {/* Admin Shell routes */}
        <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
        <Route path="/admin/documents" element={<AdminRoute><AdminDocumentsPage /></AdminRoute>} />
        <Route path="/admin/documents/:id" element={<AdminRoute><DocumentDetailPage adminMode /></AdminRoute>} />
        <Route path="/admin/categories" element={<AdminRoute><AdminCategoriesPage /></AdminRoute>} />
        <Route path="/admin/news" element={<AdminRoute><AdminNewsPage /></AdminRoute>} />

        {/* Feedback & Fallback routes */}
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
};
