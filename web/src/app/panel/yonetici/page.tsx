"use client";

import { useState } from "react";
import Link from "next/link";
import { TwinMark } from "@/components/brand/twin-mark";

const icons = {
  panel: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>,
  teachers: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  classes: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  curriculum: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
};

const navItems = [
  { id: "panel", label: "Panel (Genel)", icon: icons.panel },
  { id: "teachers", label: "Öğretmen Atama", icon: icons.teachers },
  { id: "classes", label: "Sınıf Değerlendirme", icon: icons.classes },
  { id: "curriculum", label: "Kazanım Atama", icon: icons.curriculum },
];

const TEACHERS = [
  { name: "Mert Öğretmen", branch: "Matematik", classes: ["12-A", "12-B"], avgRisk: 51 },
  { name: "Aylin Hoca", branch: "Fizik", classes: ["12-A"], avgRisk: 58 },
  { name: "Kerem Bey", branch: "Türkçe", classes: ["8-A"], avgRisk: 44 },
  { name: "Selin Öğretmen", branch: "Kimya", classes: [], avgRisk: 0 },
];

const CLASSES = [
  { name: "12-A", program: "YKS Sayısal", students: 34, avgRisk: 58, teacher: "Mert Öğretmen" },
  { name: "12-B", program: "YKS Eşit Ağırlık", students: 31, avgRisk: 44, teacher: "Mert Öğretmen" },
  { name: "8-A", program: "LGS", students: 28, avgRisk: 51, teacher: "Kerem Bey" },
];

const CURRICULUM_OVERSIGHT = [
  { subject: "Matematik", teacher: "Mert Öğretmen", outcomes: 23, covered: 17 },
  { subject: "Fizik", teacher: "Aylin Hoca", outcomes: 12, covered: 8 },
  { subject: "Türkçe", teacher: "Kerem Bey", outcomes: 18, covered: 18 },
  { subject: "Kimya", teacher: "Atanmadı", outcomes: 15, covered: 0 },
];

export default function YoneticiPanel() {
  const [activeTab, setActiveTab] = useState("panel");
  const [assignTeacher, setAssignTeacher] = useState(TEACHERS[3].name);
  const [assignClass, setAssignClass] = useState(CLASSES[0].name);
  const [assigned, setAssigned] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case "panel":
        return (
          <div>
            <h1 className="text-3xl font-heading font-semibold mb-2 tracking-tight">Hoş geldin, Okul Müdürü</h1>
            <p className="text-foreground/60 mb-8">Okulunda 4 öğretmen, 3 sınıf ve 93 öğrenci var. İşte genel özet:</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <span className="text-sm font-semibold text-brand-green uppercase tracking-wider">Öğretmen</span>
                <div className="text-5xl font-bold mt-4">4</div>
                <div className="h-1.5 w-12 bg-brand-green mt-4 mb-3 rounded-full" />
                <span className="text-sm text-foreground/60">1 tanesi sınıfsız</span>
              </div>
              <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <span className="text-sm font-semibold text-brand-yellow-600 uppercase tracking-wider">Sınıf</span>
                <div className="text-5xl font-bold mt-4">3</div>
                <div className="h-1.5 w-12 bg-brand-yellow mt-4 mb-3 rounded-full" />
                <span className="text-sm text-foreground/60">93 öğrenci</span>
              </div>
              <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <span className="text-sm font-semibold text-foreground/50 uppercase tracking-wider">Okul Risk Ort.</span>
                <div className="text-5xl font-bold mt-4">%51</div>
                <div className="h-1.5 w-12 bg-border mt-4 mb-3 rounded-full" />
                <span className="text-sm text-foreground/60">Tüm sınıflar geneli</span>
              </div>
              <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <span className="text-sm font-semibold text-foreground/50 uppercase tracking-wider">Müfredat Kapsamı</span>
                <div className="text-5xl font-bold mt-4">%64</div>
                <div className="h-1.5 w-12 bg-border mt-4 mb-3 rounded-full" />
                <span className="text-sm text-foreground/60">İşlenen kazanım oranı</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-surface p-8 rounded-2xl border border-border shadow-sm">
                <h3 className="font-heading font-semibold text-xl mb-5">Öğretmen özeti</h3>
                <div className="space-y-4">
                  {TEACHERS.map((t, i) => (
                    <div key={i} className="p-4 rounded-xl bg-background border border-border flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm">{t.name}</div>
                        <div className="text-xs text-foreground/60 mt-0.5">{t.branch} · {t.classes.length > 0 ? t.classes.join(", ") : "Sınıf atanmadı"}</div>
                      </div>
                      {t.classes.length === 0 ? (
                        <span className="text-[11px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-red-100 text-red-700">Atama Bekliyor</span>
                      ) : (
                        <span className="text-sm font-semibold text-brand-green">%{t.avgRisk} risk</span>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={() => setActiveTab("teachers")} className="mt-5 text-sm text-brand-green font-medium hover:underline">Öğretmen atamalarını yönet →</button>
              </div>

              <div className="bg-surface p-8 rounded-2xl border border-border shadow-sm">
                <h3 className="font-heading font-semibold text-xl mb-5">En riskli sınıflar</h3>
                <div className="space-y-5">
                  {CLASSES.slice().sort((a, b) => b.avgRisk - a.avgRisk).map((c, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1.5 font-medium">
                        <span>{c.name} · {c.teacher}</span>
                        <span className="text-foreground/50">%{c.avgRisk} risk</span>
                      </div>
                      <div className="h-2.5 w-full bg-surface-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${c.avgRisk > 55 ? "bg-red-400" : c.avgRisk > 45 ? "bg-brand-yellow" : "bg-brand-green"}`} style={{ width: `${c.avgRisk}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setActiveTab("classes")} className="mt-6 text-sm text-brand-green font-medium hover:underline">Sınıf değerlendirmesine git →</button>
              </div>
            </div>
          </div>
        );

      case "teachers":
        return (
          <div>
            <h1 className="text-3xl font-heading font-semibold mb-2 tracking-tight">Öğretmen Atama</h1>
            <p className="text-foreground/60 mb-8 max-w-2xl">Öğretmenleri sınıflara ata, branş ve yükünü yönet.</p>

            <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm mb-8 flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-foreground/60">Öğretmen</label>
                <select value={assignTeacher} onChange={(e) => setAssignTeacher(e.target.value)} className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none">
                  {TEACHERS.map((t) => <option key={t.name}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-foreground/60">Sınıf</label>
                <select value={assignClass} onChange={(e) => setAssignClass(e.target.value)} className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none">
                  {CLASSES.map((c) => <option key={c.name}>{c.name}</option>)}
                </select>
              </div>
              <button onClick={() => setAssigned(true)} className="bg-brand-green text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-sm hover:bg-brand-green-600">Ata</button>
              {assigned && <span className="text-sm text-brand-green font-medium">{assignTeacher}, {assignClass} sınıfına atandı.</span>}
            </div>

            <h3 className="font-heading font-semibold text-xl mb-4">Öğretmen Listesi</h3>
            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-foreground/70">Öğretmen</th>
                    <th className="px-6 py-4 font-semibold text-foreground/70">Branş</th>
                    <th className="px-6 py-4 font-semibold text-foreground/70">Atanan Sınıflar</th>
                    <th className="px-6 py-4 font-semibold text-foreground/70 text-right">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {TEACHERS.map((t, i) => (
                    <tr key={i} className="hover:bg-surface-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium">{t.name}</td>
                      <td className="px-6 py-4 text-foreground/60">{t.branch}</td>
                      <td className="px-6 py-4">{t.classes.length > 0 ? t.classes.join(", ") : "—"}</td>
                      <td className="px-6 py-4 text-right">
                        {t.classes.length === 0 ? (
                          <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-md font-semibold text-xs">Atama Bekliyor</span>
                        ) : (
                          <span className="bg-brand-green/10 text-brand-green px-2.5 py-1 rounded-md font-semibold text-xs">Aktif</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "classes":
        return (
          <div>
            <h1 className="text-3xl font-heading font-semibold mb-2 tracking-tight">Sınıf Değerlendirme</h1>
            <p className="text-foreground/60 mb-8 max-w-2xl">Okul genelinde sınıfları karşılaştır, öğretmen bazında performansı incele.</p>

            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm mb-8">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-foreground/70">Sınıf</th>
                    <th className="px-6 py-4 font-semibold text-foreground/70">Program</th>
                    <th className="px-6 py-4 font-semibold text-foreground/70">Öğrenci</th>
                    <th className="px-6 py-4 font-semibold text-foreground/70">Sorumlu Öğretmen</th>
                    <th className="px-6 py-4 font-semibold text-foreground/70 text-right">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {CLASSES.map((c, i) => (
                    <tr key={i} className="hover:bg-surface-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium">{c.name}</td>
                      <td className="px-6 py-4 text-foreground/60">{c.program}</td>
                      <td className="px-6 py-4">{c.students}</td>
                      <td className="px-6 py-4">{c.teacher}</td>
                      <td className="px-6 py-4 text-right font-semibold text-brand-green">%{c.avgRisk}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-surface p-8 rounded-3xl border border-border shadow-sm">
              <h3 className="font-heading font-semibold text-lg mb-6">Sınıflar Arası Risk Karşılaştırması</h3>
              <div className="space-y-7">
                {CLASSES.map((c, i) => (
                  <div key={i} className="flex items-center gap-5">
                    <div className="w-16 text-sm font-bold text-foreground/70">{c.name}</div>
                    <div className="flex-1 h-4 bg-surface-muted rounded-full overflow-hidden shadow-inner">
                      <div className={`h-full rounded-full ${c.avgRisk > 55 ? "bg-red-400" : c.avgRisk > 45 ? "bg-brand-yellow" : "bg-brand-green"}`} style={{ width: `${c.avgRisk}%` }} />
                    </div>
                    <div className="w-14 text-right text-sm font-bold">%{c.avgRisk}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "curriculum":
        return (
          <div>
            <h1 className="text-3xl font-heading font-semibold mb-2 tracking-tight">Kazanım Atama</h1>
            <p className="text-foreground/60 mb-8 max-w-2xl">Ders bazında kazanım/müfredat sorumluluğunu öğretmenlere ata, kapsamı izle.</p>

            <div className="space-y-5">
              {CURRICULUM_OVERSIGHT.map((c, i) => (
                <div key={i} className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-base">{c.subject}</h4>
                      {c.teacher === "Atanmadı" ? (
                        <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-md font-semibold text-xs">Öğretmen Atanmadı</span>
                      ) : (
                        <span className="bg-surface-muted px-2.5 py-1 rounded-md font-medium text-xs text-foreground/70">{c.teacher}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2.5 bg-surface-muted rounded-full overflow-hidden max-w-md">
                        <div className={`h-full rounded-full ${c.covered === c.outcomes ? "bg-brand-green" : "bg-brand-yellow"}`} style={{ width: `${(c.covered / c.outcomes) * 100}%` }} />
                      </div>
                      <span className="text-sm text-foreground/60 shrink-0">{c.covered}/{c.outcomes} kazanım işlendi</span>
                    </div>
                  </div>
                  <button className="text-sm font-semibold text-brand-green hover:underline shrink-0">
                    {c.teacher === "Atanmadı" ? "Öğretmen Ata" : "Yeniden Ata"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
      <aside className="w-[280px] flex-none flex flex-col bg-surface border-r border-border shadow-sm relative z-20">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2.5 mb-2 hover:opacity-80 transition-opacity">
            <TwinMark variant="egitim" />
          </Link>
          <div className="text-[10px] tracking-widest uppercase text-brand-yellow-600 font-bold ml-9">Yönetici Paneli</div>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1 px-4 overflow-y-auto pb-4">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all font-medium text-sm border outline-none focus-visible:ring-2 focus-visible:ring-brand-green ${
                  isActive
                    ? "bg-brand-yellow/10 text-brand-yellow-700 border-brand-yellow/20 shadow-sm"
                    : "text-foreground/70 hover:bg-surface-muted border-transparent hover:text-foreground"
                }`}
              >
                <span className={`${isActive ? "text-brand-yellow-600" : "text-foreground/40"} transition-colors`}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border bg-surface-muted/30">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-muted cursor-pointer transition-colors">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-green to-brand-green-600 text-white flex items-center justify-center font-bold shadow-sm">
              OM
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate text-foreground">Okul Müdürü</div>
              <div className="text-xs text-foreground/50 truncate font-medium">Yönetici</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto relative bg-background">
        <div className="max-w-6xl mx-auto p-8 lg:p-12 pb-24">{renderContent()}</div>
      </main>
    </div>
  );
}
