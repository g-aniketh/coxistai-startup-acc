"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
  History,
  Shield,
  Cog,
  IndianRupee,
  BookOpen,
  UserPlus,
  Receipt,
  FileCheck,
  Activity,
  ClipboardList,
  Calendar,
  Building2,
  Stethoscope,
  HeartPulse,
  BedDouble,
  UserCog,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import Image from "next/image";
import { Tooltip } from "@/components/ui/tooltip";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const navigationSections: { label: string; items: NavItem[] }[] = [
    {
      label: "Overview",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        {
          name: "Financial Dashboard",
          href: "/financial-dashboard",
          icon: BarChart2,
        },
        { name: "AI Assistant", href: "/ai-assistant", icon: Sparkles },
      ],
    },
    {
      label: "Revenue Cycle",
      items: [
        { name: "RCM Dashboard", href: "/rcm", icon: Activity },
        { name: "Patient Billing", href: "/invoicing", icon: FileCheck },
        {
          name: "Insurance Claims",
          href: "/insurance-claims",
          icon: ClipboardList,
        },
        { name: "Patient Accounts", href: "/bills", icon: HandCoins },
      ],
    },
    {
      label: "Finance & Accounting",
      items: [
        {
          name: "Banking & Payments",
          href: "/banking-payments",
          icon: CreditCard,
        },
        { name: "Transactions", href: "/transactions", icon: Receipt },
        { name: "Vouchers", href: "/vouchers", icon: FileText },
        {
          name: "Cost Management",
          href: "/cost-management",
          icon: IndianRupee,
        },
        { name: "Bookkeeping", href: "/bookkeeping", icon: BookOpen },
      ],
    },
    {
      label: "Hospital Operations",
      items: [
        { name: "Patients", href: "/patients", icon: HeartPulse },
        { name: "Appointments", href: "/appointments", icon: Calendar },
        { name: "Staff", href: "/staff", icon: Stethoscope },
        { name: "Facilities", href: "/facilities", icon: BedDouble },
      ],
    },
    {
      label: "Compliance & Reports",
      items: [
        { name: "Compliance Hub", href: "/compliance-hub", icon: Calculator },
        { name: "GST", href: "/gst", icon: Globe },
        { name: "Audit Log", href: "/audit-log", icon: History },
        { name: "Smart Alerts", href: "/alerts", icon: AlertTriangle },
      ],
    },
    {
      label: "Admin",
      items: [
        { name: "Team Management", href: "/team", icon: Users },
        { name: "Role Management", href: "/role-management", icon: Shield },
        { name: "Import Data", href: "/tally-import", icon: Upload },
      ],
    },
  ];

  const standaloneNav: NavItem = {
    name: "Settings",
    href: "/settings",
    icon: Cog,
  };

  const NavLink = ({
    item,
    isActive,
  }: {
    item: NavItem;
    isActive: boolean;
  }) => {
    const Icon = item.icon;
    const linkElement = (
      <Link
        href={item.href}
        title={collapsed ? item.name : undefined}
        aria-label={item.name}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative w-full",
          collapsed ? "justify-center" : "",
          isActive
            ? "bg-gray-700/50 text-white"
            : "text-gray-400 hover:bg-gray-700/50 hover:text-white"
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
        <Tooltip
          content={item.name}
          side="right"
          wrapperClassName="block w-full"
        >
          {linkElement}
        </Tooltip>
      );
    }

    return linkElement;
  };

  return (
    <div
      className={cn(
        "relative flex flex-col h-full bg-[#1E1E1E] text-white transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header / Profile / Toggle */}
      <div className="px-4 pt-2 pb-2 flex items-center justify-between gap-3">
        <div
          className={cn("flex items-center gap-2", collapsed ? "mx-auto" : "")}
        >
          <div className="w-8 h-8 rounded-lg shrink-0 bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
            <HeartPulse className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <h2 className="font-bold text-lg tracking-tight">MediFinance</h2>
          )}
        </div>
        {onToggleCollapse && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse();
            }}
            className="flex items-center justify-center w-8 h-8 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 text-white" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-white" />
            )}
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="px-4 pb-4 flex items-center gap-3">
          <div className="h-14 w-14 rounded-full bg-gray-700 flex items-center justify-center">
            <User className="h-7 w-7 text-gray-400" />
          </div>
          <div className="leading-tight">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Welcome Back,
            </p>
            <p className="text-sm font-semibold text-white">
              {user
                ? user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.firstName
                    ? user.firstName
                    : user.email.split("@")[0]
                : "Guest"}
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 pt-2 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {navigationSections.map((section) => (
          <div key={section.label} className="space-y-2">
            {!collapsed && (
              <p className="text-xs uppercase tracking-wide text-gray-500 px-3">
                {section.label}
              </p>
            )}
            <div className="space-y-2">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <NavLink key={item.name} item={item} isActive={isActive} />
                );
              })}
            </div>
          </div>
        ))}

        <div className="pt-2 border-t border-gray-800 space-y-2">
          {!collapsed && (
            <p className="text-xs uppercase tracking-wide text-gray-500 px-3">
              Preferences
            </p>
          )}
          <NavLink
            item={standaloneNav}
            isActive={pathname === standaloneNav.href}
          />
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        {collapsed ? (
          <Tooltip
            content="Log Out"
            side="right"
            wrapperClassName="block w-full"
          >
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
