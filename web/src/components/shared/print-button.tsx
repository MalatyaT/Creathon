"use client";

export function PrintButton({ label = "Raporu indir" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-surface-muted print:hidden"
    >
      {label}
    </button>
  );
}
