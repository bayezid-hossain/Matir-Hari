"use client";

import { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-surface font-body text-on-surface">
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <AdminSidebar mobileOpen={mobileOpen} closeMobile={() => setMobileOpen(false)} />

      <main className="flex-1 md:ml-64 flex flex-col min-w-0 w-full transition-all duration-300">
        {/* TopNavBar Component */}
        <header className="sticky top-0 w-full z-30 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-4 md:px-8 h-20 shadow-[0_12px_32px_rgba(144,45,19,0.04)] font-headline font-medium">
          <div className="flex items-center gap-4 flex-1">
            <button 
              className="md:hidden p-2 text-primary hover:bg-surface-container-high rounded-lg transition-colors"
              onClick={() => setMobileOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            
            <div className="relative w-full max-w-sm hidden sm:block">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                search
              </span>
              <input
                className="w-full pl-12 pr-4 py-2.5 bg-surface-container-low border-none rounded-full focus:ring-2 focus:ring-primary/20 text-sm"
                placeholder="Search orders..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <button className="w-10 h-10 flex items-center justify-center rounded-full text-primary hover:bg-surface-container-high transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
            </button>
            <button className="hidden sm:flex w-10 h-10 items-center justify-center rounded-full text-primary hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="h-8 w-[1px] bg-outline-variant/30 hidden sm:block mx-2"></div>
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant hidden md:inline-block">
              Admin Portal
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">{children}</div>
      </main>
    </div>
  );
}
