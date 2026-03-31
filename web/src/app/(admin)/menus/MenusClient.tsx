"use client";

import { useCallback, useEffect, useState } from "react";

type Menu = {
  id: string;
  dayOfWeek: number;
  type: "Lunch" | "Dinner";
  name: string;
  description: string;
  itemsDescription: string;
  imageUrl: string | null;
  price: number;
  isActive: boolean;
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function MenusClient() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Partial<Menu>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const fetchMenus = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/menus");
    const data = await res.json();
    setMenus(data.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const startEdit = (menu: Menu) => {
    setEditingId(menu.id);
    setDrafts((p) => ({
      ...p,
      [menu.id]: {
        name: menu.name,
        description: menu.description,
        itemsDescription: menu.itemsDescription,
        imageUrl: menu.imageUrl ?? "",
        price: menu.price,
        isActive: menu.isActive,
      },
    }));
  };

  const cancelEdit = (id: string) => {
    setEditingId(null);
    setDrafts((p) => { const n = { ...p }; delete n[id]; return n; });
  };

  const saveMenu = async (id: string) => {
    const draft = drafts[id];
    if (!draft) return;
    setSaving(id);
    try {
      const res = await fetch(`/api/admin/menus/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (res.ok) {
        await fetchMenus();
        setEditingId(null);
        setSaved(id);
        setTimeout(() => setSaved(null), 2000);
      }
    } finally {
      setSaving(null);
    }
  };

  const updateDraft = (id: string, key: keyof Menu, value: unknown) => {
    setDrafts((p) => ({ ...p, [id]: { ...p[id], [key]: value } }));
  };

  // Group by day
  const byDay: Record<number, Menu[]> = {};
  menus.forEach((m) => {
    if (!byDay[m.dayOfWeek]) byDay[m.dayOfWeek] = [];
    byDay[m.dayOfWeek].push(m);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[#902d13] tracking-tight">Menus</h1>
        <p className="text-sm text-[#6b5e4e]">7 days × 2 meals = 14 items</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-[#6b5e4e]">Loading…</div>
      ) : (
        <div className="space-y-6">
          {DAYS.map((day, idx) => {
            const dayMenus = byDay[idx] ?? [];
            return (
              <div key={idx}>
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#795900] mb-3">
                  {day}
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {dayMenus.sort((a, b) => (a.type === "Lunch" ? -1 : 1)).map((menu) => {
                    const isEditing = editingId === menu.id;
                    const draft = drafts[menu.id] ?? {};
                    const isSaving = saving === menu.id;
                    const wasSaved = saved === menu.id;

                    return (
                      <div
                        key={menu.id}
                        className={`rounded-2xl border p-5 bg-white transition-all ${
                          isEditing ? "border-[#902d13]/40 shadow-sm" : "border-[#e8e0d6]"
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                menu.type === "Lunch"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-indigo-100 text-indigo-800"
                              }`}
                            >
                              {menu.type}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                (isEditing ? draft.isActive : menu.isActive)
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {(isEditing ? draft.isActive : menu.isActive) ? "Active" : "Inactive"}
                            </span>
                          </div>
                          {!isEditing && (
                            <button
                              onClick={() => startEdit(menu)}
                              className="text-xs font-bold text-[#902d13] hover:underline"
                            >
                              Edit
                            </button>
                          )}
                          {wasSaved && !isEditing && (
                            <span className="text-xs font-bold text-green-600">✓ Saved</span>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="space-y-3">
                            <Field label="Name">
                              <input
                                type="text"
                                value={(draft.name as string) ?? ""}
                                onChange={(e) => updateDraft(menu.id, "name", e.target.value)}
                                className="w-full h-9 rounded-lg border border-[#e8e0d6] bg-[#fbf9f5] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#902d13]/30"
                              />
                            </Field>
                            <Field label="Description (short)">
                              <input
                                type="text"
                                value={(draft.description as string) ?? ""}
                                onChange={(e) => updateDraft(menu.id, "description", e.target.value)}
                                className="w-full h-9 rounded-lg border border-[#e8e0d6] bg-[#fbf9f5] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#902d13]/30"
                              />
                            </Field>
                            <Field label="Items (comma-separated)">
                              <textarea
                                value={(draft.itemsDescription as string) ?? ""}
                                onChange={(e) => updateDraft(menu.id, "itemsDescription", e.target.value)}
                                rows={2}
                                className="w-full rounded-lg border border-[#e8e0d6] bg-[#fbf9f5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#902d13]/30 resize-none"
                              />
                            </Field>
                            <Field label="Image URL">
                              <input
                                type="url"
                                value={(draft.imageUrl as string) ?? ""}
                                onChange={(e) => updateDraft(menu.id, "imageUrl", e.target.value)}
                                placeholder="https://…"
                                className="w-full h-9 rounded-lg border border-[#e8e0d6] bg-[#fbf9f5] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#902d13]/30"
                              />
                            </Field>
                            <div className="flex gap-3">
                              <Field label="Price (৳)">
                                <input
                                  type="number"
                                  value={(draft.price as number) ?? 0}
                                  onChange={(e) => updateDraft(menu.id, "price", Number(e.target.value))}
                                  className="w-full h-9 rounded-lg border border-[#e8e0d6] bg-[#fbf9f5] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#902d13]/30"
                                />
                              </Field>
                              <Field label="Active">
                                <label className="flex items-center gap-2 h-9 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={(draft.isActive as boolean) ?? true}
                                    onChange={(e) => updateDraft(menu.id, "isActive", e.target.checked)}
                                    className="w-4 h-4 accent-[#902d13]"
                                  />
                                  <span className="text-sm text-[#1c1308]">Show to customers</span>
                                </label>
                              </Field>
                            </div>

                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => saveMenu(menu.id)}
                                disabled={isSaving}
                                className="px-4 h-9 rounded-xl bg-[#902d13] text-white text-sm font-bold hover:bg-[#7a2510] transition-colors disabled:opacity-60"
                              >
                                {isSaving ? "Saving…" : "Save"}
                              </button>
                              <button
                                onClick={() => cancelEdit(menu.id)}
                                className="px-4 h-9 rounded-xl bg-[#e8e0d6] text-[#4a3728] text-sm font-semibold hover:bg-[#d9cfc5] transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <p className="font-bold text-[#1c1308]">{menu.name}</p>
                            <p className="text-sm text-[#6b5e4e]">{menu.description}</p>
                            <p className="text-xs text-[#6b5e4e]">{menu.itemsDescription}</p>
                            <div className="flex items-center gap-3 pt-1">
                              <span className="text-sm font-extrabold text-[#902d13]">৳{menu.price}</span>
                              {menu.imageUrl && (
                                <a
                                  href={menu.imageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-[#795900] hover:underline"
                                >
                                  🖼 Image
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex-1">
      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#795900] mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
