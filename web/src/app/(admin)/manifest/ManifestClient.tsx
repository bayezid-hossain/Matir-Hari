"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ManifestOrder = {
  id: string;
  status: string;
  totalPrice: number;
  commitmentFee: number;
  deliveryFee: number;
  paymentMethod: string | null;
  trxId: string | null;
  deliveryAddress: { address?: string; lat?: number; lng?: number } | null;
  orderedAt: string;
  confirmedAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  adminNote: string | null;
  user: { id: string; name: string; phone: string };
  menu: { id: string; name: string; type: string; price: number };
};

const STATUS_COLORS: Record<string, string> = {
  Confirmed: "bg-blue-100 text-blue-800",
  Cooking: "bg-orange-100 text-orange-800",
  OutForDelivery: "bg-purple-100 text-purple-800",
  Delivered: "bg-green-100 text-green-800",
};

export function ManifestClient() {
  const [orders, setOrders] = useState<ManifestOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchManifest = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/manifest");
    const data = await res.json();
    setOrders(data.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchManifest();
  }, [fetchManifest]);

  const handlePrint = () => window.print();

  const lunch = orders.filter((o) => o.menu.type === "Lunch");
  const dinner = orders.filter((o) => o.menu.type === "Dinner");

  const fmtPhone = (phone: string) => {
    // Make phone call-link friendly
    return phone.startsWith("+") ? phone : `+88${phone}`;
  };

  const today = new Intl.DateTimeFormat("en-BD", {
    timeZone: "Asia/Dhaka",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold text-[#902d13] tracking-tight">
            Delivery Manifest
          </h1>
          <p className="text-sm text-[#6b5e4e] mt-0.5">{today}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchManifest}
            className="px-4 h-9 rounded-xl border border-[#e8e0d6] bg-white text-sm font-semibold text-[#4a3728] hover:bg-[#f5ede6] transition-colors"
          >
            ↻ Refresh
          </button>
          <button
            onClick={handlePrint}
            className="px-4 h-9 rounded-xl bg-[#902d13] text-white text-sm font-bold hover:bg-[#7a2510] transition-colors"
          >
            🖨 Print
          </button>
        </div>
      </div>

      {/* Print header (only visible when printing) */}
      <div className="hidden print:block mb-6">
        <h1 className="text-xl font-bold">Matir Hari — Daily Delivery Manifest</h1>
        <p className="text-sm text-gray-600">{today}</p>
        <p className="text-sm text-gray-600 mt-1">
          Total: {orders.length} orders ({lunch.length} Lunch, {dinner.length} Dinner)
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-[#6b5e4e]">Loading…</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-[#6b5e4e]">No confirmed orders today</div>
      ) : (
        <div ref={printRef} className="space-y-8">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
            <SumCard label="Total Orders" value={orders.length} color="text-[#1c1308]" />
            <SumCard label="Lunch" value={lunch.length} color="text-amber-700" />
            <SumCard label="Dinner" value={dinner.length} color="text-indigo-700" />
            <SumCard
              label="Balance on Delivery"
              value={`৳${orders.reduce(
                (s, o) => s + (o.totalPrice - o.commitmentFee),
                0
              )}`}
              color="text-[#902d13]"
            />
          </div>

          {/* Lunch section */}
          {lunch.length > 0 && (
            <ManifestSection title="🌞 Lunch" orders={lunch} fmtPhone={fmtPhone} />
          )}

          {/* Dinner section */}
          {dinner.length > 0 && (
            <ManifestSection title="🌙 Dinner" orders={dinner} fmtPhone={fmtPhone} />
          )}
        </div>
      )}

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          [data-print-area], [data-print-area] * { visibility: visible; }
          [data-print-area] { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        }
      `}</style>
    </div>
  );
}

function SumCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#e8e0d6] p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-[#795900]">{label}</p>
      <p className={`text-2xl font-extrabold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function ManifestSection({
  title,
  orders,
  fmtPhone,
}: {
  title: string;
  orders: ManifestOrder[];
  fmtPhone: (p: string) => string;
}) {
  return (
    <div>
      <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#795900] mb-3">
        {title} — {orders.length} orders
      </h2>
      <div className="overflow-x-auto rounded-2xl border border-[#e8e0d6]">
        <table className="w-full text-sm">
          <thead className="bg-[#fbf9f5] border-b border-[#e8e0d6]">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#795900]">#</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#795900]">Customer</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#795900]">Phone</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#795900]">Meal</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#795900]">Address</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-[#795900]">Balance</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#795900] print:hidden">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#795900] print:hidden">
                Map
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e8e0d6]">
            {orders.map((order, i) => {
              const balance = order.totalPrice - order.commitmentFee;
              const addr = order.deliveryAddress;
              return (
                <tr key={order.id} className="hover:bg-[#fbf9f5] transition-colors">
                  <td className="px-4 py-3 text-[#6b5e4e] font-mono text-xs">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold text-[#1c1308]">{order.user.name}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`tel:${fmtPhone(order.user.phone)}`}
                      className="font-mono text-[#902d13] hover:underline"
                    >
                      {order.user.phone}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-[#1c1308]">{order.menu.name}</td>
                  <td className="px-4 py-3 text-[#6b5e4e] max-w-[200px] truncate">
                    {addr?.address ?? "—"}
                    {order.adminNote && (
                      <span className="block text-xs text-amber-700 mt-0.5 truncate">
                        📝 {order.adminNote}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-[#902d13]">
                    {balance > 0 ? `৳${balance}` : "Prepaid"}
                  </td>
                  <td className="px-4 py-3 print:hidden">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 print:hidden">
                    {addr?.lat && addr?.lng ? (
                      <a
                        href={`https://maps.google.com/?q=${addr.lat},${addr.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-[#795900] hover:underline"
                      >
                        📍 Open
                      </a>
                    ) : (
                      <span className="text-xs text-[#6b5e4e]">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
