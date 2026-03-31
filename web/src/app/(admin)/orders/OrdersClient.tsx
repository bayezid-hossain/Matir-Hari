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
  cancelReason: string | null;
  adminNote: string | null;
  deliveryAddress: { address?: string; lat?: number; lng?: number } | null;
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

const STATUS_COLORS: Record<string, string> = {
  PendingPayment: "bg-amber-100 text-amber-800",
  Confirmed: "bg-blue-100 text-blue-800",
  Cooking: "bg-orange-100 text-orange-800",
  OutForDelivery: "bg-purple-100 text-purple-800",
  Delivered: "bg-green-100 text-green-800",
  Cancelled: "bg-gray-100 text-gray-600",
  PendingAdminAction: "bg-red-100 text-red-800",
};

const NEXT_ACTIONS: Record<string, { action: string; label: string; color: string }[]> = {
  PendingPayment: [
    { action: "confirm_payment", label: "✅ Confirm Payment", color: "bg-green-600 hover:bg-green-700 text-white" },
    { action: "admin_cancel", label: "❌ Reject", color: "bg-red-100 hover:bg-red-200 text-red-700" },
  ],
  PendingAdminAction: [
    { action: "confirm_payment", label: "✅ Approve & Confirm", color: "bg-green-600 hover:bg-green-700 text-white" },
    { action: "admin_cancel", label: "❌ Cancel Order", color: "bg-red-100 hover:bg-red-200 text-red-700" },
  ],
  Confirmed: [
    { action: "start_cooking", label: "👨‍🍳 Start Cooking", color: "bg-orange-500 hover:bg-orange-600 text-white" },
  ],
  Cooking: [
    { action: "out_for_delivery", label: "🛵 Out for Delivery", color: "bg-purple-600 hover:bg-purple-700 text-white" },
  ],
  OutForDelivery: [
    { action: "deliver", label: "🎉 Mark Delivered", color: "bg-[#902d13] hover:bg-[#7a2510] text-white" },
  ],
};

const ALL_STATUSES = Object.keys(STATUS_LABELS);

export function OrdersClient({ initialStatus }: { initialStatus?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? initialStatus ?? "";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const url = status ? `/api/admin/orders?status=${status}` : "/api/admin/orders";
    const res = await fetch(url);
    const data = await res.json();
    setOrders(data.data ?? []);
    setLoading(false);
  }, [status]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const runAction = async (orderId: string, action: string, extra?: Record<string, string>) => {
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold text-[#902d13] tracking-tight">Orders</h1>
        <button
          onClick={fetchOrders}
          className="text-sm font-semibold text-[#902d13] hover:underline"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatus("")}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
            !status ? "bg-[#902d13] text-white" : "bg-white border border-[#e8e0d6] text-[#4a3728] hover:bg-[#f5ede6]"
          }`}
        >
          All
        </button>
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              status === s
                ? "bg-[#902d13] text-white"
                : "bg-white border border-[#e8e0d6] text-[#4a3728] hover:bg-[#f5ede6]"
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Order list */}
      {loading ? (
        <div className="text-center py-20 text-[#6b5e4e]">Loading…</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-[#6b5e4e]">No orders found</div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const isExpanded = expandedId === order.id;
            const actions = NEXT_ACTIONS[order.status] ?? [];

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-[#e8e0d6] overflow-hidden"
              >
                {/* Summary row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-[#fbf9f5] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[#1c1308]">{order.user.name}</span>
                      <span className="text-xs text-[#6b5e4e]">{order.user.phone}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-[#6b5e4e]">
                        {order.menu.type} · {order.menu.name}
                      </span>
                      <span className="text-xs font-semibold text-[#1c1308]">৳{order.totalPrice}</span>
                      {order.trxId && (
                        <span className="text-xs font-mono text-[#795900]">TrxID: {order.trxId}</span>
                      )}
                      <span className="text-xs text-[#6b5e4e]">{fmtTime(order.orderedAt)}</span>
                    </div>
                  </div>
                  <span className="text-[#6b5e4e] text-sm shrink-0">{isExpanded ? "▲" : "▼"}</span>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-[#e8e0d6] px-5 py-4 space-y-4">
                    {/* Info grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      <InfoItem label="Order ID" value={order.id.slice(0, 12) + "…"} />
                      <InfoItem label="Payment Method" value={order.paymentMethod ?? "—"} />
                      <InfoItem label="TrxID" value={order.trxId ?? "—"} highlight />
                      <InfoItem label="Commitment Fee" value={`৳${order.commitmentFee}`} />
                      <InfoItem label="Delivery Fee" value={`৳${order.deliveryFee}`} />
                      <InfoItem label="Total" value={`৳${order.totalPrice}`} />
                      <InfoItem label="Trust Score" value={`${order.user.trustScore}/5`} />
                      <InfoItem label="Payment Submitted" value={fmtTime(order.paymentSubmittedAt)} />
                      <InfoItem label="Confirmed At" value={fmtTime(order.confirmedAt)} />
                    </div>

                    {/* Delivery address */}
                    {order.deliveryAddress?.address && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-[#795900] mb-1">Delivery Address</p>
                        <div className="flex items-center gap-3">
                          <p className="text-sm text-[#1c1308]">{order.deliveryAddress.address}</p>
                          {order.deliveryAddress.lat && order.deliveryAddress.lng && (
                            <a
                              href={`https://maps.google.com/?q=${order.deliveryAddress.lat},${order.deliveryAddress.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-[#902d13] hover:underline"
                            >
                              📍 Map
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Cancel reason / admin note */}
                    {order.cancelReason && (
                      <div className="bg-amber-50 rounded-xl px-4 py-3">
                        <p className="text-xs font-bold text-amber-700 mb-1">Customer Note / Reason</p>
                        <p className="text-sm text-amber-900">{order.cancelReason}</p>
                      </div>
                    )}
                    {order.adminNote && (
                      <div className="bg-blue-50 rounded-xl px-4 py-3">
                        <p className="text-xs font-bold text-blue-700 mb-1">Admin Note</p>
                        <p className="text-sm text-blue-900">{order.adminNote}</p>
                      </div>
                    )}

                    {/* Add note */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={noteInputs[order.id] ?? ""}
                        onChange={(e) =>
                          setNoteInputs((p) => ({ ...p, [order.id]: e.target.value }))
                        }
                        placeholder="Add admin note…"
                        className="flex-1 h-9 rounded-lg border border-[#e8e0d6] bg-[#fbf9f5] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#902d13]/30"
                      />
                      <button
                        onClick={() =>
                          runAction(order.id, "add_note", { adminNote: noteInputs[order.id] ?? "" })
                        }
                        disabled={!!actionLoading}
                        className="px-3 h-9 rounded-lg bg-[#e8e0d6] text-[#4a3728] text-sm font-semibold hover:bg-[#d9cfc5] transition-colors disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>

                    {/* Action buttons */}
                    {actions.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {actions.map(({ action, label, color }) => (
                          <button
                            key={action}
                            onClick={() => runAction(order.id, action)}
                            disabled={!!actionLoading}
                            className={`px-4 h-9 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${color}`}
                          >
                            {actionLoading === order.id + action ? "…" : label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InfoItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#795900]">{label}</p>
      <p className={`text-sm mt-0.5 font-mono ${highlight ? "font-bold text-[#902d13]" : "text-[#1c1308]"}`}>
        {value}
      </p>
    </div>
  );
}
