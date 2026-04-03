"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const KitchenMapPicker = dynamic(
  () => import("@/components/KitchenMapPicker").then((m) => m.KitchenMapPicker),
  { ssr: false, loading: () => <div className="h-80 rounded-xl bg-surface-container-low animate-pulse" /> }
);

type AppSettings = {
  delivery_fee_mode: "fixed" | "auto";
  delivery_fee_fixed: number;
  delivery_fee_base: number;
  delivery_fee_per_km: number;
  kitchen_lat: number;
  kitchen_lng: number;
};

export function SettingsClient() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState<Partial<AppSettings>>({});

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        setSettings(d.data);
        setDraft(d.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const update = (key: keyof AppSettings, value: string | number) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (res.ok) {
        setSettings(data.data);
        setDraft(data.data);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-64 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
        Loading settings…
      </div>
    );
  }

  const mode = draft.delivery_fee_mode ?? settings.delivery_fee_mode;

  return (
    <div className="max-w-2xl space-y-10">
      {/* Header */}
      <header>
        <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">
          App Settings
        </h2>
        <p className="text-stone-500 text-sm">
          Configure delivery fees and kitchen location for automatic distance-based calculation.
        </p>
      </header>

      {/* Delivery Fee Section */}
      <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm p-8 space-y-8">
        <div>
          <h3 className="text-lg font-bold text-on-surface font-headline mb-1">Delivery Fee</h3>
          <p className="text-sm text-stone-500">
            Choose between a fixed fee per order or automatic calculation based on distance from the kitchen.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-3">
          {(["fixed", "auto"] as const).map((m) => (
            <button
              key={m}
              onClick={() => update("delivery_fee_mode", m)}
              className={`flex-1 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all ${
                mode === m
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {m === "fixed" ? "Fixed Fee" : "Auto (Distance)"}
            </button>
          ))}
        </div>

        {/* Fixed mode inputs */}
        {mode === "fixed" && (
          <div className="bg-surface-container-low rounded-xl p-6">
            <label className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2">
              Fixed Delivery Fee (৳)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-on-surface">৳</span>
              <input
                type="number"
                min={0}
                value={draft.delivery_fee_fixed ?? settings.delivery_fee_fixed}
                onChange={(e) => update("delivery_fee_fixed", Number(e.target.value))}
                className="w-full bg-transparent border-none p-0 text-3xl font-extrabold text-on-surface focus:ring-0 focus:outline-none"
              />
            </div>
            <p className="text-xs text-stone-500 mt-2">
              This amount is charged for every order regardless of distance.
            </p>
          </div>
        )}

        {/* Auto mode inputs */}
        {mode === "auto" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-low rounded-xl p-5">
                <label className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2">
                  Base Fee (৳)
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-xl font-bold">৳</span>
                  <input
                    type="number"
                    min={0}
                    value={draft.delivery_fee_base ?? settings.delivery_fee_base}
                    onChange={(e) => update("delivery_fee_base", Number(e.target.value))}
                    className="w-full bg-transparent border-none p-0 text-2xl font-bold text-on-surface focus:ring-0 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-1">Minimum base charge</p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-5">
                <label className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2">
                  Per Km Rate (৳)
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-xl font-bold">৳</span>
                  <input
                    type="number"
                    min={0}
                    value={draft.delivery_fee_per_km ?? settings.delivery_fee_per_km}
                    onChange={(e) => update("delivery_fee_per_km", Number(e.target.value))}
                    className="w-full bg-transparent border-none p-0 text-2xl font-bold text-on-surface focus:ring-0 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-1">Added per km of distance</p>
              </div>
            </div>
            <p className="text-xs text-stone-400 bg-surface-container-low rounded-xl p-4">
              Formula: <span className="font-mono font-bold">fee = base + round(distance_km × per_km_rate)</span>
            </p>
          </div>
        )}
      </section>

      {/* Kitchen Location Section */}
      <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm p-8 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-on-surface font-headline mb-1">Kitchen Location</h3>
          <p className="text-sm text-stone-500">
            Used for distance-based delivery fee calculation in Auto mode.
          </p>
        </div>

        {/* Interactive map picker */}
        <KitchenMapPicker
          lat={draft.kitchen_lat ?? settings.kitchen_lat}
          lng={draft.kitchen_lng ?? settings.kitchen_lng}
          onChange={(lat, lng) => {
            update("kitchen_lat", lat);
            update("kitchen_lng", lng);
          }}
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-low rounded-xl p-5">
            <label className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2">
              Latitude
            </label>
            <input
              type="number"
              step="0.0001"
              value={draft.kitchen_lat ?? settings.kitchen_lat}
              onChange={(e) => update("kitchen_lat", Number(e.target.value))}
              className="w-full bg-transparent border-none p-0 text-lg font-bold text-on-surface focus:ring-0 focus:outline-none"
            />
          </div>
          <div className="bg-surface-container-low rounded-xl p-5">
            <label className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2">
              Longitude
            </label>
            <input
              type="number"
              step="0.0001"
              value={draft.kitchen_lng ?? settings.kitchen_lng}
              onChange={(e) => update("kitchen_lng", Number(e.target.value))}
              className="w-full bg-transparent border-none p-0 text-lg font-bold text-on-surface focus:ring-0 focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-[0.1em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40"
        >
          {saving ? (
            <>
              <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
              Saving…
            </>
          ) : saved ? (
            <>
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Saved
            </>
          ) : (
            "Save Settings"
          )}
        </button>
      </div>
    </div>
  );
}
