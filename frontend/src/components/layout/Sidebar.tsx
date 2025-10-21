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
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import Image from 'next/image';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Assistant', href: '/ai-assistant', icon: Sparkles },
    { name: 'Compliance Hub', href: '/compliance-hub', icon: Calculator },
    { name: 'Banking & Payments', href: '/banking-payments', icon: CreditCard },
    { name: 'Smart Alerts', href: '/alerts', icon: AlertTriangle },
    { name: 'Financial Dashboard', href: '/financial-dashboard', icon: BarChart2 },
    { name: 'Products', href: '/products', icon: Package },
  ];

  return (
    <div className="flex flex-col h-full bg-[#1E1E1E] text-white">
      {/* Header */}
      <div className="p-6 flex items-center gap-3">
        <Image
          src="/favicon-32x32.png"
          alt="Coxist AI CFO Logo"
          width={32}
          height={32}
          className="rounded-lg"
        />
        <h2 className="font-bold text-xl">Coxist AI CFO</h2>
      </div>

      {/* User Profile */}
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


      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 mt-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative',
                isActive
                  ? 'bg-gray-700/50 text-white'
                  : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-blue-500 rounded-r-full" />
              )}
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-700/50 hover:text-white w-full transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Log Out
        </button>
      </div>
    </div>
  );
}

