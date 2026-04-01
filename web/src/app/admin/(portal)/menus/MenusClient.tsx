"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DAY_TAGLINES = [
  "The Day of Rest",
  "The Fresh Start",
  "Mid-Week Spice",
  "Roots & Heritage",
  "Clay Traditions",
  "Feast of Fire",
  "Ancestral Saturday",
];

export function MenusClient() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Editor State
  const [editorState, setEditorState] = useState<{
    mode: "create" | "edit";
    menuId?: string;
    dayOfWeek: number;
    type: "Lunch" | "Dinner";
    draft: Partial<Menu>;
  } | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);

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
    setEditorState({
      mode: "edit",
      menuId: menu.id,
      dayOfWeek: menu.dayOfWeek,
      type: menu.type,
      draft: { ...menu },
    });
  };

  const startCreate = (dayIdx: number, type: "Lunch" | "Dinner") => {
    setEditorState({
      mode: "create",
      dayOfWeek: dayIdx,
      type: type,
      draft: {
        name: "",
        description: "",
        itemsDescription: "",
        imageUrl: "",
        price: 0,
        isActive: true,
      },
    });
  };

  const updateDraft = (key: keyof Menu, value: any) => {
    setEditorState(prev => prev ? { ...prev, draft: { ...prev.draft, [key]: value } } : null);
  };

  const saveBatch = async () => {
    if (!editorState) return;
    setSaving(true);
    try {
      const isEdit = editorState.mode === "edit";
      const url = isEdit ? `/api/admin/menus/${editorState.menuId}` : "/api/admin/menus";
      const method = isEdit ? "PATCH" : "POST";

      const payload = isEdit ? editorState.draft : {
        ...editorState.draft,
        dayOfWeek: editorState.dayOfWeek,
        type: editorState.type
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchMenus();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        setEditorState(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        updateDraft("imageUrl", data.url);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const todayIndex = new Date().getDay();

  // Helper to get menu for slot
  const getMenu = (day: number, type: "Lunch" | "Dinner") =>
    menus.find(m => m.dayOfWeek === day && m.type === type && m.isActive);

  return (
    <div className="bg-surface text-on-surface">
      {/* Editorial Header Section */}
      <section className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[10px] font-bold tracking-[0.1em] rounded uppercase">Live Editor</span>
            <span className="text-on-surface-variant/60 text-xs font-medium tracking-wide">ACTIVE SEASON: HARVEST 2024</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tighter mb-4 font-headline uppercase leading-none">Curate the Weekly Hearth</h2>
          <p className="text-on-surface-variant text-lg leading-relaxed font-light italic opacity-80">
            Transform the sensory experience of our guests. Design each day Culinary narrative with artisanal precision.
          </p>
        </div>
        <div className="bg-surface-container-low p-6 rounded-2xl flex items-center gap-6 shadow-sm border border-outline-variant/10">
          <div className="flex flex-col">
            <span className="text-3xl font-black text-primary">{menus.filter(m => m.isActive).length}</span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">Active Items</span>
          </div>
          <div className="w-px h-10 bg-outline-variant/30"></div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-on-surface">Inventory Link</span>
            <span className="text-[10px] text-stone-500 uppercase tracking-tighter">{Math.floor(menus.filter(m => m.isActive).length / 2)} / 7 Days Complete</span>
          </div>
        </div>
      </section>

      {/* Weekly Menu Grid - Reorganized into Two Rows */}
      <div className="space-y-12 mb-16 overflow-x-auto pb-4 custom-scrollbar">
        {/* Lunch Row */}
        <div>
          <div className="flex items-center gap-4 mb-6">
            <span className="material-symbols-outlined text-amber-500">light_mode</span>
            <h3 className="text-xl font-black uppercase tracking-widest text-on-surface/80 underline decoration-amber-500/30 decoration-4 underline-offset-8">Lunch Masterpieces</h3>
            <div className="flex-1 h-px bg-outline-variant/30"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6 min-w-0 md:min-w-[1280px] xl:min-w-0">
            {DAYS.map((day, idx) => {
              const lunch = getMenu(idx, "Lunch");
              const isToday = idx === todayIndex;
              return (
                <div key={`lunch-${idx}`} className="space-y-3">
                  <div className={`py-1 border-b ${isToday ? "border-primary" : "border-outline-variant/20"}`}>
                    <span className={`text-[10px] font-black uppercase tracking-tighter ${isToday ? "text-primary" : "text-on-surface-variant/40"}`}>{day}</span>
                  </div>
                  {lunch ? (
                    <MenuCard menu={lunch} onEdit={() => startEdit(lunch)} isToday={isToday} />
                  ) : (
                    <EmptySlot type="Lunch" onClick={() => startCreate(idx, "Lunch")} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dinner Row */}
        <div>
          <div className="flex items-center gap-4 mb-6">
            <span className="material-symbols-outlined text-primary">dark_mode</span>
            <h3 className="text-xl font-black uppercase tracking-widest text-on-surface/80 underline decoration-primary/30 decoration-4 underline-offset-8">Dinner Offerings</h3>
            <div className="flex-1 h-px bg-outline-variant/30"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6 min-w-0 md:min-w-[1280px] xl:min-w-0">
            {DAYS.map((day, idx) => {
              const dinner = getMenu(idx, "Dinner");
              const isToday = idx === todayIndex;
              return (
                <div key={`dinner-${idx}`} className="space-y-3">
                  <div className={`py-1 border-b ${isToday ? "border-primary" : "border-outline-variant/20"}`}>
                    <span className={`text-[10px] font-black uppercase tracking-tighter ${isToday ? "text-primary" : "text-on-surface-variant/40"}`}>{day}</span>
                  </div>
                  {dinner ? (
                    <MenuCard menu={dinner} onEdit={() => startEdit(dinner)} isToday={isToday} />
                  ) : (
                    <EmptySlot type="Dinner" onClick={() => startCreate(idx, "Dinner")} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detail Editor Modal */}
      {editorState && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setEditorState(null)}
          />

          {/* Modal Content */}
          <section className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-surface rounded-sm shadow-2xl border border-outline-variant/10 animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 custom-scrollbar [scrollbar-gutter:stable]">
            <div className="sticky top-0 z-10 bg-surface/80 backdrop-blur-md p-8 pb-4 flex items-center justify-between border-b border-outline-variant/5">
              <h3 className="text-3xl font-black text-on-surface uppercase tracking-tighter">
                {editorState.mode === "create" ? "Assign New" : "Refine"}
                <span className="text-primary italic ml-2">
                  {DAYS[editorState.dayOfWeek]} {editorState.type}
                </span>
              </h3>
              <button
                onClick={() => setEditorState(null)}
                className="w-12 h-12 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-3xl">close</span>
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Image Preview (Bento Large) */}
              <div className="lg:col-span-5 rounded-3xl overflow-hidden aspect-[4/5] relative group bg-surface-container-low shadow-inner">
                {editorState.draft.imageUrl ? (
                  <img src={editorState.draft.imageUrl} alt="Menu preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant/30 gap-4">
                    <span className="material-symbols-outlined text-6xl">image_search</span>
                    <span className="text-xs font-bold uppercase tracking-widest">Heritage Plate Missing</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all flex flex-col justify-end p-8">
                  <label className="bg-white/90 backdrop-blur-md text-primary px-6 py-3 rounded-full flex items-center justify-center gap-2 hover:bg-white transition-all cursor-pointer shadow-xl scale-100 md:scale-95 md:group-hover:scale-100 duration-300">
                    <span className="material-symbols-outlined">photo_camera</span>
                    <span className="font-bold text-sm">Replace Heritage Plate</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={saving} />
                  </label>
                </div>
              </div>

              {/* Fields Section (Bento Grid) */}
              <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 transition-all focus-within:bg-surface-container shadow-sm">
                  <label className="block text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Meal Identity</label>
                  <input
                    className="w-full bg-transparent border-none p-0 text-3xl font-extrabold text-on-surface focus:ring-0 focus:outline-none placeholder-on-surface/20"
                    type="text"
                    placeholder="Enter dish name..."
                    value={editorState.draft.name || ""}
                    onChange={(e) => updateDraft("name", e.target.value)}
                  />
                </div>
                <div className="md:col-span-2 bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 transition-all focus-within:bg-surface-container">
                  <label className="block text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">The Story / Description</label>
                  <textarea
                    className="w-full bg-transparent border-none p-0 text-lg font-light leading-relaxed text-on-surface-variant focus:ring-0 focus:outline-none resize-none placeholder-on-surface/20 italic"
                    rows={3}
                    placeholder="Describe the artisanal journey of this dish..."
                    value={editorState.draft.description || ""}
                    onChange={(e) => updateDraft("description", e.target.value)}
                  />
                </div>
                <div className="md:col-span-2 bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 transition-all focus-within:bg-surface-container">
                  <label className="block text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Included Masterpieces (Ingredients)</label>
                  <textarea
                    className="w-full bg-transparent border-none p-0 text-sm font-medium leading-relaxed text-on-surface-variant focus:ring-0 focus:outline-none resize-none placeholder-on-surface/20"
                    rows={2}
                    placeholder="List the key items included in the platter..."
                    value={editorState.draft.itemsDescription || ""}
                    onChange={(e) => updateDraft("itemsDescription", e.target.value)}
                  />
                </div>
                <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 transition-all focus-within:bg-surface-container">
                  <label className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2">Investment (Price)</label>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">৳</span>
                    <input
                      className="w-full bg-transparent border-none p-0 text-2xl font-bold text-on-surface focus:ring-0 focus:outline-none"
                      type="number"
                      value={editorState.draft.price || 0}
                      onChange={(e) => updateDraft("price", Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 flex items-center justify-between transition-all focus-within:bg-surface-container">
                  <div>
                    <label className="block text-[10px] font-black text-tertiary uppercase tracking-[0.2em] mb-1">Status</label>
                    <span className={`text-base font-bold ${editorState.draft.isActive ? "text-green-600" : "text-on-surface-variant"}`}>
                      {editorState.draft.isActive ? "Live in Hearth" : "Draft Mode"}
                    </span>
                  </div>
                  <button
                    onClick={() => updateDraft("isActive", !editorState.draft.isActive)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${editorState.draft.isActive ? "bg-primary" : "bg-outline-variant"}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${editorState.draft.isActive ? "left-7" : "left-1"}`} />
                  </button>
                </div>

                {/* Actions */}
                <div className="md:col-span-2 flex justify-end gap-4 mt-6">
                  <button
                    onClick={() => setEditorState(null)}
                    className="px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-high transition-colors"
                  >
                    Discard Draft
                  </button>
                  <button
                    onClick={saveBatch}
                    disabled={saving || !editorState.draft.name}
                    className="bg-primary text-white px-12 py-4 rounded-xl font-black text-xs uppercase tracking-[0.1em] shadow-xl shadow-primary/20 hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-30 flex items-center gap-2"
                  >
                    {saving ? "Syncing..." : (editorState.mode === "create" ? "Assign to Hearth" : "Crystalize Changes")}
                    {saved && <span className="material-symbols-outlined text-sm">check_circle</span>}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function MenuCard({ menu, onEdit, isToday }: { menu: Menu; onEdit: () => void; isToday: boolean }) {
  return (
    <article className="bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all group border border-outline-variant/10 hover:border-primary/20 relative flex flex-row md:flex-col h-auto md:h-[380px]">
      {/* Image - Square on mobile, top-bar on desktop */}
      <div className="relative w-24 md:w-full h-24 md:h-40 shrink-0 overflow-hidden bg-surface-container">
        {menu.imageUrl ? (
          <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src={menu.imageUrl} alt={menu.name} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-primary/20 bg-primary/5 italic text-[10px] md:text-xs text-center p-2">Artisanal Hearth</div>
        )}
        {/* Type Badge - Mobile/Desktop placement */}
        <div className={`absolute bottom-0 right-0 md:bottom-2 md:left-2 px-2 py-0.5 md:px-2.5 md:py-0.5 text-[8px] md:text-[9px] font-black md:rounded uppercase tracking-widest shadow-sm ${menu.type === "Lunch" ? "bg-amber-400 text-amber-950" : "bg-primary text-white"}`}>
          {menu.type}
        </div>
        {/* Quick Edit - Desktop Only */}
        <div className="hidden md:flex absolute top-2 right-2 gap-1 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={onEdit}
            className="w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-primary shadow-lg hover:bg-primary hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 md:p-4 flex flex-col flex-1 justify-between min-w-0" onClick={() => { if (window.innerWidth < 768) onEdit(); }}>
        <div className="space-y-1">
          <div className="flex justify-between items-start gap-2">
            <h4 className="font-bold text-on-surface leading-tight text-sm md:text-base group-hover:text-primary transition-colors line-clamp-2">{menu.name}</h4>
            <span className="text-primary font-black text-xs md:text-sm shrink-0 bg-primary/5 px-2 py-0.5 rounded-full">৳{menu.price}</span>
          </div>
          <p className="text-xs md:text-sm text-on-surface-variant font-light line-clamp-2 md:line-clamp-4 italic leading-relaxed opacity-70">
            {menu.description}
          </p>
        </div>
        <div className="flex items-center gap-2 pt-2 md:pt-3 border-t border-outline-variant/5">
          <span className={`w-1.5 h-1.5 rounded-full ${menu.isActive ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-outline"}`}></span>
          <span className="text-[9px] md:text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest">{menu.isActive ? "Available" : "Draft"}</span>
        </div>
      </div>
      {isToday && (
        <div className="absolute top-0 left-0 w-full h-1 md:h-1.5 bg-primary"></div>
      )}
    </article>
  );
}

function EmptySlot({ type, onClick }: { type: "Lunch" | "Dinner"; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex-1 h-20 md:h-[380px] border-2 border-dashed border-outline-variant/30 rounded-2xl flex md:flex-col items-center justify-center p-4 md:p-6 text-center group cursor-pointer hover:border-primary/40 hover:bg-primary/[0.02] transition-all duration-300"
    >
      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-outline-variant/10 flex items-center justify-center text-on-surface-variant group-hover:bg-primary group-hover:text-white transition-all mb-0 md:mb-3 mr-3 md:mr-0">
        <span className="material-symbols-outlined text-xl md:text-2xl">add</span>
      </div>
      <p className="text-[10px] md:text-[11px] font-black text-on-surface-variant/40 group-hover:text-primary uppercase tracking-[0.2em] transition-colors">Assign {type}</p>
    </div>
  );
}
