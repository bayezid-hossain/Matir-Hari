import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { eq, count, gte, and, desc } from "drizzle-orm";
import Link from "next/link";

function todayBDTStart(): Date {
  const now = new Date();
  const bdtOffset = 6 * 60 * 60 * 1000;
  const bdtNow = new Date(now.getTime() + bdtOffset);
  const startBDT = new Date(
    Date.UTC(bdtNow.getUTCFullYear(), bdtNow.getUTCMonth(), bdtNow.getUTCDate())
  );
  return new Date(startBDT.getTime() - bdtOffset);
}

async function getStats() {
  const start = todayBDTStart();
  const [todayOrders, pendingPayments, pendingAdmin, delivered, totalUsers] =
    await Promise.all([
      db
        .select({ count: count() })
        .from(orders)
        .where(gte(orders.orderedAt, start)),
      db
        .select({ count: count() })
        .from(orders)
        .where(eq(orders.status, "PendingPayment")),
      db
        .select({ count: count() })
        .from(orders)
        .where(eq(orders.status, "PendingAdminAction")),
      db
        .select({ count: count() })
        .from(orders)
        .where(
          and(eq(orders.status, "Delivered"), gte(orders.deliveredAt!, start))
        ),
      db.select({ count: count() }).from(users),
    ]);
  return {
    todayOrders: todayOrders[0]?.count ?? 0,
    pendingPayments: pendingPayments[0]?.count ?? 0,
    pendingAdmin: pendingAdmin[0]?.count ?? 0,
    delivered: delivered[0]?.count ?? 0,
    totalUsers: totalUsers[0]?.count ?? 0,
  };
}

async function getRecentOrders() {
  const recentOrders = await db.query.orders.findMany({
    orderBy: [desc(orders.orderedAt)],
    limit: 4,
    with: { user: true, menu: true },
  });
  return recentOrders;
}

export default async function AdminDashboardPage() {
  if (!(await getAdminSession())) redirect("/admin/login");

  const stats = await getStats();
  const recentOrdersList = await getRecentOrders();

  const now = new Date();
  const bdtTime = new Intl.DateTimeFormat("en-BD", {
    timeZone: "Asia/Dhaka",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);

  const getOrderStatusDisplay = (status: string) => {
    switch (status) {
      case "PendingPayment":
        return { label: "Payment Pending", bg: "bg-secondary-fixed", text: "text-secondary", icon: "payments" };
      case "PendingAdminAction":
        return { label: "Needs Review", bg: "bg-error-container", text: "text-error", icon: "report" };
      case "Confirmed":
        return { label: "Confirmed", bg: "bg-primary-fixed", text: "text-primary", icon: "check_circle" };
      case "Cooking":
        return { label: "Cooking", bg: "bg-tertiary-fixed", text: "text-tertiary", icon: "skillet" };
      case "OutForDelivery":
        return { label: "Out for Delivery", bg: "bg-primary-container/20", text: "text-primary", icon: "local_shipping" };
      case "Delivered":
        return { label: "Delivered", bg: "bg-green-100", text: "text-green-700", icon: "done_all" };
      default:
        return { label: status, bg: "bg-surface-container-high", text: "text-on-surface-variant", icon: "info" };
    }
  };

  return (
    <div className="space-y-10 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <header>
        <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">
          Dashboard Overview
        </h2>
        <p className="text-stone-500 text-sm">
          Welcome back. It is {bdtTime}. Here is what is happening in the hearth
          today.
        </p>
      </header>

      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Today's Orders */}
        <div className="md:col-span-2 bg-primary rounded-2xl p-6 text-on-primary shadow-lg relative overflow-hidden group flex flex-col justify-between min-h-[160px]">
          <div className="relative z-10">
            <span className="text-[10px] font-bold tracking-[0.1em] uppercase opacity-80">
              Today's Orders
            </span>
            <div className="text-5xl font-extrabold mt-2 font-headline">
              {stats.todayOrders}
            </div>
          </div>
          <div className="relative z-10 flex items-center gap-2 mt-4 text-sm font-medium opacity-90">
            <span className="material-symbols-outlined text-sm">
              trending_up
            </span>
            <span>Live hearth activity</span>
          </div>
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-primary-container rounded-full opacity-30 group-hover:scale-110 transition-transform duration-500"></div>
        </div>

        {/* Pending Verification */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-transparent hover:border-outline-variant/20 transition-all flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary mb-4">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <div className="text-3xl font-bold font-headline">
              {stats.pendingPayments}
            </div>
          </div>
          <p className="text-[10px] text-stone-500 mt-2 uppercase tracking-tight font-bold">
            Pending Verification
          </p>
        </div>

        {/* Need Admin Action */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-transparent hover:border-outline-variant/20 transition-all flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center text-error mb-4">
              <span className="material-symbols-outlined">report</span>
            </div>
            <div className="text-3xl font-bold font-headline text-error">
              {stats.pendingAdmin}
            </div>
          </div>
          <p className="text-[10px] text-stone-500 mt-2 uppercase tracking-tight font-bold">
            Need Admin Action
          </p>
        </div>

        {/* Delivered Today */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-transparent hover:border-outline-variant/20 transition-all flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-700 mb-4">
              <span className="material-symbols-outlined">local_shipping</span>
            </div>
            <div className="text-3xl font-bold font-headline">
              {stats.delivered}
            </div>
          </div>
          <p className="text-[10px] text-stone-500 mt-2 uppercase tracking-tight font-bold">
            Delivered Today
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Quick Actions */}
        <div className="lg:col-span-2 space-y-10">
          <section>
            <div className="flex items-center justify-between mb-6 px-1">
              <h3 className="text-xl font-bold tracking-tight text-on-surface font-headline">
                Quick Actions
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Link
                href="/admin/orders?status=PendingPayment"
                className="flex flex-col items-center justify-center p-6 bg-surface-container-lowest rounded-2xl hover:bg-surface-container-high transition-colors text-center group border border-outline-variant/10 shadow-sm hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-primary mb-3 shadow-sm group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <span className="text-sm font-semibold text-on-surface">
                  Verify Payments
                </span>
                {stats.pendingPayments > 0 && (
                  <span className="mt-2 inline-flex h-5 items-center rounded-full bg-primary px-2 text-[10px] font-bold text-white">
                    {stats.pendingPayments}
                  </span>
                )}
              </Link>
              <Link
                href="/admin/orders?status=PendingAdminAction"
                className="flex flex-col items-center justify-center p-6 bg-surface-container-lowest rounded-2xl hover:bg-surface-container-high transition-colors text-center group border border-outline-variant/10 shadow-sm hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-primary mb-3 shadow-sm group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">queue</span>
                </div>
                <span className="text-sm font-semibold text-on-surface">
                  Admin Queue
                </span>
                {stats.pendingAdmin > 0 && (
                  <span className="mt-2 inline-flex h-5 items-center rounded-full bg-error px-2 text-[10px] font-bold text-white">
                    {stats.pendingAdmin}
                  </span>
                )}
              </Link>
              <Link
                href="/admin/manifest"
                className="flex flex-col items-center justify-center p-6 bg-surface-container-lowest rounded-2xl hover:bg-surface-container-high transition-colors text-center group border border-outline-variant/10 shadow-sm hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-primary mb-3 shadow-sm group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">list_alt</span>
                </div>
                <span className="text-sm font-semibold text-on-surface">
                  Today's Manifest
                </span>
              </Link>
              <Link
                href="/admin/orders?status=Confirmed"
                className="flex flex-col items-center justify-center p-6 bg-surface-container-lowest rounded-2xl hover:bg-surface-container-high transition-colors text-center group border border-outline-variant/10 shadow-sm hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-primary mb-3 shadow-sm group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">
                    check_circle
                  </span>
                </div>
                <span className="text-sm font-semibold text-on-surface">
                  Confirmed Orders
                </span>
              </Link>
              <Link
                href="/admin/menus"
                className="flex flex-col items-center justify-center p-6 bg-surface-container-lowest rounded-2xl hover:bg-surface-container-high transition-colors text-center group border border-outline-variant/10 shadow-sm hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-primary mb-3 shadow-sm group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">edit_note</span>
                </div>
                <span className="text-sm font-semibold text-on-surface">
                  Edit Menus
                </span>
              </Link>
              <Link
                href="/admin/orders"
                className="flex flex-col items-center justify-center p-6 bg-surface-container-lowest rounded-2xl hover:bg-surface-container-high transition-colors text-center group border border-outline-variant/10 shadow-sm hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-primary mb-3 shadow-sm group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">all_inbox</span>
                </div>
                <span className="text-sm font-semibold text-on-surface">
                  All Orders
                </span>
              </Link>
            </div>
          </section>
        </div>

        {/* Right Column: Recent Activity */}
        <aside className="space-y-6">
          <div className="bg-surface-container-lowest border border-outline-variant/10 shadow-sm rounded-3xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold tracking-tight text-on-surface font-headline">
                Recent Orders
              </h3>
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            </div>

            <div className="space-y-8 flex-1">
              {recentOrdersList.length === 0 ? (
                <div className="text-stone-500 text-sm italic">
                  No orders yet.
                </div>
              ) : (
                recentOrdersList.map((order, i) => {
                  const display = getOrderStatusDisplay(order.status);
                  const isLast = i === recentOrdersList.length - 1;
                  return (
                    <div className="flex gap-4 relative" key={order.id}>
                      {!isLast && (
                        <div className="absolute left-5 top-10 bottom-[-32px] w-px bg-outline-variant/30"></div>
                      )}
                      <div
                        className={`z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ring-4 ring-surface-container-lowest ${display.bg} ${display.text}`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {display.icon}
                        </span>
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-sm font-bold text-on-surface">
                          {order.menu.name}
                        </p>
                        <p className="text-xs text-stone-500 mt-1">
                          By {order.user.name} ({order.user.phone})
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                            {display.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <Link 
              href="/admin/orders"
              className="mt-8 block text-center w-full py-3 bg-surface-container-low rounded-xl text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              View All Orders
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
