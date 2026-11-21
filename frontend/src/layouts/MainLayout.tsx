import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';

export const MainLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#071326] font-sans text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative bg-[#071326]">
        {/* Subtle Ambient Mesh Highlight */}
        <div className="absolute top-0 right-0 w-[550px] h-[350px] bg-gradient-to-bl from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl pointer-events-none" />
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative bg-[#F1F5F9]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
