"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PORTALS, type PortalSlug } from "@/lib/roles";
import { DEMO_MODE } from "@/lib/demo";

export function RoleAuthForm({
  slug,
  mode,
}: {
  slug: PortalSlug;
  mode: "login" | "signup";
}) {
  const portal = PORTALS[slug];
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [program, setProgram] = useState<"yks" | "lgs">("yks");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (DEMO_MODE) {
      // Supabase henüz bağlı değil (sunum/demo modu): gerçek kimlik doğrulama
      // yapmadan doğrudan panele geç. Supabase bağlanınca bu dal devre dışı kalır.
      router.push(portal.dashboardPath);
      router.refresh();
      return;
    }

    setPending(true);
    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: portal.role,
              full_name: fullName,
              ...(portal.role === "student" ? { program } : {}),
            },
          },
        });
        if (signUpError) throw signUpError;

        if (!data.session) {
          // E-posta onayı açıksa oturum hemen açılmaz; profil satırı
          // yine de trigger ile oluşturulur, kullanıcı onaydan sonra giriş yapar.
          setCheckEmail(true);
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }

      router.push(portal.dashboardPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu");
    } finally {
      setPending(false);
    }
  }

  if (checkEmail) {
    return (
      <p className="text-sm text-foreground/70">
        {email} adresine bir onay bağlantısı gönderdik. Onayladıktan sonra bu
        sayfadan giriş yapabilirsin.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {mode === "signup" && (
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Ad soyad
          <input
            required={!DEMO_MODE}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-violet"
          />
        </label>
      )}

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        E-posta
        <input
          required={!DEMO_MODE}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-violet"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Şifre
        <input
          required={!DEMO_MODE}
          type="password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-violet"
        />
      </label>

      {mode === "signup" && portal.role === "student" && (
        <fieldset className="flex flex-col gap-1.5 text-sm font-medium">
          <legend className="mb-0.5">Sınav</legend>
          <div className="flex gap-4 text-sm font-normal">
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="program"
                checked={program === "yks"}
                onChange={() => setProgram("yks")}
              />
              YKS
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="program"
                checked={program === "lgs"}
                onChange={() => setProgram("lgs")}
              />
              LGS
            </label>
          </div>
        </fieldset>
      )}

      {error && <p className="text-sm text-risk-5">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-brand-violet px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-violet-600 disabled:opacity-60"
      >
        {pending ? "…" : mode === "signup" ? "Kayıt ol" : "Giriş yap"}
      </button>
    </form>
  );
}
