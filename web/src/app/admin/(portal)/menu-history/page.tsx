import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { menuHistory, menus } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

type Entry = {
  menuId: string;
  menuName: string;
  menuPrice: number;
  effectiveFrom: string;
  effectiveUntil: string | null;
  imageUrl: string | null;
};

type Group = {
  dayOfWeek: number;
  dayName: string;
  type: "Lunch" | "Dinner";
  entries: Entry[];
};

export default async function MenuHistoryPage() {
  if (!(await getAdminSession())) redirect("/admin/login");

  const rows = await db
    .select({
      dayOfWeek: menuHistory.dayOfWeek,
      type: menuHistory.type,
      menuId: menuHistory.menuId,
      menuName: menuHistory.menuName,
      menuPrice: menuHistory.menuPrice,
      effectiveFrom: menuHistory.effectiveFrom,
      effectiveUntil: menuHistory.effectiveUntil,
      imageUrl: menus.imageUrl,
    })
    .from(menuHistory)
    .leftJoin(menus, eq(menuHistory.menuId, menus.id))
    .orderBy(
      asc(menuHistory.dayOfWeek),
      asc(menuHistory.type),
      desc(menuHistory.effectiveFrom)
    );

  const groupMap = new Map<string, Group>();
  for (const row of rows) {
    const key = `${row.dayOfWeek}-${row.type}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        dayOfWeek: row.dayOfWeek,
        dayName: DAY_NAMES[row.dayOfWeek] ?? `Day ${row.dayOfWeek}`,
        type: row.type as "Lunch" | "Dinner",
        entries: [],
      });
    }
    groupMap.get(key)!.entries.push({
      menuId: row.menuId,
      menuName: row.menuName,
      menuPrice: row.menuPrice,
      effectiveFrom: row.effectiveFrom,
      effectiveUntil: row.effectiveUntil ?? null,
      imageUrl: row.imageUrl ?? null,
    });
  }

  const groups = Array.from(groupMap.values()).sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    return a.type === "Lunch" ? -1 : 1;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface font-headline">Menu History</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Track which menu was served on each day and time slot.
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-20 text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl mb-3 block opacity-40">history</span>
          <p className="text-lg font-medium">No history yet</p>
          <p className="text-sm mt-1">History is recorded automatically when you activate a menu.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div
              key={`${group.dayOfWeek}-${group.type}`}
              className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/10"
            >
              {/* Group header */}
              <div className="flex items-center gap-3 px-5 py-4 bg-surface-container border-b border-outline-variant/10">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                    group.type === "Lunch"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-indigo-100 text-indigo-800"
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {group.type === "Lunch" ? "wb_sunny" : "bedtime"}
                  </span>
                  {group.type}
                </span>
                <h2 className="font-bold text-on-surface">{group.dayName}</h2>
                <span className="ml-auto text-xs text-on-surface-variant">
                  {group.entries.length} {group.entries.length === 1 ? "entry" : "entries"}
                </span>
              </div>

              {/* Entries */}
              <div className="divide-y divide-outline-variant/10">
                {group.entries.map((entry, i) => {
                  const isCurrent = entry.effectiveUntil === null;
                  return (
                    <div
                      key={`${entry.menuId}-${entry.effectiveFrom}`}
                      className={`flex items-center gap-4 px-5 py-4 ${
                        isCurrent ? "bg-primary/5" : ""
                      }`}
                    >
                      {/* Timeline dot */}
                      <div className="flex flex-col items-center self-stretch">
                        <div
                          className={`w-3 h-3 rounded-full mt-1 shrink-0 ${
                            isCurrent ? "bg-primary" : "bg-outline-variant"
                          }`}
                        />
                        {i < group.entries.length - 1 && (
                          <div className="w-0.5 flex-1 bg-outline-variant/30 mt-1" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`font-semibold text-sm ${
                              isCurrent ? "text-primary" : "text-on-surface"
                            }`}
                          >
                            {entry.menuName}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          ৳{entry.menuPrice} &nbsp;·&nbsp;{" "}
                          {isCurrent
                            ? `${formatDate(entry.effectiveFrom)} – present`
                            : `${formatDate(entry.effectiveFrom)} – ${formatDate(entry.effectiveUntil!)}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
