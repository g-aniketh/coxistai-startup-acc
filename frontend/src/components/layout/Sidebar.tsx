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
  Building2,
  MessageSquare,
  HelpCircle,
  Coffee
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';

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
      name: 'Analytics',
      href: '/dashboard',
      icon: LayoutDashboard,
      permission: { action: 'read', subject: 'cashflow_dashboard' }
    },
    {
      name: 'Products',
      href: '/inventory',
      icon: Package,
      permission: { action: 'read', subject: 'inventory_dashboard' }
    },
    {
      name: 'Messages',
      href: '/ai-copilot',
      icon: MessageSquare,
      permission: { action: 'read', subject: 'analytics' }
    },
    {
      name: 'Customers',
      href: '/team',
      icon: Users,
      roles: ['Admin']
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
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <div className="h-4 w-4 bg-white rounded-sm"></div>
          </div>
          <div>
            <h2 className="font-bold text-lg">Business</h2>
          </div>
        </div>
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
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
        
        {/* Separator */}
        <div className="my-4 border-t border-border"></div>
        
        {/* Settings */}
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            pathname === '/settings'
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
        
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground w-full transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </nav>

      {/* Help Section */}
      <div className="p-4 border-t border-border">
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Coffee className="h-4 w-4 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-medium">Need help</h4>
              <p className="text-xs text-muted-foreground">feel free to contact</p>
            </div>
          </div>
          <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            Get support
          </Button>
        </div>
      </div>
    </div>
  );
}

