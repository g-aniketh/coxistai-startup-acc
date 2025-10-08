'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { api, Tenant } from '@/lib/api';
import AuthGuard from '@/components/auth/AuthGuard';
import { Sparkles, Eye, EyeOff } from 'lucide-react';
import GradientText from '@/components/GradientText';
import Magnet from '@/components/Magnet';
import Aurora from '@/components/Aurora';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'member',
  });
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const loadTenants = async () => {
      try {
        const response = await api.tenants.list();
        if (response.success) setTenants(response.data || []);
      } catch (error) {
        console.error('Failed to load tenants:', error);
      } finally {
        setLoadingTenants(false);
      }
    };
    loadTenants();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (formData.password !== formData.confirmPassword) {
      // You should handle this error more gracefully
      alert('Passwords do not match');
      return;
    }
    if (!selectedTenantId) {
      alert('Please select an organization');
      return;
    }
    const success = await register(
      formData.email,
      formData.password,
      selectedTenantId,
      formData.role
    );
    if (success) {
      router.push('/dashboard');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <Aurora colorStops={['#ec4899', '#8b5cf6', '#6366f1']} />
        </div>
        <div className="w-full max-w-md relative z-10 space-y-8">
           <div className="text-center">
            <div className="inline-block p-2 bg-card/50 border border-border rounded-full mb-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold">
              <GradientText>Create an Account</GradientText>
            </h1>
            <p className="text-muted-foreground mt-2">
              Join CoXist AI and unlock your startup's potential.
            </p>
          </div>

          <div className="glass p-8 rounded-2xl">
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg text-center text-sm text-destructive">
                  {error}
                </div>
              )}
              
              <input
                name="email"
                type="email"
                required
                className="w-full px-4 py-2 border border-border rounded-lg bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full px-4 py-2 pr-10 border border-border rounded-lg bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="relative">
                 <input
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className="w-full px-4 py-2 pr-10 border border-border rounded-lg bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
               <select
                  name="role"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-transparent text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <select
                  name="tenantId"
                  required
                  className="w-full px-3 py-2 border border-border rounded-lg bg-transparent text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  disabled={loadingTenants}
                >
                  <option value="">{loadingTenants ? 'Loading...' : 'Select Organization'}</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                  ))}
                </select>

              <Magnet>
                <button
                  type="submit"
                  disabled={isLoading || loadingTenants}
                  className={cn(
                    'w-full bg-primary text-primary-foreground font-medium py-3 px-4 rounded-lg',
                    'hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
                    'disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200'
                  )}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </button>
              </Magnet>
            </form>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-primary hover:text-primary/80"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </AuthGuard>
  );
}
