'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import {
  Home,
  Users,
  Building2,
  Settings,
  LogOut,
  BarChart3,
  FileText,
  Banknote,
  Heart,
  Sparkles,
  Newspaper,
  Bell,
  TrendingUp,
  Wallet,
  PieChart,
  Target,
  Calendar,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, category: 'main' },
  { name: 'CFO Dashboard', href: '/cfo-dashboard', icon: BarChart3, category: 'financial' },
  { name: 'Transactions', href: '/transactions', icon: FileText, category: 'financial' },
  { name: 'Financial Health', href: '/financial-health', icon: Heart, category: 'financial' },
  { name: 'AI Forecasting', href: '/forecasting', icon: Sparkles, category: 'ai' },
  { name: 'Revenue Metrics', href: '/revenue-metrics', icon: TrendingUp, category: 'analytics' },
  { name: 'Investor Updates', href: '/investor-updates', icon: Newspaper, category: 'communication' },
  { name: 'Alerts', href: '/alerts', icon: Bell, category: 'communication' },
  { name: 'Users', href: '/users', icon: Users, category: 'admin' },
  { name: 'Tenants', href: '/tenants', icon: Building2, category: 'admin' },
  { name: 'Settings', href: '/settings', icon: Settings, category: 'admin' },
];

const categoryIcons = {
  financial: Wallet,
  ai: Sparkles,
  analytics: PieChart,
  communication: Bell,
  admin: Settings,
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  // Group navigation by category
  const groupedNavigation = navigation.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof navigation>);

  const categoryLabels = {
    main: 'Overview',
    financial: 'Financial',
    ai: 'AI Insights',
    analytics: 'Analytics',
    communication: 'Communication',
    admin: 'Administration',
  };

  return (
    <div className="flex h-full w-72 flex-col glass border-r border-border animate-slide-in">
      {/* Logo */}
      <div className="flex h-20 shrink-0 items-center px-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">CoXist AI</h1>
            <p className="text-xs text-muted-foreground">Startup Accelerator</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div className="border-b border-border px-6 py-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {user.email}
              </p>
              <p className="truncate text-xs text-muted-foreground capitalize">
                {user.role} • {user.tenant.name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-4 py-6 space-y-6 overflow-y-auto">
        {Object.entries(groupedNavigation).map(([category, items]) => (
          <div key={category} className="space-y-2">
            {category !== 'main' && (
              <div className="flex items-center gap-2 px-2 py-1">
                {(() => {
                  const IconComponent = categoryIcons[category as keyof typeof categoryIcons];
                  return IconComponent ? <IconComponent className="h-4 w-4 text-muted-foreground" /> : null;
                })()}
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </span>
              </div>
            )}
            <ul className="space-y-1">
              {items.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        "hover:bg-accent hover:text-accent-foreground",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "text-muted-foreground"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5 shrink-0 transition-transform duration-200",
                          isActive ? "scale-110" : "group-hover:scale-105"
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                      {isActive && (
                        <div className="ml-auto h-2 w-2 rounded-full bg-primary-foreground animate-pulse" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="border-t border-border p-4">
        <button
          onClick={logout}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-105" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
