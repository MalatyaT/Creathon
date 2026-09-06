"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { TwinMark } from "@/components/brand/twin-mark";
import {
  confirmOpenEndedAttempt,
  gradeFreeformPaperAction,
  gradePaperAction,
  listLinkedStudents,
  listStudentHomework,
  type FreeformResultItem,
  type GradedQuestion,
  type GradePaperResult,
  type HomeworkOption,
  type LinkedStudent,
} from "@/app/panel/ogretmen/actions";
import { useCurriculum, YKS_MATH_CURRICULUM, type WeekStatus } from "@/lib/curriculum-data";

const icons = {
  panel: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>,
  createQ: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
  exam: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  analysis: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  homework: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  grading: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/></svg>,
  resources: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  classes: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  curriculum: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
};

const navItems = [
  { id: "panel", label: "Panel (Genel)", icon: icons.panel },
  { id: "createQ", label: "Soru Oluşturma", icon: icons.createQ },
  { id: "exam", label: "Sınav Oluşturma", icon: icons.exam },
  { id: "analysis", label: "Analiz", icon: icons.analysis },
  { id: "homework", label: "Ödevlendirme", icon: icons.homework },
  { id: "grading", label: "Kağıt Puanlama", icon: icons.grading },
  { id: "resources", label: "Kaynak Yönetme", icon: icons.resources },
  { id: "classes", label: "Sınıf Yönetme", icon: icons.classes },
  { id: "curriculum", label: "Kazanım / Müfredat", icon: icons.curriculum },
];

const CLASSES = [
  { id: "12a", name: "12-A", program: "YKS Sayısal", count: 34, avgRisk: 58 },
  { id: "12b", name: "12-B", program: "YKS Eşit Ağırlık", count: 31, avgRisk: 44 },
  { id: "8a", name: "8-A", program: "LGS", count: 28, avgRisk: 51 },
];

const ROSTERS: Record<string, { name: string; risk: number; hw: string }[]> = {
  "12a": [
    { name: "Ayşe Yılmaz", risk: 62, hw: "12/14" },
    { name: "Deniz Kaya", risk: 71, hw: "9/14" },
    { name: "Mert Şahin", risk: 38, hw: "14/14" },
    { name: "Zeynep Arslan", risk: 55, hw: "11/14" },
  ],
  "12b": [
    { name: "Can Demir", risk: 40, hw: "13/13" },
    { name: "Elif Çelik", risk: 49, hw: "10/13" },
  ],
  "8a": [
    { name: "Ege Yıldız", risk: 66, hw: "8/12" },
    { name: "Su Aydın", risk: 47, hw: "12/12" },
  ],
};

const RESOURCES = [
  { title: "3D TYT Matematik Soru Bankası", category: "TYT", pages: 212, questions: 486, status: "Tamamlandı" },
  { title: "Endemik Fizik Föy", category: "AYT", pages: 64, questions: 140, status: "Tamamlandı" },
  { title: "Bilfen LGS Soru Bankası", category: "LGS", pages: 180, questions: 320, status: "İşleniyor" },
  { title: "Hız Yayınları Türkçe Paragraf", category: "TYT", pages: 96, questions: 210, status: "Tamamlandı" },
];

const PENDING_GRADING = [
  { student: "Ayşe Yılmaz", exam: "Karekök Deneme 12", uploaded: "2 saat önce" },
  { student: "Deniz Kaya", exam: "Karekök Deneme 12", uploaded: "3 saat önce" },
  { student: "Mert Şahin", exam: "Bilfen TYT 7", uploaded: "Dün" },
];

function CurriculumTab() {
  const { state, updateWeek, isLoading } = useCurriculum();

  if (isLoading || !state) return <div>Yükleniyor...</div>;

  return (
    <div>
      <h1 className="text-3xl font-heading font-semibold mb-2 tracking-tight">YKS Matematik Kazanım Yönetimi</h1>
      <p className="text-foreground/60 mb-8 max-w-2xl">Öğrencilerin müfredat takibini buradan yönetebilirsiniz. 38 haftalık plandaki işleniş durumlarını ve uyarıları (dijital ikiz hataları) değiştirin.</p>

      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="grid grid-cols-[80px_1fr_150px_150px] gap-4 p-4 border-b border-border bg-surface-muted/30 font-semibold text-sm text-foreground/70">
          <div>Hafta</div>
          <div>Kazanım / Konu</div>
          <div>Durum</div>
          <div>İkiz Uyarısı</div>
        </div>
        
        <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
          {YKS_MATH_CURRICULUM.map((week) => {
            const current = state[week.id];
            
            return (
              <div key={week.id} className="grid grid-cols-[80px_1fr_150px_150px] gap-4 p-4 items-center hover:bg-surface-muted/20 transition-colors">
                <div className="font-bold text-brand-green">{week.week}. Hafta</div>
                <div className="font-medium text-sm">{week.topic} <span className="text-xs text-foreground/40 ml-2">({week.term}. Dönem)</span></div>
                
                <div>
                  <select 
                    value={current.status} 
                    onChange={(e) => updateWeek(week.id, { status: e.target.value as WeekStatus })}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border outline-none cursor-pointer ${
                      current.status === 'tamamlandi' ? 'bg-brand-green/10 text-brand-green border-brand-green/20' : 
                      current.status === 'isleniyor' ? 'bg-brand-yellow/10 text-brand-yellow-700 border-brand-yellow/30' : 
                      'bg-background text-foreground/50 border-border hover:bg-surface-muted'
                    }`}
                  >
                    <option value="bekliyor">Bekliyor</option>
                    <option value="isleniyor">İşleniyor</option>
                    <option value="tamamlandi">Tamamlandı</option>
                  </select>
                </div>
                
                <div>
                  <button 
                    onClick={() => updateWeek(week.id, { hasTwinWarning: !current.hasTwinWarning })}
                    className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                      current.hasTwinWarning 
                        ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
                        : 'bg-background text-foreground/30 border-border hover:bg-surface-muted'
                    }`}
                  >
                    {current.hasTwinWarning ? '⚠️ Hata Var' : 'Sorun Yok'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function OgretmenPanel() {
  const [activeTab, setActiveTab] = useState("panel");

  // Soru Oluşturma
  const [qCount, setQCount] = useState("10");
  const [qLevel, setQLevel] = useState("Orta");
  const [useClassWeight, setUseClassWeight] = useState(true);

  // Sınav Oluşturma
  const [examStep, setExamStep] = useState(1);
  const [examSubject, setExamSubject] = useState("");

  // Sınıf Yönetme
  const [selectedClass, setSelectedClass] = useState("12a");

  // Kağıt Puanlama — gerçek Gemini multimodal okuma + homework'ün gerçek cevap anahtarına
  // karşı deterministik puanlama (bkz. panel/ogretmen/actions.ts)
  const [gradingStudents, setGradingStudents] = useState<LinkedStudent[]>([]);
  const [gradingStudentId, setGradingStudentId] = useState("");
  const [gradingHomeworks, setGradingHomeworks] = useState<HomeworkOption[]>([]);
  const [gradingHomeworkId, setGradingHomeworkId] = useState("");
  const [gradingFile, setGradingFile] = useState<File | null>(null);
  const [gradingFilePreviewUrl, setGradingFilePreviewUrl] = useState<string | null>(null);
  const [gradingResult, setGradingResult] = useState<GradePaperResult | null>(null);
  const [gradingLoading, setGradingLoading] = useState(false);
  const [gradingError, setGradingError] = useState<string | null>(null);

  // "Ödev bazlı" (homework + gerçek cevap anahtarı) ya da "Serbest kağıt" (numarasız/ızgara
  // düzenli, önceden bilinen bir cevap anahtarı olmayan kağıtlar — bkz. extract-answer-sheet.ts)
  const [gradingMode, setGradingMode] = useState<"homework" | "freeform">("homework");
  const [freeformResult, setFreeformResult] = useState<FreeformResultItem[] | null>(null);
  const [freeformLoading, setFreeformLoading] = useState(false);
  const [freeformError, setFreeformError] = useState<string | null>(null);

  function handleGradingFileChange(file: File | null) {
    setGradingFile(file);
    setGradingFilePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
    setGradingResult(null);
    setFreeformResult(null);
    setGradingError(null);
    setFreeformError(null);
  }

  useEffect(() => {
    listLinkedStudents().then((list) => {
      setGradingStudents(list);
      setGradingStudentId(list[0]?.id ?? "");
    });
  }, []);

  useEffect(() => {
    if (!gradingStudentId) return;
    listStudentHomework(gradingStudentId).then((list) => {
      setGradingHomeworks(list);
      setGradingHomeworkId(list[0]?.id ?? "");
    });
  }, [gradingStudentId]);

  async function handleGradePaper() {
    if (!gradingFile || !gradingStudentId || !gradingHomeworkId) return;
    setGradingLoading(true);
    setGradingError(null);
    setGradingResult(null);
    try {
      const formData = new FormData();
      formData.set("studentId", gradingStudentId);
      formData.set("homeworkId", gradingHomeworkId);
      formData.set("file", gradingFile);
      const result = await gradePaperAction(formData);
      setGradingResult(result);
    } catch (err) {
      setGradingError(err instanceof Error ? err.message : "Kağıt puanlanamadı");
    } finally {
      setGradingLoading(false);
    }
  }

  async function handleGradeFreeform() {
    if (!gradingFile) return;
    setFreeformLoading(true);
    setFreeformError(null);
    setFreeformResult(null);
    try {
      const formData = new FormData();
      formData.set("file", gradingFile);
      const result = await gradeFreeformPaperAction(formData);
      setFreeformResult(result);
    } catch (err) {
      setFreeformError(err instanceof Error ? err.message : "Kağıt okunamadı");
    } finally {
      setFreeformLoading(false);
    }
  }

  async function handleConfirmOpenEnded(attemptId: string, isCorrect: boolean) {
    await confirmOpenEndedAttempt({ attemptId, isCorrect });
    setGradingResult((prev: GradePaperResult | null) =>
      prev
        ? {
            ...prev,
            questions: prev.questions.map((q: GradedQuestion) =>
              q.attemptId === attemptId ? { ...q, isCorrect, needsReview: false } : q,
            ),
            scoreCorrect: prev.questions.filter((q: GradedQuestion) =>
              q.attemptId === attemptId ? isCorrect : q.isCorrect === true,
            ).length,
          }
        : prev,
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "panel":
        return (
          <div>
            <h1 className="text-3xl font-heading font-semibold mb-2 tracking-tight">Hoş geldin, Mert Öğretmen</h1>
            <p className="text-foreground/60 mb-8">
              3 sınıfın, <span className="font-semibold text-brand-green">93 öğrencin</span> var. İşte bugünün özeti:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <span className="text-sm font-semibold text-brand-green uppercase tracking-wider">Sınıf</span>
                <div className="text-5xl font-bold mt-4">3</div>
                <div className="h-1.5 w-12 bg-brand-green mt-4 mb-3 rounded-full" />
                <span className="text-sm text-foreground/60">Toplam 93 öğrenci</span>
              </div>
              <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <span className="text-sm font-semibold text-brand-yellow-600 uppercase tracking-wider">Bekleyen Puanlama</span>
                <div className="text-5xl font-bold mt-4">{PENDING_GRADING.length}</div>
                <div className="h-1.5 w-12 bg-brand-yellow mt-4 mb-3 rounded-full" />
                <span className="text-sm text-foreground/60">Kağıt puanlama bekliyor</span>
              </div>
              <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <span className="text-sm font-semibold text-foreground/50 uppercase tracking-wider">Ortalama Risk</span>
                <div className="text-5xl font-bold mt-4">%51</div>
                <div className="h-1.5 w-12 bg-border mt-4 mb-3 rounded-full" />
                <span className="text-sm text-foreground/60">Tüm sınıflar geneli</span>
              </div>
              <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <span className="text-sm font-semibold text-foreground/50 uppercase tracking-wider">Havuzdaki Soru</span>
                <div className="text-5xl font-bold mt-4">1156</div>
                <div className="h-1.5 w-12 bg-border mt-4 mb-3 rounded-full" />
                <span className="text-sm text-foreground/60">4 kaynaktan işlendi</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-surface p-8 rounded-2xl border border-border shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/5 rounded-bl-full" />
                <h3 className="font-heading font-semibold text-xl mb-2 relative z-10">Sınıflarının risk özeti</h3>
                <p className="text-sm text-foreground/60 mb-6 relative z-10">En yüksek riskli konular, sınıf bazında.</p>
                <div className="space-y-5 relative z-10">
                  {CLASSES.map((c) => (
                    <div key={c.id}>
                      <div className="flex justify-between text-sm mb-1.5 font-medium">
                        <span>{c.name} · {c.program}</span>
                        <span className="text-foreground/50">%{c.avgRisk} risk</span>
                      </div>
                      <div className="h-2.5 w-full bg-surface-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${c.avgRisk > 55 ? "bg-red-400" : c.avgRisk > 45 ? "bg-brand-yellow" : "bg-brand-green"}`}
                          style={{ width: `${c.avgRisk}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setActiveTab("classes")}
                  className="mt-6 text-sm text-brand-green font-medium hover:underline"
                >
                  Tüm sınıfları yönet →
                </button>
              </div>

              <div className="bg-surface p-8 rounded-2xl border border-border shadow-sm">
                <h3 className="font-heading font-semibold text-xl mb-5">Bekleyen kağıt puanlamaları</h3>
                <div className="space-y-4">
                  {PENDING_GRADING.map((p, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-background border border-border hover:border-brand-yellow/50 transition-colors cursor-pointer flex items-center justify-between"
                      onClick={() => setActiveTab("grading")}
                    >
                      <div>
                        <div className="font-semibold text-sm">{p.student}</div>
                        <div className="text-xs text-foreground/60 mt-0.5">{p.exam}</div>
                      </div>
                      <span className="text-[11px] text-foreground/50 font-medium">{p.uploaded}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setActiveTab("grading")}
                  className="mt-5 text-sm text-brand-green font-medium hover:underline"
                >
                  Kağıt puanlamaya git →
                </button>
              </div>
            </div>
          </div>
        );

      case "createQ":
        return (
          <div>
            <h1 className="text-3xl font-heading font-semibold mb-2 tracking-tight">Soru Oluştur</h1>
            <p className="text-foreground/60 mb-8 max-w-2xl">
              Havuzdaki sorulardan ve yapay zeka sentezinden, sınıfının hata desenine göre ağırlıklandırılmış yeni sorular üret.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8">
              <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm space-y-6 h-fit">
                <div>
                  <label className="block text-sm font-semibold mb-2">Sınıf</label>
                  <select className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-green cursor-pointer">
                    {CLASSES.map((c) => (
                      <option key={c.id}>{c.name} · {c.program}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Ders & Konu</label>
                  <select className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-green cursor-pointer">
                    <option>YKS Matematik - Limit</option>
                    <option>YKS Matematik - Türev</option>
                    <option>YKS Fizik - Optik</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Soru Sayısı</label>
                  <div className="flex gap-2">
                    {["5", "10", "15", "20"].map((num) => (
                      <button
                        key={num}
                        onClick={() => setQCount(num)}
                        className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${qCount === num ? "border-brand-green bg-brand-green/10 text-brand-green shadow-sm" : "border-border text-foreground/70 hover:bg-surface-muted"}`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Zorluk Seviyesi</label>
                  <div className="flex gap-2">
                    {["Kolay", "Orta", "Zor"].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setQLevel(lvl)}
                        className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${qLevel === lvl ? "border-brand-yellow bg-brand-yellow/10 text-brand-yellow-700 shadow-sm" : "border-border text-foreground/70 hover:bg-surface-muted"}`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-2">
                  <label
                    onClick={() => setUseClassWeight(!useClassWeight)}
                    className={`flex items-center gap-4 cursor-pointer p-4 rounded-xl border-2 transition-all shadow-sm ${useClassWeight ? "border-brand-green bg-brand-green/5 hover:bg-brand-green/10" : "border-border bg-background hover:bg-surface-muted"}`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${useClassWeight ? "border-brand-green bg-brand-green text-white" : "border-border bg-transparent text-transparent"}`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <span className={`text-sm font-bold ${useClassWeight ? "text-brand-green" : "text-foreground/60"}`}>Sınıfın hata desenini ağırlıklandır</span>
                  </label>
                </div>
                <button className="w-full bg-brand-green text-white font-bold py-3 rounded-xl hover:bg-brand-green-600 transition-transform active:scale-95 shadow-sm mt-2">
                  Soruları Üret
                </button>
              </div>

              <div className="bg-surface p-8 rounded-2xl border border-border shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-heading font-semibold text-lg">Önizleme</h3>
                  <span className="bg-surface-muted px-3 py-1 rounded-full text-xs font-semibold">{qCount} soru · {qLevel}</span>
                </div>
                <div className="space-y-5">
                  {[
                    { no: 1, text: "Bir sayının 3 katının 5 fazlası 26 olduğuna göre, bu sayı kaçtır?", src: "📖 3D TYT Matematik, s. 64" },
                    { no: 2, text: "lim(x→2) (x²-4)/(x-2) limitinin değeri nedir?", src: "✨ yapay zeka" },
                    { no: 3, text: "f(x) = x³ - 3x fonksiyonunun azalan olduğu aralık nedir?", src: "✨ yapay zeka" },
                  ].map((q) => (
                    <div key={q.no} className="flex gap-4 pb-5 border-b border-border last:border-0 last:pb-0">
                      <div className="w-7 shrink-0 font-heading text-sm font-semibold text-brand-green">{q.no}</div>
                      <div>
                        <div className="text-[15px] leading-relaxed">{q.text}</div>
                        <span className="mt-2 inline-block rounded-full bg-surface-muted px-2.5 py-0.5 text-xs text-foreground/60">{q.src}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "exam":
        return (
          <div>
            <h1 className="text-3xl font-heading font-semibold mb-2 tracking-tight">Sınav Oluştur</h1>
            <p className="text-foreground/60 mb-8 max-w-2xl">
              Havuzdaki sorulardan sınıfına özel bir deneme hazırla, seçtiğin kazanımlara göre soruları diz.
            </p>

            <div className="bg-surface p-8 rounded-2xl border border-border shadow-sm mb-10 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-yellow/5 rounded-bl-full pointer-events-none" />
              <h3 className="font-heading font-semibold text-xl mb-6 relative z-10 text-brand-green">Yeni Sınav</h3>

              <div className="relative z-10">
                {examStep === 1 && (
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold mb-2">1. Adım: Ders Seçin</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {["Matematik", "Fizik", "Kimya", "Biyoloji", "Türkçe", "Tarih", "Coğrafya", "Felsefe"].map((sub) => (
                        <button
                          key={sub}
                          onClick={() => { setExamSubject(sub); setExamStep(2); }}
                          className="p-4 rounded-xl border border-border bg-background hover:border-brand-green hover:bg-brand-green/5 transition-all font-medium text-center shadow-sm"
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {examStep === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-semibold">2. Adım: {examSubject} Kazanımlarını Seçin</label>
                      <button onClick={() => setExamStep(1)} className="text-xs text-foreground/50 hover:text-foreground hover:underline font-medium px-2 py-1 rounded bg-surface-muted">← Ders Seçimine Dön</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
                      {["Temel Kavramlar", "Üslü Sayılar", "Köklü Sayılar", "Çarpanlara Ayırma", "Denklemler", "Fonksiyonlar", "Polinomlar", "Limit"].map((kaz) => (
                        <label key={kaz} className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-background hover:bg-surface-muted hover:border-brand-yellow/50 cursor-pointer transition-all">
                          <input type="checkbox" className="w-4 h-4 accent-brand-yellow-600 rounded cursor-pointer" />
                          <span className="text-sm font-medium">{kaz}</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-4 pt-4 border-t border-border mt-4">
                      <label className="text-sm font-semibold">Sınıf:</label>
                      <select className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm outline-none">
                        {CLASSES.map((c) => <option key={c.id}>{c.name}</option>)}
                      </select>
                      <button onClick={() => setExamStep(3)} className="ml-auto bg-brand-yellow hover:bg-brand-yellow-600 text-foreground font-bold px-8 py-2.5 rounded-xl text-sm shadow-sm">Sınavı Oluştur ve Ata</button>
                    </div>
                  </div>
                )}

                {examStep === 3 && (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green mb-5">
                      {icons.exam}
                    </div>
                    <h4 className="font-bold text-xl text-brand-green mb-2">Sınav Oluşturuldu ve Sınıfa Atandı</h4>
                    <p className="text-sm text-foreground/60 mb-8 max-w-md">
                      {examSubject} sınavı, seçtiğin kazanımlara göre havuzdan derlendi ve öğrencilerin ödev listesine düştü.
                    </p>
                    <button onClick={() => setExamStep(1)} className="text-sm font-semibold text-foreground/50 underline hover:text-foreground">Yeni Sınav Oluştur</button>
                  </div>
                )}
              </div>
            </div>

            <h3 className="font-heading font-semibold text-xl mb-4">Son Oluşturulan Sınavlar</h3>
            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-foreground/70">Sınav Adı</th>
                    <th className="px-6 py-4 font-semibold text-foreground/70">Sınıf</th>
                    <th className="px-6 py-4 font-semibold text-foreground/70">Soru</th>
                    <th className="px-6 py-4 font-semibold text-foreground/70">Tamamlanma</th>
                    <th className="px-6 py-4 font-semibold text-foreground/70 text-right">Detay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { name: "Limit Kavrama Denemesi", cls: "12-A", q: 20, done: "24/34" },
                    { name: "Optik Karma Test", cls: "12-B", q: 15, done: "18/31" },
                    { name: "LGS Sayısal Deneme 3", cls: "8-A", q: 25, done: "20/28" },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-surface-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium">{row.name}</td>
                      <td className="px-6 py-4 text-foreground/60">{row.cls}</td>
                      <td className="px-6 py-4">{row.q}</td>
                      <td className="px-6 py-4 font-semibold text-brand-green">{row.done}</td>
                      <td className="px-6 py-4 text-right"><button className="text-brand-green hover:underline font-medium">Görüntüle</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "analysis":
        return (
          <div>
            <h1 className="text-3xl font-heading font-semibold mb-2 tracking-tight">Sınıf Analizi</h1>
            <p className="text-foreground/60 mb-8 max-w-2xl">Sınıflarının net gelişimi ve ders bazında güçlü/zayıf yönlerinin kapsamlı görünümü.</p>

            <div className="bg-surface p-8 sm:p-10 rounded-3xl border border-border shadow-sm mb-10 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/5 rounded-bl-full pointer-events-none" />
              <h3 className="font-heading font-semibold text-xl mb-8 relative z-10 text-brand-green">Ay Ay Sınıf Net Ortalaması (12-A)</h3>
              <div className="h-[220px] w-full relative border-l-2 border-b-2 border-border/80 pl-2 pb-2">
                <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                  {[20, 40, 60, 80].map((line) => (
                    <line key={line} x1="0" y1={line} x2="100" y2={line} stroke="var(--color-border)" strokeDasharray="1 3" strokeWidth="0.5" />
                  ))}
                  <polyline points="0,68 20,58 40,62 60,42 80,35 100,22" fill="none" stroke="var(--color-brand-green)" strokeWidth="2.5" strokeLinejoin="round" />
                </svg>
                {[
                  { month: "Eki", x: 0, y: 68 }, { month: "Kas", x: 20, y: 58 }, { month: "Ara", x: 40, y: 62 },
                  { month: "Oca", x: 60, y: 42 }, { month: "Şub", x: 80, y: 35 }, { month: "Mar", x: 100, y: 22 },
                ].map((pt, i) => (
                  <div key={i} className="absolute" style={{ left: `${pt.x}%`, top: `${pt.y}%` }}>
                    <div className="w-4 h-4 -translate-x-1/2 -translate-y-1/2 bg-surface border-[3px] border-brand-green rounded-full shadow-md" />
                    <span className="absolute top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-foreground/50">{pt.month}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-surface p-8 rounded-3xl border border-border shadow-sm">
                <h3 className="font-heading font-semibold text-lg mb-6">Ders Bazında Sınıf Ortalaması</h3>
                <div className="space-y-7">
                  {[
                    { name: "Matematik", val: 24.5, max: 40, col: "bg-brand-green" },
                    { name: "Fizik", val: 8.1, max: 14, col: "bg-brand-yellow" },
                    { name: "Kimya", val: 9.8, max: 13, col: "bg-brand-green" },
                    { name: "Biyoloji", val: 7.2, max: 13, col: "bg-red-400" },
                  ].map((sub, i) => (
                    <div key={i} className="flex items-center gap-5">
                      <div className="w-24 text-sm font-bold text-foreground/70">{sub.name}</div>
                      <div className="flex-1 h-4 bg-surface-muted rounded-full overflow-hidden shadow-inner">
                        <div className={`h-full ${sub.col} rounded-full`} style={{ width: `${(sub.val / sub.max) * 100}%` }} />
                      </div>
                      <div className="w-16 text-right text-sm font-bold">
                        <span className="text-brand-green">{sub.val}</span>
                        <span className="text-foreground/40 text-xs">/{sub.max}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface p-8 rounded-3xl border border-border shadow-sm">
                <h3 className="font-heading font-semibold text-lg mb-2">Öğrenci Sıralaması (12-A)</h3>
                <p className="text-sm text-foreground/50 mb-6">Son deneme netine göre</p>
                <div className="space-y-3">
                  {[
                    { name: "Mert Şahin", net: 88.25 },
                    { name: "Zeynep Arslan", net: 79.5 },
                    { name: "Ayşe Yılmaz", net: 74.0 },
                    { name: "Deniz Kaya", net: 61.75 },
                  ].map((s, i) => (
                    <div key={i} className="flex justify-between items-center p-3.5 bg-background border border-border rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="font-heading font-bold text-brand-green w-5">{i + 1}</span>
                        <span className="font-medium text-sm">{s.name}</span>
                      </div>
                      <span className="font-bold text-sm">{s.net}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "homework":
        return (
          <div>
            <h1 className="text-3xl font-heading font-semibold mb-2 tracking-tight">Ödevlendirme</h1>
            <p className="text-foreground/60 mb-8 max-w-2xl">Sınıflarına ve öğrencilerine ödev ata, tamamlanma durumunu takip et.</p>

            <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm mb-8 flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-foreground/60">Sınıf</label>
                <select className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none">
                  {CLASSES.map((c) => <option key={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-foreground/60">Kaynak / Test</label>
                <select className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none">
                  <option>Limit Kavrama Denemesi</option>
                  <option>3D TYT Matematik - Test 12</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-foreground/60">Son Tarih</label>
                <input type="date" className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <button className="bg-brand-green text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-sm hover:bg-brand-green-600">Ödev Ata</button>
            </div>

            <h3 className="font-heading font-semibold text-xl mb-4">Atanmış Ödevler</h3>
            <div className="space-y-4">
              {[
                { title: "Limit Kavrama Denemesi", cls: "12-A", progress: 71, due: "2 gün kaldı" },
                { title: "Optik Karma Test", cls: "12-B", progress: 58, due: "Yarın" },
                { title: "LGS Sayısal Deneme 3", cls: "8-A", progress: 30, due: "5 gün kaldı" },
              ].map((hw, i) => (
                <div key={i} className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-base mb-1">{hw.title}</h4>
                    <p className="text-sm text-foreground/60 mb-3">{hw.cls}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2.5 bg-surface-muted rounded-full overflow-hidden max-w-sm">
                        <div className="h-full bg-brand-green rounded-full" style={{ width: `${hw.progress}%` }} />
                      </div>
                      <span className="text-xs font-bold text-brand-green">%{hw.progress}</span>
                    </div>
                  </div>
                  <span className="ml-6 bg-brand-yellow/20 text-brand-yellow-700 px-3 py-1 rounded-full text-xs font-bold shrink-0">{hw.due}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case "grading":
        return (
          <div>
            <h1 className="text-3xl font-heading font-semibold mb-2 tracking-tight">Kağıt Puanlama</h1>
            <p className="text-foreground/60 mb-6 max-w-2xl">
              Öğrencinin doldurduğu cevap kağıdının fotoğrafını yükle — yapay zeka cevapları okuyup anahtarla karşılaştırır, notu ve yanlışları çıkarır.
            </p>

            <div className="inline-flex items-center gap-1 bg-surface-muted p-1 rounded-full text-sm font-medium mb-6">
              <button
                onClick={() => setGradingMode("homework")}
                className={`px-4 py-2 rounded-full transition-all ${gradingMode === "homework" ? "bg-brand-green text-white shadow-sm" : "hover:bg-surface text-foreground/70"}`}
              >
                Ödev Bazlı
              </button>
              <button
                onClick={() => setGradingMode("freeform")}
                className={`px-4 py-2 rounded-full transition-all ${gradingMode === "freeform" ? "bg-brand-green text-white shadow-sm" : "hover:bg-surface text-foreground/70"}`}
              >
                Serbest Kağıt (soru+cevap)
              </button>
            </div>
            {gradingMode === "freeform" && (
              <p className="text-xs text-foreground/50 -mt-4 mb-6 max-w-2xl">
                Numarasız, bilinen bir ödev/cevap anahtarına bağlı olmayan kağıtlar için (ör. ızgara düzenli çalışma kağıtları). AI her soruyu kendisi tespit edip soru+cevabı yazar; doğru/yanlış kararı vermez (karşılaştıracak bir cevap anahtarı yok), sadece okuma güveni verir — düşük güven kırmızı ile işaretlenip kontrol gerektiği belirtilir.
              </p>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8">
              <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm space-y-5 h-fit">
                {gradingMode === "homework" && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Öğrenci</label>
                      <select
                        className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-green"
                        value={gradingStudentId}
                        onChange={(e) => setGradingStudentId(e.target.value)}
                      >
                        {gradingStudents.length === 0 && <option value="">Bağlı öğrenci yok</option>}
                        {gradingStudents.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Ödev</label>
                      <select
                        className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-green"
                        value={gradingHomeworkId}
                        onChange={(e) => setGradingHomeworkId(e.target.value)}
                      >
                        {gradingHomeworks.length === 0 && <option value="">Bu öğrencinin ödevi yok</option>}
                        {gradingHomeworks.map((h) => (
                          <option key={h.id} value={h.id}>{h.title} ({h.questionCount} soru)</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-semibold mb-2">Cevap Kağıdı</label>
                  <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background p-8 text-center cursor-pointer hover:border-brand-green transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleGradingFileChange(e.target.files?.[0] ?? null)}
                    />
                    <span className="text-foreground/40">{icons.grading}</span>
                    <span className="text-sm font-medium text-foreground/60">
                      {gradingFile?.name ?? "Fotoğraf yükle ya da sürükle"}
                    </span>
                  </label>
                </div>
                {gradingFilePreviewUrl && (
                  <div>
                    <label className="block text-sm font-semibold mb-2">Yüklenen Görsel</label>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={gradingFilePreviewUrl}
                      alt="Yüklenen cevap kağıdı"
                      className="w-full max-h-80 object-contain rounded-xl border border-border bg-background"
                    />
                  </div>
                )}
                {gradingMode === "homework" ? (
                  <>
                    {gradingError && <p className="text-sm text-red-600">{gradingError}</p>}
                    <button
                      onClick={handleGradePaper}
                      disabled={!gradingFile || !gradingStudentId || !gradingHomeworkId || gradingLoading}
                      className="w-full bg-brand-green text-white font-bold py-3 rounded-xl hover:bg-brand-green-600 transition-transform active:scale-95 shadow-sm disabled:opacity-50"
                    >
                      {gradingLoading ? "Okunuyor..." : "Kağıdı Puanla"}
                    </button>
                  </>
                ) : (
                  <>
                    {freeformError && <p className="text-sm text-red-600">{freeformError}</p>}
                    <button
                      onClick={handleGradeFreeform}
                      disabled={!gradingFile || freeformLoading}
                      className="w-full bg-brand-green text-white font-bold py-3 rounded-xl hover:bg-brand-green-600 transition-transform active:scale-95 shadow-sm disabled:opacity-50"
                    >
                      {freeformLoading ? "Okunuyor..." : "Soru + Cevapları Çıkar"}
                    </button>
                  </>
                )}
              </div>

              <div className="bg-surface p-8 rounded-2xl border border-border shadow-sm">
                {gradingMode === "homework" ? (
                  !gradingResult ? (
                    <div className="h-full flex flex-col items-center justify-center text-center min-h-[360px]">
                      <div className="w-16 h-16 bg-surface-muted rounded-full flex items-center justify-center text-foreground/30 mb-4">
                        {icons.grading}
                      </div>
                      <p className="text-sm text-foreground/50 max-w-xs">Bir cevap kağıdı yükleyip puanladığında sonuç burada görünecek.</p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-heading font-semibold text-lg">Puanlama Sonucu</h3>
                        <span className="text-3xl font-heading font-bold text-brand-green">
                          {gradingResult.scoreCorrect}/{gradingResult.scoreTotal}
                          <span className="text-sm text-foreground/40 font-sans"> doğru</span>
                        </span>
                      </div>

                      {!gradingResult.persisted && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-xs text-red-700">
                          ⚠ Sonuçlar veritabanına kaydedilemedi{gradingResult.persistError ? ` (${gradingResult.persistError})` : ""} — aşağıdaki okuma/not doğru ama &quot;Doğru/Yanlış işaretle&quot; onayları ve dijital ikiz güncellemesi çalışmayacak. Muhtemelen bekleyen bir migration var, apply-pending-migrations.ts çalıştırılmalı.
                        </div>
                      )}
                      <div className="bg-brand-yellow/5 border border-brand-yellow/20 rounded-xl p-4 mb-6">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold uppercase tracking-wide text-brand-yellow-700">Ön Değerlendirme — Genel Not</span>
                          <span className="text-xl font-heading font-bold text-brand-yellow-700">{gradingResult.overallGrade}/100</span>
                        </div>
                        <p className="text-sm text-foreground/70">{gradingResult.overallComment || "Genel değerlendirme üretilemedi."}</p>
                        <p className="text-[11px] text-foreground/40 mt-1.5">Bu bir ön değerlendirmedir — nihai notu öğretmen kendisi verir.</p>
                      </div>

                      <div className="text-sm font-semibold mb-3">Soru bazlı sonuç</div>
                      <div className="space-y-2">
                        {gradingResult.questions.map((q) => (
                          <div
                            key={q.attemptId || q.questionNumber}
                            className={`p-3 rounded-lg border ${
                              q.needsReview
                                ? "bg-brand-yellow/10 border-brand-yellow/30"
                                : q.isCorrect
                                  ? "bg-brand-green/5 border-brand-green/20"
                                  : "bg-red-50 border-red-100"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-sm font-medium flex items-center gap-2">
                                Soru {q.questionNumber}
                                <span
                                  title="Yapay zekanın okuma güveni"
                                  className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                                    q.confidence >= 0.8
                                      ? "bg-brand-green/10 text-brand-green"
                                      : q.confidence >= 0.5
                                        ? "bg-brand-yellow/20 text-brand-yellow-700"
                                        : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  Güven %{Math.round(q.confidence * 100)}
                                </span>
                              </span>
                              {q.questionType === "multiple_choice" ? (
                                <span className="text-xs font-semibold">
                                  İşaretlenen: {q.studentAnswer || "—"} · Doğru: {q.correctAnswer}
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-foreground/60">Açık uçlu</span>
                              )}
                            </div>
                            {q.questionType === "open_ended" && (
                              <p className="text-xs text-foreground/60 mt-1">Öğrenci cevabı: {q.studentAnswer || "(okunamadı)"}</p>
                            )}
                            {q.needsReview && (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-brand-yellow-700 font-medium">İnceleme gerekiyor</span>
                                <button
                                  onClick={() => handleConfirmOpenEnded(q.attemptId, true)}
                                  className="text-xs font-semibold px-2 py-1 rounded bg-brand-green/10 text-brand-green hover:bg-brand-green/20"
                                >
                                  Doğru işaretle
                                </button>
                                <button
                                  onClick={() => handleConfirmOpenEnded(q.attemptId, false)}
                                  className="text-xs font-semibold px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                                >
                                  Yanlış işaretle
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="mt-5 text-xs text-foreground/50">
                        Bu sonuç question_attempts tablosuna kaydedildi; yanlış/onaylanan sorular öğrencinin dijital ikizinin risk skorunu güncelledi.
                      </p>
                    </div>
                  )
                ) : !freeformResult ? (
                  <div className="h-full flex flex-col items-center justify-center text-center min-h-[360px]">
                    <div className="w-16 h-16 bg-surface-muted rounded-full flex items-center justify-center text-foreground/30 mb-4">
                      {icons.grading}
                    </div>
                    <p className="text-sm text-foreground/50 max-w-xs">Bir kağıt yükleyip &quot;Soru + Cevapları Çıkar&quot;a bastığında sonuç burada görünecek.</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-heading font-semibold text-lg">Tespit Edilen Soru + Cevaplar</h3>
                      <span className="text-sm text-foreground/50">{freeformResult.length} soru</span>
                    </div>
                    <div className="space-y-3">
                      {freeformResult.map((item) => (
                        <div
                          key={item.questionNumber}
                          className={`p-3 rounded-lg border ${item.needsReview ? "bg-red-50 border-red-200" : "bg-background border-border"}`}
                        >
                          <div className="flex items-center justify-between gap-4 mb-1.5">
                            <span className="text-sm font-medium">Soru {item.questionNumber}</span>
                            <span
                              title="Yapay zekanın okuma güveni"
                              className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                                item.confidence >= 0.8
                                  ? "bg-brand-green/10 text-brand-green"
                                  : item.confidence >= 0.5
                                    ? "bg-brand-yellow/20 text-brand-yellow-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              Güven %{Math.round(item.confidence * 100)}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/80">{item.questionText || "(soru okunamadı)"}</p>
                          <p className="text-sm text-foreground/60 mt-1">
                            <span className="font-semibold text-foreground/70">Cevap: </span>
                            {item.answerText || "(cevap okunamadı)"}
                          </p>
                          {item.needsReview && (
                            <p className="text-xs font-semibold text-red-700 mt-1.5">⚠ Kontrol gerekli — düşük okuma güveni</p>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="mt-5 text-xs text-foreground/50">
                      Bu mod doğru/yanlış kararı vermez (bilinen bir cevap anahtarı yok) ve hiçbir yere kaydedilmez — sadece okuma + güven skoru.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "resources":
        return (
          <div>
            <h1 className="text-3xl font-heading font-semibold mb-2 tracking-tight">Kaynak Yönetme</h1>
            <p className="text-foreground/60 mb-8 max-w-2xl">Taranan kitapları ve soru bankalarını yönet, yeni bir kaynak yükle.</p>

            <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm mb-8 flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-semibold mb-1.5 text-foreground/60">Kitap / Kaynak Adı</label>
                <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-green" placeholder="ör. Limit Yayınları YKS Matematik" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-foreground/60">Kategori</label>
                <select className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none">
                  <option>TYT</option><option>AYT</option><option>LGS</option>
                </select>
              </div>
              <label className="bg-brand-green text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-sm hover:bg-brand-green-600 cursor-pointer">
                Sayfa Yükle
                <input type="file" accept="image/*" className="hidden" />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {RESOURCES.map((r, i) => (
                <div key={i} className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex items-start justify-between">
                  <div>
                    <div className="flex gap-2 mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-brand-green/10 text-brand-green">{r.category}</span>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded ${r.status === "Tamamlandı" ? "bg-brand-green/10 text-brand-green" : "bg-brand-yellow/20 text-brand-yellow-700"}`}>{r.status}</span>
                    </div>
                    <h4 className="font-bold text-base mb-1">{r.title}</h4>
                    <p className="text-sm text-foreground/60">{r.pages} sayfa · {r.questions} soru</p>
                  </div>
                  <button className="text-sm font-medium text-brand-green hover:underline shrink-0">Yönet</button>
                </div>
              ))}
            </div>
          </div>
        );

      case "classes":
        return (
          <div>
            <h1 className="text-3xl font-heading font-semibold mb-2 tracking-tight">Sınıf Yönetme</h1>
            <p className="text-foreground/60 mb-8 max-w-2xl">Sınıflarını ve öğrenci listelerini yönet.</p>

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
              <div className="space-y-3">
                {CLASSES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClass(c.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${selectedClass === c.id ? "border-brand-green bg-brand-green/5 shadow-sm" : "border-border bg-surface hover:bg-surface-muted"}`}
                  >
                    <div className="font-bold text-sm">{c.name}</div>
                    <div className="text-xs text-foreground/60 mt-0.5">{c.program} · {c.count} öğrenci</div>
                  </button>
                ))}
                <button className="w-full text-left p-4 rounded-xl border border-dashed border-border text-sm font-medium text-foreground/50 hover:border-brand-green hover:text-brand-green transition-colors">
                  + Yeni sınıf oluştur
                </button>
              </div>

              <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-heading font-semibold text-lg">
                    {CLASSES.find((c) => c.id === selectedClass)?.name} Öğrenci Listesi
                  </h3>
                  <button className="text-sm font-semibold text-brand-green hover:underline">+ Öğrenci ekle</button>
                </div>
                <div className="divide-y divide-border">
                  {(ROSTERS[selectedClass] ?? []).map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-green to-brand-green-600 text-white flex items-center justify-center text-xs font-bold">
                          {s.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <span className="font-medium text-sm">{s.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-foreground/60">{s.hw} ödev</span>
                        <span className={`font-semibold ${s.risk > 60 ? "text-red-500" : s.risk > 45 ? "text-brand-yellow-700" : "text-brand-green"}`}>%{s.risk} risk</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "curriculum":
        return <CurriculumTab />;

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
      <aside className="w-[280px] flex-none flex flex-col bg-surface border-r border-border shadow-sm relative z-20">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2.5 mb-2 hover:opacity-80 transition-opacity">
            <TwinMark />
            <div className="font-heading text-2xl font-bold tracking-tight text-brand-green leading-none">İkiz</div>
          </Link>
          <div className="text-[10px] tracking-widest uppercase text-brand-yellow-600 font-bold ml-9">Öğretmen Paneli</div>
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
              MÖ
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate text-foreground">Mert Öğretmen</div>
              <div className="text-xs text-foreground/50 truncate font-medium">Matematik Öğretmeni</div>
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
