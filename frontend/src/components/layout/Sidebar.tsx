'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BarChart2,
  CreditCard,
  Repeat,
  Package,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  Sparkles,
  AlertTriangle,
  FileText,
  Bot,
  User,
  Calculator,
  Globe,
  Upload,
  ChevronLeft,
  ChevronRight,
  HandCoins,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import Image from 'next/image';
import { Tooltip } from '@/components/ui/tooltip';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Assistant', href: '/ai-assistant', icon: Sparkles },
    { name: 'Compliance Hub', href: '/compliance-hub', icon: Calculator },
    { name: 'Banking & Payments', href: '/banking-payments', icon: CreditCard },
    { name: 'Vouchers', href: '/vouchers', icon: FileText },
    { name: 'Bills', href: '/bills', icon: HandCoins },
    { name: 'GST', href: '/gst', icon: Globe },
    { name: 'Cost Management', href: '/cost-management', icon: Settings },
    { name: 'Smart Alerts', href: '/alerts', icon: AlertTriangle },
    { name: 'Financial Dashboard', href: '/financial-dashboard', icon: BarChart2 },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Import from Tally', href: '/tally-import', icon: Upload },
  ];

  const NavLink = ({ item, isActive }: { item: NavItem; isActive: boolean }) => {
    const Icon = item.icon;
    const linkElement = (
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative w-full',
          collapsed ? 'justify-center' : '',
          isActive
            ? 'bg-gray-700/50 text-white'
            : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
        )}
      >
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-blue-500 rounded-r-full" />
        )}
        <Icon className="h-5 w-5 shrink-0" />
        {!collapsed && <span>{item.name}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip content={item.name} side="right">
          {linkElement}
        </Tooltip>
      );
    }

    return linkElement;
  };

  return (
    <div className={cn(
      "relative flex flex-col h-full bg-[#1E1E1E] text-white transition-all duration-300",
      collapsed ? "w-20" : "w-64"
    )}>
      {/* Toggle Button - At the very top */}
      {onToggleCollapse && (
        <div className={cn(
          "flex items-center justify-end p-4 pb-2",
          collapsed ? "justify-center" : ""
        )}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse();
            }}
            className={cn(
              "flex items-center justify-center w-8 h-8",
              "bg-gray-800 hover:bg-gray-700 border border-gray-600",
              "rounded-full shadow-lg transition-all duration-300",
              "hover:scale-110 active:scale-95 cursor-pointer",
              "focus:outline-none",
              collapsed ? "mx-auto" : "ml-auto"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 text-white" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-white" />
            )}
          </button>
        </div>
      )}

      {/* Header - Logo below button */}
      <div className={cn(
        "px-6 pt-2 pb-6 flex items-center gap-3",
        collapsed && "justify-center"
      )}>
        <Image
          src="/favicon-32x32.png"
          alt="Coxist AI CFO Logo"
          width={32}
          height={32}
          className="rounded-lg shrink-0"
        />
        {!collapsed && <h2 className="font-bold text-xl">Coxist AI CFO</h2>}
      </div>

      {/* User Profile */}
      {!collapsed && (
        <div className="p-6 mt-4 flex flex-col items-center text-center">
          <div className="h-20 w-20 rounded-full bg-gray-700 flex items-center justify-center mb-4">
            <User className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="mt-4 font-semibold text-lg">
            Welcome Back,
          </h3>
          <p className="text-gray-400">
            {user ? (
              user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user.firstName 
                  ? user.firstName
                  : user.email.split('@')[0]
            ) : 'Guest'}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <NavLink key={item.name} item={item} isActive={isActive} />
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        {collapsed ? (
          <Tooltip content="Log Out" side="right">
            <button
              onClick={logout}
              className="flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-700/50 hover:text-white w-full transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </Tooltip>
        ) : (
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-700/50 hover:text-white w-full transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Log Out
          </button>
        )}
      </div>
    </div>
  );
}

