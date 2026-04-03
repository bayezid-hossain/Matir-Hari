"use client";

import { useCallback, useEffect, useState } from "react";

type PaymentNumber = {
  id: string;
  type: "bKash" | "Nagad";
  number: string;
  label: string;
  isActive: boolean;
  createdAt: string;
};

const TYPE_COLOR: Record<string, string> = {
  bKash: "#e2136e",
  Nagad: "#F7941D",
};

export function PaymentNumbersClient() {
  const [numbers, setNumbers] = useState<PaymentNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "bKash", number: "", label: "" });
  const [formLoading, setFormLoading] = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/payment-numbers");
    const data = await res.json();
    setNumbers(data.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const toggleActive = async (pn: PaymentNumber) => {
    setActionLoading(pn.id + "toggle");
    await fetch(`/api/admin/payment-numbers/${pn.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !pn.isActive }),
    });
    setActionLoading(null);
    fetch_();
  };

  const deleteNumber = async (id: string) => {
    if (!confirm("Delete this payment number?")) return;
    setActionLoading(id + "delete");
    await fetch(`/api/admin/payment-numbers/${id}`, { method: "DELETE" });
    setActionLoading(null);
    fetch_();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.number.trim()) return;
    setFormLoading(true);
    await fetch("/api/admin/payment-numbers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setFormLoading(false);
    setShowForm(false);
    setForm({ type: "bKash", number: "", label: "" });
    fetch_();
  };

  return (
    <section className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-extrabold text-on-surface tracking-tight font-headline">
            Payment Numbers
          </h2>
          <p className="text-on-surface-variant mt-1">
            Manage bKash &amp; Nagad numbers shown to customers during checkout.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all font-semibold text-sm"
        >
          <span className="material-symbols-outlined text-lg">{showForm ? "close" : "add"}</span>
          {showForm ? "Cancel" : "Add Number"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10 space-y-4"
        >
          <h3 className="font-bold text-on-surface">New Payment Number</h3>
          <div className="flex gap-3">
            {(["bKash", "Nagad"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: t }))}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${
                  form.type === t
                    ? "text-white shadow-sm"
                    : "bg-surface-container-high text-on-surface-variant"
                }`}
                style={form.type === t ? { backgroundColor: TYPE_COLOR[t] } : {}}
              >
                {t}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Phone number e.g. 01712345678"
            value={form.number}
            onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
            required
            className="w-full px-4 py-3 rounded-xl bg-surface-container-high border border-outline-variant/20 text-on-surface text-sm focus:outline-none focus:border-primary/50"
          />
          <input
            type="text"
            placeholder="Label (optional) e.g. Main, Backup"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl bg-surface-container-high border border-outline-variant/20 text-on-surface text-sm focus:outline-none focus:border-primary/50"
          />
          <button
            type="submit"
            disabled={formLoading}
            className="w-full py-3 bg-primary text-on-primary rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {formLoading ? "Adding…" : "Add Payment Number"}
          </button>
        </form>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-20 text-on-surface-variant font-bold">Loading…</div>
      ) : numbers.length === 0 ? (
        <div className="text-center py-20 text-on-surface-variant">
          No payment numbers yet. Add one to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {numbers.map((pn) => (
            <div
              key={pn.id}
              className={`flex items-center gap-4 p-5 rounded-2xl border transition-all ${
                pn.isActive
                  ? "bg-surface-container-lowest border-outline-variant/10"
                  : "bg-surface-container-low border-outline-variant/5 opacity-60"
              }`}
            >
              {/* Type badge */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-black text-sm text-white"
                style={{ backgroundColor: TYPE_COLOR[pn.type] }}
              >
                {pn.type === "bKash" ? "bK" : "Ng"}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-on-surface tracking-wide">{pn.number}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {pn.type}{pn.label ? ` · ${pn.label}` : ""}
                  {" · "}
                  {pn.isActive ? (
                    <span className="text-green-600 font-semibold">Active</span>
                  ) : (
                    <span className="text-on-surface-variant font-semibold">Inactive</span>
                  )}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(pn)}
                  disabled={!!actionLoading}
                  title={pn.isActive ? "Deactivate" : "Activate"}
                  className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                    pn.isActive
                      ? "text-green-600 hover:bg-green-50"
                      : "text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">
                    {pn.isActive ? "toggle_on" : "toggle_off"}
                  </span>
                </button>
                <button
                  onClick={() => deleteNumber(pn.id)}
                  disabled={!!actionLoading}
                  title="Delete"
                  className="p-2 text-error hover:bg-error/5 rounded-lg transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
