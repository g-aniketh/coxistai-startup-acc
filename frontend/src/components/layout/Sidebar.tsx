'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  Receipt,
  Users,
  Settings,
  Bell,
  FileText,
  Sparkles,
  LogOut,
  Building2
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: { action: string; subject: string };
  roles?: string[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const { can, hasRole, isAdmin } = usePermissions();
  const { user, logout } = useAuthStore();

  const navigation: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      permission: { action: 'read', subject: 'cashflow_dashboard' }
    },
    {
      name: 'Transactions',
      href: '/transactions',
      icon: Receipt,
      permission: { action: 'read', subject: 'transactions' }
    },
    {
      name: 'Inventory',
      href: '/inventory',
      icon: Package,
      permission: { action: 'read', subject: 'inventory_dashboard' }
    },
    {
      name: 'AI Copilot',
      href: '/ai-copilot',
      icon: Sparkles,
      permission: { action: 'read', subject: 'analytics' }
    },
    {
      name: 'Team Management',
      href: '/team',
      icon: Users,
      roles: ['Admin'] // Only admins can see this
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
    },
  ];

  // Filter navigation items based on permissions
  const visibleNavItems = navigation.filter(item => {
    // If item requires specific roles
    if (item.roles) {
      return hasRole(item.roles);
    }
    
    // If item requires specific permission
    if (item.permission) {
      return can(item.permission.action, item.permission.subject);
    }
    
    // No restrictions - show to everyone
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-lg">CoXist AI</h2>
            <p className="text-xs text-muted-foreground">Your AI CFO</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.firstName || user?.email}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.startup.name}
            </p>
          </div>
        </div>
        {user && (
          <div className="mt-2 flex flex-wrap gap-1">
            {user.roles.map(role => (
              <span
                key={role}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
              >
                {role}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer - Logout */}
      <div className="p-4 border-t border-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground w-full transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}

