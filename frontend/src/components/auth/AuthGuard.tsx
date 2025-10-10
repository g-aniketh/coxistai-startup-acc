'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      if (requireAuth) {
        const authSuccess = await checkAuth();
        if (!authSuccess) {
          router.push('/login');
          return;
        }
      }
      setIsChecking(false);
    };

    initAuth();
  }, [requireAuth, checkAuth, router]);

  // Handle redirects for authenticated users on auth pages
  useEffect(() => {
    if (!requireAuth && isAuthenticated && !isLoading && !isChecking) {
      if (pathname === '/login' || pathname === '/register') {
        router.push('/dashboard');
      }
    }
  }, [requireAuth, isAuthenticated, isLoading, isChecking, pathname, router]);

  // Handle redirects for unauthenticated users on protected routes
  useEffect(() => {
    if (requireAuth && !isAuthenticated && !isLoading && !isChecking) {
      router.push('/login');
    }
  }, [requireAuth, isAuthenticated, isLoading, isChecking, router]);

  // Show loading while checking authentication
  if (isChecking || (requireAuth && isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-dark animate-fade-in">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if we're redirecting
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (!requireAuth && isAuthenticated && (pathname === '/login' || pathname === '/register')) {
    return null;
  }

  return <>{children}</>;
}
