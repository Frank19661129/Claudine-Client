import type { FC, ReactNode } from 'react';
import { TopBar } from '../components/v2/TopBar';
import { Sidebar } from '../components/v2/Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout: FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar - Navy Blue */}
      <TopBar />

      {/* Main Container */}
      <div className="main-container">
        {/* Sidebar */}
        <Sidebar />

        {/* Content Area */}
        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
};
