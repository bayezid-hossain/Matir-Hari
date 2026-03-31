"use client";

import { useCallback, useEffect, useState } from "react";

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

export function ManifestClient() {
  const [orders, setOrders] = useState<ManifestOrder[]>([]);
  const [loading, setLoading] = useState(true);

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
  
  const fmtPhone = (phone: string) =>
    phone.startsWith("+") ? phone : `+88${phone}`;

  const today = new Intl.DateTimeFormat("en-BD", {
    timeZone: "Asia/Dhaka",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const pendingPrepCount = orders.filter(
    (o) => o.status === "Confirmed" || o.status === "Cooking"
  ).length;
  
  const handedToRiderCount = orders.filter(
    (o) => o.status === "OutForDelivery" || o.status === "Delivered"
  ).length;

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 print:hidden">
        <div>
          <h2 className="text-4xl font-extrabold font-headline text-on-surface tracking-tight">
            Delivery Manifest
          </h2>
          <div className="flex items-center gap-2 mt-2 text-stone-500">
            <span className="material-symbols-outlined text-sm">
              calendar_today
            </span>
            <p className="text-sm font-medium">{today}</p>
            <span className="mx-2">•</span>
            <span className="bg-secondary-container/20 text-on-secondary-container px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              Today's Batch
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchManifest}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-surface-container-low text-on-surface-variant font-semibold hover:bg-surface-container-high transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            Refresh
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold shadow-[0_8px_20px_rgba(144,45,19,0.2)] hover:opacity-90 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">print</span>
            Print Manifest
          </button>
        </div>
      </div>

      {/* Print-only title */}
      <div className="hidden print:block mb-8">
        <h1 className="text-3xl font-extrabold font-headline text-primary">
          Matir Hari — Daily Manifest
        </h1>
        <p className="text-lg text-stone-600 font-medium">{today}</p>
        <div className="mt-4 flex gap-4 text-sm font-bold border-b border-outline-variant/30 pb-4">
          <span>Total: {orders.length} orders</span>
          <span>(Lunch: {lunch.length}, Dinner: {dinner.length})</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-stone-500 font-bold">
          Loading the day's manifest...
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-8 bg-surface-container-low/50 rounded-3xl border-2 border-dashed border-outline-variant/30 text-center">
          <div className="w-24 h-24 mb-6 relative flex items-center justify-center bg-surface-container-lowest rounded-full shadow-lg">
            <span className="material-symbols-outlined text-5xl text-primary/30">
              assignment
            </span>
          </div>
          <h3 className="text-2xl font-bold text-on-surface font-headline">
            No Deliveries Yet
          </h3>
          <p className="text-on-surface-variant max-w-sm mt-2">
            Once orders are confirmed and prepped, they will appear here for rider handover.
          </p>
        </div>
      ) : (
        <>
          {/* Manifest Stack */}
          <div className="grid grid-cols-1 gap-4">
            {lunch.length > 0 && <ManifestBlock title="LUNCH BATCH" orders={lunch} fmtPhone={fmtPhone} />}
            {dinner.length > 0 && <ManifestBlock title="DINNER BATCH" orders={dinner} fmtPhone={fmtPhone} />}
          </div>

          {/* Summary Insight Section */}
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
            <div className="lg:col-span-2 bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/10 shadow-[0_12px_32px_rgba(144,45,19,0.02)]">
              <h3 className="text-xl font-bold font-headline mb-6">
                Manifest Insight
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                    Total Orders
                  </span>
                  <span className="text-3xl font-black text-on-surface">
                    {orders.length}
                  </span>
                  <p className="text-xs text-stone-500">Scheduled Today</p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                    Handed to Rider
                  </span>
                  <span className="text-3xl font-black text-secondary">
                    {handedToRiderCount}
                  </span>
                  <p className="text-xs text-stone-500">
                    {orders.length > 0
                      ? Math.round((handedToRiderCount / orders.length) * 100)
                      : 0}
                    % completion rate
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                    Pending Prep
                  </span>
                  <span className="text-3xl font-black text-primary">
                    {pendingPrepCount}
                  </span>
                  <p className="text-xs text-stone-500">In the kitchen</p>
                </div>
              </div>
            </div>

            <div className="bg-primary-fixed/30 rounded-3xl p-8 border border-primary/10 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 block">
                  Authenticity Check
                </span>
                <h4 className="text-lg font-bold leading-tight mb-4 text-on-surface">
                  Pottery Tracking
                </h4>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Ensure all clay lids are secured with jute twine before
                  handing to riders. Maintain the Matir Hari standard.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-4">
                <span className="text-xs font-bold text-on-surface uppercase tracking-widest">
                  Eco-Packaging Standard enforced
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ManifestBlock({
  title,
  orders,
  fmtPhone,
}: {
  title: string;
  orders: ManifestOrder[];
  fmtPhone: (p: string) => string;
}) {
  return (
    <div className="mb-8">
      <h3 className="text-sm font-extrabold font-headline uppercase tracking-widest text-outline mb-4">
        {title} ({orders.length})
      </h3>
      <div className="grid grid-cols-1 gap-4">
        {orders.map((order) => {
          const balance = order.totalPrice - order.commitmentFee;
          const isLunch = order.menu.type === "Lunch";
          const addr = order.deliveryAddress;
          
          return (
            <div
              key={order.id}
              className="group bg-surface-container-lowest rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-6 shadow-[0_4px_24px_rgba(144,45,19,0.02)] transition-all duration-300 border border-transparent hover:border-outline-variant/30 print:break-inside-avoid print:border-outline-variant/40 print:shadow-none"
            >
              {/* Type Badge */}
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-surface-container-low rounded-2xl flex items-center justify-center relative border border-outline-variant/10">
                  <span
                    className="material-symbols-outlined text-primary text-3xl opacity-80"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {isLunch ? "restaurant" : "dinner_dining"}
                  </span>
                  <div className={`absolute -top-2 -right-2 text-[10px] font-black px-2 py-1 rounded-lg ${isLunch ? 'bg-secondary text-on-secondary' : 'bg-primary text-on-primary'}`}>
                    {order.menu.type.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Order Info */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
                {/* Customer Details */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">
                    Customer
                  </p>
                  <h4 className="text-lg font-bold text-on-surface leading-tight">
                    {order.user.name}
                  </h4>
                  <a
                    href={`tel:${fmtPhone(order.user.phone)}`}
                    className="text-sm text-stone-500 font-medium hover:text-primary transition-colors hover:underline"
                  >
                    {fmtPhone(order.user.phone)}
                  </a>
                </div>

                {/* Delivery Target */}
                <div className="md:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">
                    Delivery Box & Address
                  </p>
                  <p className="text-sm text-on-surface-variant font-medium leading-relaxed max-w-sm">
                    <span className="font-bold text-on-surface mr-1">{order.menu.name}</span>
                     — {addr?.address ?? "No specific address provided."}
                  </p>
                  {order.adminNote && (
                    <p className="text-xs text-error font-medium mt-1 uppercase tracking-tighter">
                      Note: {order.adminNote}
                    </p>
                  )}
                </div>

                {/* Actions (Map Link & Due Amount) */}
                <div className="flex flex-col md:items-end justify-center gap-2 print:hidden">
                  {balance > 0 ? (
                    <span className="text-xs font-black uppercase tracking-widest text-error border border-error/20 bg-error/5 px-2 py-1 rounded text-center">
                      Collect ৳{balance}
                    </span>
                  ) : (
                    <span className="text-xs font-black uppercase tracking-widest text-green-700 border border-green-700/20 bg-green-50 px-2 py-1 rounded text-center">
                      Prepaid
                    </span>
                  )}
                  {addr?.lat && addr?.lng && (
                    <a
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-surface-container-low rounded-lg text-primary text-sm font-bold border border-outline-variant/20 hover:bg-primary-fixed/40 transition-colors w-full md:w-auto"
                      href={`https://maps.google.com/?q=${addr.lat},${addr.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="material-symbols-outlined text-sm">map</span>
                      Map Link
                    </a>
                  )}
                </div>
                
                {/* Print Only Action */}
                <div className="hidden print:block text-right">
                    <span className="text-sm font-black uppercase text-stone-800">
                      {balance > 0 ? `COLLECT: ৳${balance}` : "PREPAID"}
                    </span>
                </div>
              </div>

              {/* Handover Checkbox */}
              <div className="flex-shrink-0 md:pl-6 md:border-l border-outline-variant/30 print:pl-6 print:border-l">
                <label className="flex flex-col items-center gap-2 cursor-pointer">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                    Handover
                  </span>
                  <input
                    className="w-8 h-8 rounded-lg border-2 border-outline-variant text-primary focus:ring-primary/20 cursor-pointer transition-all checked:bg-primary print:border-stone-800 print:appearance-auto"
                    type="checkbox"
                    defaultChecked={order.status === "OutForDelivery" || order.status === "Delivered"}
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
