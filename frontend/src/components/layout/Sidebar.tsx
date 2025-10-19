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
    { name: 'AI Copilot', href: '/ai-copilot', icon: Sparkles },
    { name: 'AI Chatbot', href: '/ai-chatbot', icon: Bot },
    { name: 'Alerts', href: '/alerts', icon: AlertTriangle },
    { name: 'Investor Updates', href: '/investor-updates', icon: FileText },
    { name: 'Statistics', href: '/statistics', icon: BarChart2 },
    { name: 'Payment', href: '/payment', icon: CreditCard },
    { name: 'Transactions', href: '/transactions', icon: Repeat },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Customer', href: '/customers', icon: Users },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
  ];

  return (
    <div className="flex flex-col h-full bg-[#1E1E1E] text-white">
      {/* Header */}
      <div className="p-6 flex items-center gap-3">
         <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center">
            <svg className="h-6 w-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </div>
        <h2 className="font-bold text-xl">Zarss</h2>
      </div>

      {/* User Profile */}
      <div className="p-6 mt-4 flex flex-col items-center text-center">
        <Image
          src="https://i.pravatar.cc/150?u=markjohnson"
          alt="User Avatar"
          width={80}
          height={80}
          className="rounded-full"
        />
        <h3 className="mt-4 font-semibold text-lg">Welcome Back,</h3>
        <p className="text-gray-400">Mark Johnson</p>
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
         <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-2',
            pathname === '/settings'
               ? 'bg-gray-700/50 text-white'
               : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
          )}
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
        
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

