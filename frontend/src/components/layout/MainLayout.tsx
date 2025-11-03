'use client';

import { ReactNode, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import FloatingChatbot from '@/components/FloatingChatbot';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  // Hide chatbot on AI assistant page
  const shouldShowChatbot = pathname !== '/ai-assistant';

  return (
    <div className="h-screen flex overflow-hidden bg-white">
      {/* Section 1: Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:shrink-0 relative overflow-visible">
        <Sidebar 
          collapsed={isSidebarCollapsed} 
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </aside>

      {/* Sidebar - Mobile (Overlay) */}
      {isSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
          
          {/* Sidebar */}
          <aside className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <Sidebar 
              collapsed={false}
              onToggleCollapse={() => setIsSidebarOpen(false)}
            />
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Section 2: Main Content */}
        <main className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Floating Chatbot Widget - Hidden on AI assistant page */}
      {shouldShowChatbot && <FloatingChatbot />}
    </div>
  );
}
