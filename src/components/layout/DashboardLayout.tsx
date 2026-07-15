import { useState } from 'react';
import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import type { NavItem } from './Sidebar';
import { Navbar } from './Navbar';
import { PageTransition } from '../common/Motion';

interface DashboardLayoutProps {
  items: NavItem[];
  brandTitle: string;
  brandSubtitle: string;
  pageTitle: string;
  pageSubtitle?: string;
  actions?: ReactNode;
  showAi?: boolean;
  topContent?: ReactNode;
}

export function DashboardLayout({
  items,
  brandTitle,
  brandSubtitle,
  pageTitle,
  pageSubtitle,
  actions,
  showAi = true,
  topContent,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen overflow-x-hidden dashboard-bg">
      <Sidebar
        items={items}
        title={brandTitle}
        subtitle={brandSubtitle}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Navbar
          title={pageTitle}
          subtitle={pageSubtitle}
          onMenuClick={() => setSidebarOpen(true)}
          actions={actions}
          showAi={showAi}
        />
        <main className="flex-1 overflow-x-hidden p-4 lg:p-6">
          <div className="mx-auto w-full max-w-7xl">
            {topContent}
            <PageTransition>
              <Outlet />
            </PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}
