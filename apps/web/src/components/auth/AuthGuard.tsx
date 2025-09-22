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

  // Show loading while checking authentication
  if (isChecking || (requireAuth && isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect authenticated users away from auth pages
  if (!requireAuth && isAuthenticated && (pathname === '/login' || pathname === '/register')) {
    router.push('/dashboard');
    return null;
  }

  // Redirect unauthenticated users to login for protected routes
  if (requireAuth && !isAuthenticated) {
    router.push('/login');
    return null;
  }

  return <>{children}</>;
}
