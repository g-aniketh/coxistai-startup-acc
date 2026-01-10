"use client";

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";
import FloatingChatbot from "@/components/FloatingChatbot";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  // Hide chatbot on AI assistant page
  const shouldShowChatbot = pathname !== "/ai-assistant";
  // Disable MainLayout scrolling for AI Assistant page
  const isAIAssistantPage = pathname === "/ai-assistant";

  return (
    <div className="h-screen flex overflow-hidden bg-white">
      {/* Section 1: Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:shrink-0 relative overflow-visible">
        <Sidebar
          collapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </aside>

      {/* Mobile Header - Top Bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white flex items-center justify-center shadow-sm border-2 border-gray-100">
              <Image
                src="/hospitalLogo.jpeg"
                alt="Sai Vishwas Hospitals"
                width={40}
                height={40}
                className="object-cover"
                priority
              />
            </div>
            <span className="text-lg font-semibold text-gray-900">
              Sai Vishwas Hospitals
            </span>
          </Link>

          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </header>

      {/* Sidebar - Mobile (Overlay) */}
      {isSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Sidebar */}
          <aside className="fixed inset-y-0 left-0 z-50 lg:hidden w-80">
            <Sidebar
              collapsed={false}
              onToggleCollapse={() => setIsSidebarOpen(false)}
              isMobile={true}
            />
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Section 2: Main Content */}
        <main
          className={cn(
            "flex-1 relative z-10 custom-scrollbar",
            "lg:pt-0 pt-16", // Add top padding on mobile for header
            isAIAssistantPage ? "overflow-hidden" : "overflow-y-auto"
          )}
        >
          <div className="h-full">{children}</div>
        </main>
      </div>

      {/* Floating Chatbot Widget - Hidden on AI assistant page and when mobile sidebar is open */}
      {shouldShowChatbot && (
        <FloatingChatbot
          sidebarCollapsed={isSidebarCollapsed}
          isMobileSidebarOpen={isSidebarOpen}
        />
      )}
    </div>
  );
}
