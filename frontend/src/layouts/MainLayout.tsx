import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';

export const MainLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] font-sans text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative bg-[#f8fafc]">
        {/* Subtle Ambient Mesh Highlight */}
        <div className="absolute top-0 right-0 w-[550px] h-[350px] bg-gradient-to-bl from-emerald-500/6 via-teal-500/4 to-transparent blur-3xl pointer-events-none" />
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
