"use client";

import { useState } from "react";
import { Markdown } from "@/components/ui/markdown";

export type FlowItem = {
  id: string;
  question: string;
  topic: string;
  note: string;
};

export function SolveFlow({ items }: { items: FlowItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="mt-3 flex flex-col">
      {items.map((item) => (
        <div key={item.id} className="border-b border-border">
          <button
            onClick={() => setOpenId(openId === item.id ? null : item.id)}
            className="flex w-full flex-col gap-1 py-3 text-left"
          >
            <div className="font-heading text-sm font-semibold">{item.question}</div>
            {item.topic && (
              <div className="text-xs text-foreground/50">{item.topic}</div>
            )}
          </button>
          {openId === item.id && (
            <div className="mb-3 rounded-lg bg-surface-muted px-3.5 py-3 text-sm leading-relaxed text-foreground/75">
              <Markdown>{item.note}</Markdown>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
