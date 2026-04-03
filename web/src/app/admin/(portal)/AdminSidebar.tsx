"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/orders", label: "Orders", icon: "shopping_cart" },
  { href: "/admin/menus", label: "Menus", icon: "restaurant_menu" },
  { href: "/admin/manifest", label: "Manifest", icon: "assignment" },
  { href: "/admin/menu-history", label: "Menu History", icon: "history" },
  { href: "/admin/payment-numbers", label: "Payment Numbers", icon: "payments" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export function AdminSidebar({ 
  mobileOpen, 
  closeMobile 
}: { 
  mobileOpen?: boolean; 
  closeMobile?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  };

  return (
    <aside className={`
      w-64 fixed left-0 top-0 h-screen flex flex-col bg-surface z-50
      shadow-2xl md:shadow-none border-r border-outline-variant/10
      transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)]
      ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
    `}>
      <div className="flex flex-col h-full py-8 md:py-8 px-4 font-headline tracking-tight overflow-y-auto">
        {/* Brand */}
        <div className="mb-10 px-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Matir Hari" className="h-10 w-auto" />
            <div className="hidden">
              <h1 className="text-2xl font-bold text-primary">Matir Hari</h1>
              <p className="text-xs text-on-surface-variant/70 uppercase tracking-widest mt-1">
                Artisanal Portal
              </p>
            </div>
          </div>
          <button 
            className="md:hidden p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full"
            onClick={closeMobile}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-2">
          {NAV.map(({ href, label, icon }) => {
            const isActive =
              href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                onClick={() => {
                  if (closeMobile) closeMobile();
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 group ${
                  isActive
                    ? "text-primary font-bold border-r-4 border-primary bg-surface-container-low"
                    : "text-stone-600 hover:text-primary hover:bg-surface-container-highest"
                }`}
              >
                <span
                  className="material-symbols-outlined group-active:scale-95 duration-150"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {icon}
                </span>
                <span className={isActive ? "" : "font-medium"}>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Profile / Logout */}
        <div className="mt-auto border-t border-outline-variant/20 pt-6">
          <div className="flex items-center gap-3 px-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary-container overflow-hidden shrink-0 flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined">person</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-on-surface truncate">
                Admin Profile
              </p>
              <p className="text-[10px] text-on-surface-variant truncate">
                Super Admin
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-stone-600 hover:text-error hover:bg-error/5 transition-colors duration-200"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
