import { requireRole, supabaseConfigured } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { LinkStudentForm } from "@/components/shared/link-student-form";
import { PrintButton } from "@/components/shared/print-button";
import { linkChildAction } from "./actions";
import { riskColor } from "@/lib/risk";
import {
  getLinkedStudentSummaries,
  computeStudentNotes,
  averageRisk,
  type StudentSummary,
} from "@/lib/student-summaries";

export default async function VeliPage() {
  const { user, profile, previewMode } = await requireRole("parent", "/giris/veli");

  let children: StudentSummary[] = [];

  if (!previewMode && supabaseConfigured() && user) {
    const supabase = await createClient();
    children = await getLinkedStudentSummaries(supabase, user.id);
  }

  const notes = computeStudentNotes(children);
  const avgRisk = averageRisk(children);
  const totalPracticeCount = children.reduce((sum, c) => sum + c.practiceCount, 0);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-8 py-16">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">
          Merhaba {profile.full_name || "veli"}
        </h1>
        <SignOutButton />
      </div>
      <p className="max-w-xl text-sm text-foreground/65">
        Paylaşılan özet. Sohbet kayıtları ve ham soru çözümleri paylaşılmaz.
      </p>

      <div className="print:hidden">
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
          Çocuğunu ekle
        </div>
        <LinkStudentForm action={linkChildAction} buttonLabel="Ekle" />
      </div>

      {children.length === 0 ? (
        <p className="text-sm text-foreground/50">
          Henüz eklenmiş bir çocuk yok — yukarıdan öğrencinin e-postasını ekleyerek başla.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-11">
            <div className="min-w-[128px]">
              <div className="font-heading text-[30px] leading-none">
                {avgRisk === null ? "—" : `%${avgRisk}`}
              </div>
              <div className="my-2.5 h-[3px] w-[34px] bg-risk-4" />
              <div className="text-[13px] text-foreground/62">Risk ortalaması</div>
            </div>
            <div className="min-w-[128px]">
              <div className="font-heading text-[30px] leading-none">{totalPracticeCount}</div>
              <div className="my-2.5 h-[3px] w-[34px] bg-brand-coffee" />
              <div className="text-[13px] text-foreground/62">Toplam sınama</div>
            </div>
          </div>

          <div>
            <h2 className="mb-4 font-heading text-lg font-semibold">Çocuğun</h2>
            <div className="flex flex-col">
              {children.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-4 border-b border-border py-4 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-heading text-[15px] font-semibold">{c.name}</div>
                    <div className="mt-0.5 text-[13px] text-foreground/60">
                      {c.homeworkDone}/{c.homeworkTotal} ödev tamamlandı
                      {c.topTopic && ` · en riskli: ${c.topTopic}`}
                    </div>
                  </div>
                  {c.avgRisk !== null && (
                    <span
                      className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{ background: riskColor(c.avgRisk) }}
                    >
                      %{c.avgRisk} risk
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {notes.length > 0 && (
            <div>
              <h2 className="mb-4 font-heading text-lg font-semibold">Haftanın notları</h2>
              <div className="flex flex-col">
                {notes.map((n, i) => (
                  <div key={i} className="flex gap-5 border-b border-border py-3.5 last:border-b-0">
                    <div
                      className={`w-20 flex-none text-[11px] font-semibold uppercase tracking-wider ${
                        n.kind === "Güçlü"
                          ? "text-brand-green"
                          : n.kind === "Dikkat"
                            ? "text-risk-5"
                            : "text-foreground/50"
                      }`}
                    >
                      {n.kind}
                    </div>
                    <div className="text-sm leading-relaxed">{n.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <PrintButton label="Haftalık raporu indir" />
          </div>
        </>
      )}
    </div>
  );
}
