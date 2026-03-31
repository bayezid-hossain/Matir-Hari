"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/orders", label: "Orders", icon: "📋" },
  { href: "/admin/menus", label: "Menus", icon: "🍲" },
  { href: "/admin/manifest", label: "Manifest", icon: "🛵" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  };

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-white border-r border-[#e8e0d6] min-h-screen">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-[#e8e0d6]">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#902d13] text-white flex items-center justify-center text-lg">
            🍲
          </div>
          <div>
            <p className="text-xs font-extrabold text-[#902d13] tracking-tight leading-none">
              Matir Hari
            </p>
            <p className="text-[10px] text-[#6b5e4e] mt-0.5">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon }) => {
          const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-[#902d13] text-white"
                  : "text-[#4a3728] hover:bg-[#f5ede6]"
              }`}
            >
              <span className="text-base leading-none">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#902d13] hover:bg-[#fdf0ec] transition-colors"
        >
          <span className="text-base leading-none">🚪</span>
          Sign out
        </button>
      </div>
    </aside>
  );
}
