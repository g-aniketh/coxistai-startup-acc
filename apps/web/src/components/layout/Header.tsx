'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import {
  Bell,
  Search,
  Settings,
  User,
  Menu,
  X,
  Sun,
  Moon,
  Sparkles,
  TrendingUp,
  Activity,
} from 'lucide-react';

interface HeaderProps {
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export default function Header({ onMenuToggle, isMenuOpen }: HeaderProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const getPageTitle = () => {
    const routes = {
      '/dashboard': 'Dashboard',
      '/cfo-dashboard': 'CFO Dashboard',
      '/transactions': 'Transactions',
      '/financial-health': 'Financial Health',
      '/forecasting': 'AI Forecasting',
      '/revenue-metrics': 'Revenue Metrics',
      '/investor-updates': 'Investor Updates',
      '/alerts': 'Alerts',
      '/users': 'Users',
      '/tenants': 'Tenants',
      '/settings': 'Settings',
    };
    return routes[pathname as keyof typeof routes] || 'Dashboard';
  };

  const getPageIcon = () => {
    const iconMap = {
      '/dashboard': TrendingUp,
      '/cfo-dashboard': Activity,
      '/transactions': TrendingUp,
      '/financial-health': Activity,
      '/forecasting': Sparkles,
      '/revenue-metrics': TrendingUp,
      '/investor-updates': TrendingUp,
      '/alerts': Bell,
      '/users': User,
      '/tenants': User,
      '/settings': Settings,
    };
    const Icon = iconMap[pathname as keyof typeof iconMap] || TrendingUp;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <header className="glass border-b border-border animate-fade-in">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side - Logo and navigation */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5 text-foreground" />
            ) : (
              <Menu className="h-5 w-5 text-foreground" />
            )}
          </button>

          {/* Page title with icon */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              {getPageIcon()}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {getPageTitle()}
              </h1>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search transactions, users, or reports..."
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-accent transition-colors group">
            <Bell className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full animate-pulse" />
          </button>

          {/* Theme toggle placeholder */}
          <button className="p-2 rounded-lg hover:bg-accent transition-colors group">
            <Moon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>

          {/* User menu */}
          <div className="flex items-center gap-3 pl-2 border-l border-border">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">
                {user?.email}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {user?.role}
              </p>
            </div>
            <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center">
              <span className="text-xs font-medium text-white">
                {user?.email.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
