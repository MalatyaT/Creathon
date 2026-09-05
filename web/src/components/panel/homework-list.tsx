"use client";

import { useState } from "react";
import { toggleHomeworkAction } from "@/app/panel/odevler/actions";

export type HomeworkItem = {
  id: string;
  title: string;
  detail: string;
  topic: string;
  due: string | null;
  done: boolean;
};

export function HomeworkList({ items: initialItems }: { items: HomeworkItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleToggle(item: HomeworkItem) {
    const nextDone = !item.done;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, done: nextDone } : i)));
    setPendingId(item.id);
    try {
      await toggleHomeworkAction(item.id, nextDone);
    } catch {
      // Geri al
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, done: item.done } : i)));
    } finally {
      setPendingId(null);
    }
  }

  const doneCount = items.filter((i) => i.done).length;
  const progressPct = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  return (
    <div className="flex flex-col">
      <div className="mb-6">
        <div className="mb-2 text-sm text-foreground/55">
          {doneCount}/{items.length} tamamlandı
        </div>
        <div className="h-[7px] max-w-[420px] bg-surface-muted">
          <div className="h-[7px] bg-brand-green" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-4 border-b border-border py-5 last:border-b-0"
        >
          <button
            onClick={() => handleToggle(item)}
            disabled={pendingId === item.id}
            aria-label={item.done ? "Tamamlandı işaretini kaldır" : "Tamamlandı olarak işaretle"}
            className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center border text-white ${
              item.done ? "border-brand-green bg-brand-green" : "border-border bg-transparent"
            }`}
          >
            {item.done && (
              <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M3 8.4 6.4 11.8 13 4.6"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
          <div className="min-w-0 flex-1">
            <div
              className={`font-heading text-[17px] font-semibold ${
                item.done ? "text-foreground/45 line-through" : ""
              }`}
            >
              {item.title}
            </div>
            <div className="mt-0.5 text-sm">{item.detail}</div>
          </div>
          <div className="flex flex-none flex-col items-end gap-1.5">
            {item.topic && (
              <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium">
                {item.topic}
              </span>
            )}
            {item.due && (
              <span className="text-xs text-foreground/50">
                {new Date(item.due).toLocaleDateString("tr-TR", { day: "2-digit", month: "long" })}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
