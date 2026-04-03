"use client";
 
import { useEffect, useState } from "react";
import Link from "next/link";
 
function formatTimeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return Math.floor(seconds) + "s ago";
}
 
export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
 
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/admin/notifications");
      const json = await res.json();
      setNotifications(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
 
  const markAllRead = async () => {
    try {
      await fetch("/api/admin/notifications", { method: "PATCH" });
      await fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };
 
  useEffect(() => {
    fetchNotifications();
  }, []);
 
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Notifications</h1>
          <p className="text-on-surface-variant mt-1 text-sm">
            Stay updated with user requests and order changes.
          </p>
        </div>
        <button
          onClick={markAllRead}
          className="px-6 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-full text-sm font-semibold transition-all"
        >
          Mark all as read
        </button>
      </div>
 
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-surface-container rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 bg-surface-container rounded-3xl border-2 border-dashed border-outline-variant/30">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4 opacity-20">
            notifications_off
          </span>
          <p className="text-on-surface-variant font-medium">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => (
            <Link
              key={n.id}
              href={`/admin/orders/${n.orderId}`}
              className={`block p-6 rounded-3xl transition-all border border-transparent ${
                n.read
                  ? "bg-surface-container-low hover:bg-surface-container-high"
                  : "bg-surface-container shadow-sm border-primary/20 hover:shadow-md"
              }`}
            >
              <div className="flex gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  n.type === "cancel_requested" ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"
                }`}>
                  <span className="material-symbols-outlined">
                    {n.type === "cancel_requested" ? "cancel" : "edit_notifications"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className={`text-base font-bold truncate ${n.read ? "text-on-surface/70" : "text-on-surface"}`}>
                      {n.title}
                    </h3>
                    <span className="text-[10px] whitespace-nowrap text-on-surface-variant uppercase tracking-widest font-bold">
                      {formatTimeAgo(new Date(n.createdAt))}
                    </span>
                  </div>
                  <p className="text-on-surface-variant mt-1 text-sm leading-relaxed line-clamp-2">
                    {n.message}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="px-2.5 py-0.5 bg-outline-variant/30 text-[10px] font-bold uppercase tracking-widest rounded-full text-on-surface-variant">
                      Order #{n.orderId.slice(-6)}
                    </span>
                    {n.user && (
                      <span className="text-[11px] font-medium text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">person</span>
                        {n.user.phone}
                      </span>
                    )}
                  </div>
                </div>
                {!n.read && (
                  <div className="w-2.5 h-2.5 bg-primary rounded-full mt-2 shrink-0 shadow-[0_0_12px_rgba(144,45,19,0.4)]" />
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
