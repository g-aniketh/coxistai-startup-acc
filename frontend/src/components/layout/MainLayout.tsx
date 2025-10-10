'use client';

import { ReactNode, useState } from 'react';
import NewHeader from './NewHeader'; // Changed import

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NewHeader />
      <main className="pt-24">
        {' '}
        {/* Add padding to account for fixed header */}
        <div className="p-6">
          <div className="mx-auto max-w-7xl">
            <div className="animate-fade-in">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
