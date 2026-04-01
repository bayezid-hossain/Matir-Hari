"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Order = {
  id: string;
  status: string;
  trxId: string | null;
  paymentMethod: string | null;
  totalPrice: number;
  commitmentFee: number;
  deliveryFee: number;
  deliveryAddress: { address?: string; lat?: number; lng?: number } | null;
  paymentScreenshot: string | null;
  orderedAt: string;
  paymentSubmittedAt: string | null;
  confirmedAt: string | null;
  user: { id: string; name: string; phone: string; trustScore: number };
  menu: { id: string; name: string; type: string };
};

const STATUS_LABELS: Record<string, string> = {
  PendingPayment: "Pending Payment",
  Confirmed: "Confirmed",
  Cooking: "Cooking",
  OutForDelivery: "Out for Delivery",
  Delivered: "Delivered",
  Cancelled: "Cancelled",
  PendingAdminAction: "Admin Queue",
};

const STATUS_FILTERS = [
  { key: "", label: "All Orders" },
  { key: "PendingPayment", label: "Pending Payment" },
  { key: "Confirmed", label: "Confirmed" },
  { key: "Cooking", label: "Cooking" },
  { key: "OutForDelivery", label: "Out for Delivery" },
  { key: "Delivered", label: "Delivered" },
  { key: "Cancelled", label: "Cancelled" },
  { key: "PendingAdminAction", label: "Admin Queue", isQueue: true },
];

export function OrdersClient({ initialStatus }: { initialStatus?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? initialStatus ?? "";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const url = status
      ? `/api/admin/orders?status=${status}`
      : "/api/admin/orders";
    const res = await fetch(url);
    const data = await res.json();
    setOrders(data.data ?? []);
    setLoading(false);
  }, [status]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const runAction = async (
    orderId: string,
    action: string,
    extra?: Record<string, string>
  ) => {
    setActionLoading(orderId + action);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      if (res.ok) await fetchOrders();
    } finally {
      setActionLoading(null);
    }
  };

  const setStatus = (s: string) => {
    const params = new URLSearchParams();
    if (s) params.set("status", s);
    router.push(`/admin/orders?${params.toString()}`);
  };

  const getStatusBadge = (order: Order) => {
    const isCod = order.paymentMethod === "COD";

    if (order.status === "PendingPayment") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
          WAITING VERIFICATION
        </span>
      );
    }

    if (order.status === "PendingAdminAction") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error-container text-on-error-container text-[10px] font-bold w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
          ADMIN QUEUE
        </span>
      );
    }

    if (order.status === "Cancelled") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-highest text-on-surface-variant text-[10px] font-bold w-fit">
          CANCELLED
        </span>
      );
    }

    // Default formatting for other states based on payment
    if (isCod) {
      const label = order.status === "Delivered" ? "PAID (COD)" : "CASH ON DELIVERY";
      const dot = order.status === "Delivered" ? "bg-green-600" : "bg-on-surface-variant";
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-bold w-fit">
          <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
          {label}
        </span>
      );
    }

    // Default Bkash or general accepted payment
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-[10px] font-bold w-fit">
        <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
        {order.status === "PendingPayment" ? "PENDING..." : "PAID (DIGITAL)"}
      </span>
    );
  };

  const getRowActions = (order: Order) => {
    if (order.status === "PendingPayment") {
      return (
        <>
          <button
            onClick={() => runAction(order.id, "confirm_payment")}
            disabled={!!actionLoading}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
            title="Verify Payment"
          >
            <span className="material-symbols-outlined">check_circle</span>
          </button>
          <button
            onClick={() => runAction(order.id, "admin_cancel")}
            disabled={!!actionLoading}
            className="p-2 text-error hover:bg-error/5 rounded-lg transition-colors disabled:opacity-50"
            title="Reject Payment"
          >
            <span className="material-symbols-outlined">cancel</span>
          </button>
        </>
      );
    }

    if (order.status === "PendingAdminAction") {
      return (
        <>
          <button
            onClick={() => runAction(order.id, "confirm_payment")}
            disabled={!!actionLoading}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
            title="Approve Exception"
          >
            <span className="material-symbols-outlined">thumb_up</span>
          </button>
          <button
            onClick={() => runAction(order.id, "admin_cancel")}
            disabled={!!actionLoading}
            className="p-2 text-error hover:bg-error/5 rounded-lg transition-colors disabled:opacity-50"
            title="Cancel Permanently"
          >
            <span className="material-symbols-outlined">delete</span>
          </button>
        </>
      );
    }

    if (order.status === "Confirmed") {
      return (
        <button
          onClick={() => runAction(order.id, "start_cooking")}
          disabled={!!actionLoading}
          className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-tighter bg-primary text-on-primary rounded-lg shadow-sm hover:opacity-90 disabled:opacity-50"
        >
          {actionLoading === order.id + "start_cooking" ? "..." : "Mark Cooking"}
        </button>
      );
    }

    if (order.status === "Cooking") {
      return (
        <button
          onClick={() => runAction(order.id, "out_for_delivery")}
          disabled={!!actionLoading}
          className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-tighter bg-tertiary text-on-tertiary rounded-lg shadow-sm hover:opacity-90 disabled:opacity-50"
        >
          {actionLoading === order.id + "out_for_delivery" ? "..." : "Handover"}
        </button>
      );
    }

    if (order.status === "OutForDelivery") {
      return (
        <button
          onClick={() => runAction(order.id, "deliver")}
          disabled={!!actionLoading}
          className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-tighter bg-green-700 text-white rounded-lg shadow-sm hover:opacity-90 disabled:opacity-50"
        >
          {actionLoading === order.id + "deliver" ? "..." : "Delivered"}
        </button>
      );
    }

    return (
      <button
        disabled
        className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-tighter bg-surface-container-high text-on-surface rounded-lg opacity-50 cursor-not-allowed"
      >
        {STATUS_LABELS[order.status]}
      </button>
    );
  };

  const fmtTime = (ts: string | null) =>
    ts
      ? new Intl.DateTimeFormat("en-BD", {
          timeZone: "Asia/Dhaka",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(ts))
      : "—";

  return (
    <section className="space-y-8 max-w-[1600px] mx-auto w-full">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-extrabold text-on-surface tracking-tight font-headline">
            Orders
          </h2>
          <p className="text-on-surface-variant mt-1">
            Manage and verify artisanal meal deliveries.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all font-semibold text-sm"
        >
          <span className="material-symbols-outlined text-lg">refresh</span>
          Refresh Orders
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
        {STATUS_FILTERS.map((f) => {
          const isActive = status === f.key;
          if (f.isQueue) {
            return (
              <button
                key={f.key}
                onClick={() => setStatus(f.key)}
                className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap border transition-colors ${
                  isActive
                    ? "bg-secondary-container text-on-secondary-container border-secondary-container"
                    : "bg-secondary-container/20 text-on-secondary-container border-secondary-container/30 hover:bg-secondary-container/40"
                }`}
              >
                {f.label}
              </button>
            );
          }
          return (
            <button
              key={f.key}
              onClick={() => setStatus(f.key)}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors shadow-sm ${
                isActive
                  ? "bg-primary text-on-primary shadow-primary/10"
                  : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/10"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Orders Table Container */}
      {loading ? (
        <div className="text-center py-32 text-on-surface-variant font-bold">
          Loading Orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-8 bg-surface-container-low/50 rounded-3xl border-2 border-dashed border-outline-variant/30 text-center">
          <div className="w-24 h-24 mb-6 relative">
            <div className="absolute inset-0 bg-primary/5 rounded-full animate-ping"></div>
            <div className="relative flex items-center justify-center w-full h-full bg-surface-container-lowest rounded-full shadow-lg">
              <span className="material-symbols-outlined text-5xl text-primary/30">
                restaurant
              </span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-on-surface font-headline">
            The Hearth is Quiet
          </h3>
          <p className="text-on-surface-variant max-w-sm mt-2">
            No orders match this status. Your artisanal kitchen is ready for its next masterpiece.
          </p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl overflow-x-auto shadow-[0_12px_32px_rgba(144,45,19,0.02)] border border-outline-variant/10">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/10">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-extrabold text-on-surface-variant">
                  Order ID
                </th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-extrabold text-on-surface-variant">
                  Customer
                </th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-extrabold text-on-surface-variant">
                  Meal Set
                </th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-extrabold text-on-surface-variant">
                  Payment Status
                </th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-extrabold text-on-surface-variant text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-surface-container-low/50 transition-colors"
                >
                  <td className="px-6 py-5">
                    <span className="font-headline font-bold text-primary">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">
                      {fmtTime(order.orderedAt)}
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="font-bold text-on-surface">{order.user.name}</p>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1">
                      {order.user.phone}
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high flex border-outline-variant/10 shadow-sm shrink-0 items-center justify-center font-bold text-lg text-primary opacity-90 overflow-hidden">
                          🍲
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface">
                          {order.menu.name}
                        </p>
                        <p className="text-[10px] text-on-surface-variant">
                          {order.menu.type} • ৳{order.totalPrice} total
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1 items-start">
                      {getStatusBadge(order)}
                      <div className="flex items-center gap-2">
                        {(order.trxId || order.paymentMethod) && (
                          <code className="text-[10px] font-mono bg-surface-container-high px-2 py-0.5 rounded text-primary border border-outline-variant/20 w-fit">
                            {order.trxId ? `TrxID: ${order.trxId}` : order.paymentMethod}
                          </code>
                        )}
                        {order.paymentScreenshot && (
                          <button
                            onClick={() => setPreviewImage(order.paymentScreenshot)}
                            className="bg-primary/10 text-primary p-1 rounded-md hover:bg-primary/20 transition-colors flex items-center gap-1"
                            title="View Screenshot"
                          >
                            <span className="material-symbols-outlined text-sm">image</span>
                            <span className="text-[9px] font-bold uppercase">Proof</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {getRowActions(order)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Screenshot Preview Modal */}
          {previewImage && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-on-surface/60 backdrop-blur-md animate-in fade-in duration-300"
                onClick={() => setPreviewImage(null)}
              />
              <div className="relative max-w-4xl max-h-[90vh] bg-surface rounded-2xl overflow-hidden shadow-2xl border border-outline-variant/10 animate-in zoom-in-95 duration-300">
                <div className="p-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
                  <h4 className="font-bold text-on-surface">Payment Verification Proof</h4>
                  <button
                    onClick={() => setPreviewImage(null)}
                    className="p-1.5 hover:bg-surface-container-high rounded-full transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <div className="overflow-auto max-h-[calc(90vh-64px)] bg-black/5 p-4 flex items-center justify-center">
                  <img
                    src={previewImage}
                    alt="Payment Screenshot"
                    className="max-w-full h-auto rounded-lg shadow-inner"
                  />
                </div>
                <div className="p-4 bg-surface-container-low flex justify-end gap-3">
                  <a
                    href={previewImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-surface-container-high text-on-surface rounded-lg hover:bg-surface-container-highest transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    Open Original
                  </a>
                  <button
                    onClick={() => setPreviewImage(null)}
                    className="px-6 py-2 text-xs font-bold uppercase tracking-wider bg-primary text-on-primary rounded-lg shadow-lg shadow-primary/20 hover:opacity-90 transition-all font-headline"
                  >
                    Everything looks good
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
