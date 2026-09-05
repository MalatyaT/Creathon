"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { linkStudentAction } from "@/app/ogretmen/actions";

export function LinkStudentForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setPending(true);
    setMessage(null);
    try {
      const result = await linkStudentAction(email.trim());
      setMessage(result.message);
      if (result.ok) {
        setEmail("");
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ogrenci@ornek.com"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-green"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-full bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-brand-green-600 disabled:opacity-60"
        >
          {pending ? "Ekleniyor…" : "Sınıfıma ekle"}
        </button>
      </div>
      {message && <p className="text-sm text-foreground/65">{message}</p>}
    </form>
  );
}
