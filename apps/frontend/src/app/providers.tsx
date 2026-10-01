/* eslint-disable react-refresh/only-export-components -- provider and its hook form one public API */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Check, Info, LoaderCircle, TriangleAlert, X } from 'lucide-react';
import type { User } from '@/types';
import { authStorage } from '@/lib/auth/storage';

// ----------------------------------------------------
// TanStack Query Configuration
// ----------------------------------------------------
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes default
      retry: (failureCount, error: any) => {
        if (failureCount >= 3) return false;
        // Do not retry authorization or resource missing errors
        if ([401, 403, 404].includes(error?.status)) {
          return false;
        }
        return true;
      },
    },
  },
});

// ----------------------------------------------------
// Authentication Context & Provider
// ----------------------------------------------------
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = authStorage.getUser();
    const token = authStorage.getToken();
    if (savedUser && token) {
      setUser(savedUser);
    } else {
      authStorage.clearAll();
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, userData: User) => {
    authStorage.setToken(token);
    authStorage.setUser(userData);
    setUser(userData);
  };

  const logout = () => {
    authStorage.clearAll();
    setUser(null);
    window.location.href = '/';
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      authStorage.setUser(updatedUser);
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ----------------------------------------------------
// Unified Providers Component
// ----------------------------------------------------
export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          expand={false}
          gap={10}
          duration={4000}
          visibleToasts={4}
          icons={{
            success: <Check size={20} strokeWidth={3.25} />,
            error: <X size={20} strokeWidth={3} />,
            warning: <TriangleAlert size={19} strokeWidth={2.6} />,
            info: <Info size={19} strokeWidth={2.6} />,
            loading: <LoaderCircle className="app-toast-spinner" size={19} strokeWidth={2.6} />,
          }}
          toastOptions={{
            classNames: {
              toast: 'app-toast',
              content: 'app-toast-content',
              title: 'app-toast-title',
              description: 'app-toast-description',
              icon: 'app-toast-icon',
              success: 'app-toast-success',
              error: 'app-toast-error',
              warning: 'app-toast-warning',
              info: 'app-toast-info',
              loading: 'app-toast-loading',
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
};
