"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AdminSidebar } from "./AdminSidebar";

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
 
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/admin/notifications");
        const json = await res.json();
        if (json.data) {
          const unread = json.data.filter((n: any) => !n.read).length;
          setUnreadCount(unread);
        }
      } catch (e) {
        console.error("Failed to fetch admin notifications", e);
      }
    };
 
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // 15s polling
    return () => clearInterval(interval);
  }, []);

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
            <Link 
              href="/admin/notifications"
              className="w-10 h-10 flex items-center justify-center rounded-full text-primary hover:bg-surface-container-high transition-colors relative"
            >
              <span className="material-symbols-outlined">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-surface">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
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
