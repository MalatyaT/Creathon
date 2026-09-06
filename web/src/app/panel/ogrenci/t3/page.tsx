"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, FileText, ClipboardCheck, Rocket, GraduationCap, Play,
  Calendar, MapPin, Users, Eye, ChevronRight, Sparkles, CheckCircle2, Plus,
} from "lucide-react";

type TabId = "genel" | "kesif" | "deneyap" | "akademi" | "videolar";

const TABS: { id: TabId; label: string }[] = [
  { id: "genel", label: "Genel Bakış" },
  { id: "kesif", label: "Keşif Kampüsü" },
  { id: "deneyap", label: "Deneyap" },
  { id: "akademi", label: "T3 Akademi" },
  { id: "videolar", label: "Videolar" },
];

const KESIF_SUBJECTS = ["Kodlama ve Algoritma", "Robotik", "Elektronik-Elektrik", "3B Tasarım ve Üretim", "Girişimcilik"];
const KESIF_EXAM_TYPES = ["Vize", "Final"];

type DummyQuestion = { text: string; options: string[]; correct: number };

const KESIF_QUESTION_BANK: Record<string, DummyQuestion[]> = {
  "Kodlama ve Algoritma": [
    { text: "Bir algoritmanın aynı adımları belirli bir koşul sağlanana kadar tekrar etmesini sağlayan yapıya ne ad verilir?", options: ["Değişken", "Döngü", "Fonksiyon", "Dizi"], correct: 1 },
    { text: "Aşağıdakilerden hangisi bir programlama dili değildir?", options: ["Python", "Scratch", "HTML", "Bluetooth"], correct: 3 },
    { text: "Bir dizinin (array) ilk elemanının indeks numarası çoğu programlama dilinde kaçtır?", options: ["-1", "0", "1", "2"], correct: 1 },
    { text: "İki sayıyı karşılaştırıp büyük olanı ekrana yazdıran bir yapı kurmak için hangi kontrol yapısı kullanılır?", options: ["Döngü (for)", "Koşul (if-else)", "Fonksiyon tanımı", "Değişken atama"], correct: 1 },
    { text: "Bir robotun sensörden aldığı veriye göre karar vermesi hangi kavramla ilişkilidir?", options: ["Statik veri", "Koşullu karar mekanizması", "Sabit döngü", "Renk paleti"], correct: 1 },
  ],
  "Robotik": [
    { text: "Bir robot kolunun hareketini sağlayan ve dönme hareketi üreten elektromekanik parça aşağıdakilerden hangisidir?", options: ["Direnç", "Servo motor", "Kapasitör", "LED"], correct: 1 },
    { text: "Robotun çevresindeki engelleri algılamasını sağlayan bileşen aşağıdakilerden hangisidir?", options: ["Sensör", "Röle", "Pil", "Anahtar"], correct: 0 },
    { text: "Arduino gibi bir mikrodenetleyici kartının temel görevi nedir?", options: ["Sadece güç sağlamak", "Girdileri işleyip çıktı üretmek", "Sadece ısı üretmek", "Ses kaydetmek"], correct: 1 },
    { text: "Bir hat izleyen robotun (line follower) zemindeki çizgiyi algılaması için genellikle hangi sensör kullanılır?", options: ["Sıcaklık sensörü", "Nem sensörü", "Kızılötesi (IR) sensör", "Basınç sensörü"], correct: 2 },
    { text: "Robotik projelerde güç kaynağı olarak en yaygın kullanılan bileşen aşağıdakilerden hangisidir?", options: ["Pil/akü", "Anten", "Ekran", "Hoparlör"], correct: 0 },
  ],
  "Elektronik-Elektrik": [
    { text: "Bir devrede akıma karşı gösterilen direncin birimi aşağıdakilerden hangisidir?", options: ["Volt", "Amper", "Ohm", "Watt"], correct: 2 },
    { text: "V = I × R bağıntısı aşağıdaki yasalardan hangisine aittir?", options: ["Ohm Yasası", "Newton Yasası", "Faraday Yasası", "Kirchhoff Yasası"], correct: 0 },
    { text: "Bir LED'in yanması için devreye doğru yönde bağlanması gerekir; bunun sebebi LED'in ne olmasıdır?", options: ["Direnç", "Diyot (tek yönlü eleman)", "Kondansatör", "Sigorta"], correct: 1 },
    { text: "Elektrik devrelerinde kısa devreyi önlemek için kullanılan koruyucu eleman aşağıdakilerden hangisidir?", options: ["Sigorta", "Anahtar", "Ampul", "Kablo"], correct: 0 },
    { text: "Paralel bağlı iki direncin eşdeğer direnci, dirençlerin ayrı ayrı değerleriyle karşılaştırıldığında nasıldır?", options: ["Her birinden büyüktür", "Her birinden küçüktür", "İkisine de eşittir", "Sıfırdır"], correct: 1 },
  ],
  "3B Tasarım ve Üretim": [
    { text: "3 boyutlu bir modeli katman katman üreten cihaz aşağıdakilerden hangisidir?", options: ["Lazer kesim", "3B yazıcı", "CNC freze", "Tornalama makinesi"], correct: 1 },
    { text: "3B yazıcılarda en yaygın kullanılan filament türlerinden biri aşağıdakilerden hangisidir?", options: ["PLA", "PVC", "Cam", "Alçı"], correct: 0 },
    { text: "Bir 3B modelin bilgisayar ortamında tasarlandığı yazılım türüne ne ad verilir?", options: ["CAD (Bilgisayar Destekli Tasarım)", "CRM", "ERP", "IDE"], correct: 0 },
    { text: "3B baskıda modelin tabana daha iyi tutunmasını sağlayan ince destek katmanına ne denir?", options: ["Taban (raft)", "Çekirdek", "Kabuk", "Doku"], correct: 0 },
    { text: "Üretimde bir tasarımın önce küçük ölçekli, hızlı ve ucuz bir örneğinin üretilmesine ne ad verilir?", options: ["Seri üretim", "Prototipleme", "Kalite kontrol", "Ambalajlama"], correct: 1 },
  ],
  "Girişimcilik": [
    { text: "Bir girişimin, ürününü piyasaya sürmeden önce hedef kitlesinin ihtiyaçlarını anlamak için yaptığı çalışmaya ne ad verilir?", options: ["Pazar araştırması", "Bilanço analizi", "Stok sayımı", "Vergi beyanı"], correct: 0 },
    { text: "Bir iş fikrinin en düşük maliyetle test edilebilen ilk, sade versiyonuna ne ad verilir?", options: ["Nihai ürün", "Minimum Uygulanabilir Ürün (MVP)", "Franchise", "Halka arz"], correct: 1 },
    { text: "Bir girişimin gelir modeli, gider yapısı ve değer önerisini tek sayfada özetleyen araç aşağıdakilerden hangisidir?", options: ["İş Modeli Kanvası", "Bilanço tablosu", "Zaman çizelgesi", "Organizasyon şeması"], correct: 0 },
    { text: "Bir girişimin başlangıç sermayesi bulmak için bireysel yatırımcılardan destek almasına ne ad verilir?", options: ["Melek yatırımcılık", "Halka arz", "Kredi notu", "Amortisman"], correct: 0 },
    { text: "Bir ürünü rakiplerinden ayıran, müşteriye sunduğu asıl faydaya ne ad verilir?", options: ["Değer önerisi", "Lojistik ağı", "Vergi kimlik numarası", "Bordro"], correct: 0 },
  ],
};

const DENEYAP_ACTIVITIES = [
  { title: "Arduino ile LED ve Sensör Uygulamaları", category: "Robotik ve Kodlama", date: "14 Eylül 2026", location: "Deneyap Atölye - Malatya", quota: "24/30" },
  { title: "3B Tasarım ve Baskı Atölyesi", category: "Tasarım", date: "21 Eylül 2026", location: "Deneyap Atölye - Malatya", quota: "18/24" },
  { title: "Mobil Uygulama Geliştirme Kampı", category: "Yazılım", date: "5 Ekim 2026", location: "Online", quota: "40/40" },
  { title: "Yapay Zeka ile Görüntü Tanıma Temelleri", category: "Yapay Zeka", date: "12 Ekim 2026", location: "Deneyap Atölye - Malatya", quota: "12/20" },
  { title: "İnsansız Hava Aracı (Drone) Tasarımı", category: "Havacılık ve Uzay", date: "19 Ekim 2026", location: "Deneyap Atölye - Malatya", quota: "9/16" },
  { title: "Girişimcilik ve Proje Fikri Geliştirme", category: "Girişimcilik", date: "26 Ekim 2026", location: "Online", quota: "35/50" },
];

const AKADEMI_COURSES = [
  { title: "Yapay Zekaya Giriş", instructor: "Dr. Elif Aydın", duration: "6 saat", level: "Başlangıç", progress: 40 },
  { title: "Python ile Programlamaya Başlangıç", instructor: "Mühendis Kerem Şahin", duration: "8 saat", level: "Başlangıç", progress: 75 },
  { title: "Siber Güvenlik Temelleri", instructor: "Uzm. Selin Kaya", duration: "5 saat", level: "Orta", progress: 10 },
  { title: "Girişimcilik 101", instructor: "Dr. Onur Tekin", duration: "4 saat", level: "Başlangıç", progress: 0 },
  { title: "Robotik Kodlama Atölyesi", instructor: "Mühendis Barış Demir", duration: "7 saat", level: "Orta", progress: 60 },
  { title: "Veri Bilimi ile Tanışma", instructor: "Dr. Nazlı Er", duration: "6 saat", level: "Orta", progress: 0 },
];

const VIDEOS = [
  { title: "Deneyap Atölyelerinden Kesitler", source: "Deneyap", duration: "4:12", views: "18 Bin" },
  { title: "T3 Akademi - Yapay Zekaya Giriş Dersi 1", source: "T3 Akademi", duration: "12:47", views: "9,2 Bin" },
  { title: "Keşif Kampüsü Tanıtım Filmi", source: "Keşif Kampüsü", duration: "2:35", views: "31 Bin" },
  { title: "Arduino ile İlk Projen", source: "Deneyap", duration: "9:03", views: "14 Bin" },
  { title: "T3 Akademi - Python Temelleri Dersi 2", source: "T3 Akademi", duration: "15:20", views: "6,8 Bin" },
  { title: "Keşif Kampüsü'nde Bir Gün", source: "Keşif Kampüsü", duration: "3:48", views: "22 Bin" },
];

const SOURCE_STYLES: Record<string, string> = {
  "Deneyap": "from-orange-500 to-red-600",
  "T3 Akademi": "from-red-600 to-red-800",
  "Keşif Kampüsü": "from-blue-600 to-sky-500",
};

export default function T3EntegrasyonPage() {
  const [activeTab, setActiveTab] = useState<TabId>("genel");

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-white border-b border-border shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link href="/panel/ogrenci" className="flex items-center gap-2 text-foreground/60 hover:text-foreground font-medium transition-colors">
            <ArrowLeft size={20} /> Öğrenci Paneli
          </Link>
          <div className="h-6 w-px bg-border hidden sm:block" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/t3/t3-logo.webp" alt="T3 Vakfı" className="h-9 hidden sm:block" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-blue-700 text-white">
          Demo Entegrasyon
        </span>
      </header>

      <nav className="flex items-center gap-1 bg-white border-b border-border px-6 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-red-600 text-red-600"
                : "border-transparent text-foreground/50 hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-10">
        {activeTab === "genel" && <GenelBakis onNavigate={setActiveTab} />}
        {activeTab === "kesif" && <KesifKampusu />}
        {activeTab === "deneyap" && <Deneyap />}
        {activeTab === "akademi" && <T3Akademi />}
        {activeTab === "videolar" && <Videolar />}
      </main>
    </div>
  );
}

function GenelBakis({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const cards: { id: TabId; logo: string; title: string; desc: string; accent: string }[] = [
    {
      id: "kesif", logo: "/t3/kesif-kampusu.webp", title: "Keşif Kampüsü",
      desc: "Ortaokul ve lise öğrencilerinin kodlama, robotik ve tasarım alanlarında proje ürettiği uygulamalı keşif programı. Bu entegrasyonda vize/final sınavı oluşturma özelliği sunuyor.",
      accent: "border-t-blue-600",
    },
    {
      id: "deneyap", logo: "/t3/deneyap.webp", title: "Deneyap",
      desc: "T3 Vakfı'nın Türkiye genelindeki atölyelerinde yürüttüğü, gençlerin teknoloji üreten bireyler olarak yetişmesini hedefleyen amiral gemisi programı. Bu entegrasyonda atölye/etkinlik yönetimi sunuyor.",
      accent: "border-t-orange-500",
    },
    {
      id: "akademi", logo: "/t3/t3-akademi.webp", title: "T3 Akademi",
      desc: "Yapay zekadan girişimciliğe kadar çok sayıda alanda ücretsiz çevrimiçi eğitim sunan T3 Vakfı platformu. Bu entegrasyonda kurs kataloğu ve video içerikleri sunuyor.",
      accent: "border-t-red-600",
    },
  ];

  return (
    <div className="space-y-10">
      <div className="bg-white rounded-3xl border border-border shadow-sm p-8 sm:p-12 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/t3/t3-logo.webp" alt="T3 Vakfı" className="h-16 mx-auto mb-6" />
        <h1 className="text-3xl sm:text-4xl font-heading font-bold mb-4">T3 Vakfı Entegrasyonu</h1>
        <p className="text-foreground/60 text-lg max-w-2xl mx-auto">
          Türkiye Teknoloji Takımı Vakfı&apos;nın <strong>Keşif Kampüsü</strong>, <strong>Deneyap</strong> ve{" "}
          <strong>T3 Akademi</strong> programlarını İkiz platformuna bağlayan demo entegrasyon sayfası.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => onNavigate(card.id)}
            className={`text-left bg-white rounded-2xl border border-border border-t-4 ${card.accent} shadow-sm hover:shadow-lg transition-all p-6 flex flex-col`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={card.logo} alt={card.title} className="h-10 mb-5 object-contain object-left" />
            <h3 className="font-bold text-lg mb-2">{card.title}</h3>
            <p className="text-sm text-foreground/60 flex-1">{card.desc}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground/70">
              İncele <ChevronRight size={16} />
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm p-6 sm:p-8">
        <h2 className="font-bold text-lg mb-5 flex items-center gap-2"><Sparkles size={18} className="text-orange-500" /> Bu entegrasyon nasıl çalışır?</h2>
        <div className="grid gap-4 sm:grid-cols-3 text-sm">
          <div className="flex gap-3">
            <FileText size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <p><strong>Keşif Kampüsü</strong>, platformun gerçek <Link href="/panel/soru-olustur" className="text-brand-green underline">Soru Oluşturma</Link> ve{" "}
              <Link href="/panel/kaynak-uretici" className="text-brand-green underline">Kağıt Değerlendirme</Link> altyapısını kullanarak vize/final sınavı üretir.</p>
          </div>
          <div className="flex gap-3">
            <Rocket size={18} className="text-orange-500 shrink-0 mt-0.5" />
            <p><strong>Deneyap</strong>, İkiz&apos;in <Link href="/topluluk-egitim" className="text-brand-green underline">Etkinlik Kütüphanesi</Link> altyapısına benzer bir yapıyla atölye/etkinlik yönetimi sunar.</p>
          </div>
          <div className="flex gap-3">
            <GraduationCap size={18} className="text-red-600 shrink-0 mt-0.5" />
            <p><strong>T3 Akademi</strong>, öğrencinin ilerleme durumunu takip eden bir kurs ve video içerik kütüphanesi sağlar.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function KesifKampusu() {
  const [subject, setSubject] = useState(KESIF_SUBJECTS[0]);
  const [examType, setExamType] = useState(KESIF_EXAM_TYPES[0]);
  const [questionCount, setQuestionCount] = useState(5);
  const [generated, setGenerated] = useState<DummyQuestion[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setGenerated(null);
    setTimeout(() => {
      const pool = KESIF_QUESTION_BANK[subject] ?? [];
      setGenerated(pool.slice(0, questionCount));
      setIsGenerating(false);
    }, 700);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl border border-border border-t-4 border-t-blue-600 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/t3/kesif-kampusu.webp" alt="Keşif Kampüsü" className="h-14 shrink-0" />
        <p className="text-foreground/70 leading-relaxed">
          Keşif Kampüsü, T3 Vakfı&apos;nın ortaokul ve lise öğrencilerine yönelik uygulamalı teknoloji keşif
          programıdır. Öğrenciler kodlama, robotik, elektronik, 3B tasarım ve girişimcilik alanlarında proje
          üretir. Aşağıdaki demo, kampüs eğitmenlerinin dönem sonunda vize/final sınavı oluşturmasını simüle eder.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm p-6 sm:p-8">
        <h2 className="font-bold text-lg mb-6 flex items-center gap-2"><ClipboardCheck size={18} className="text-blue-600" /> Vize / Final Sınavı Oluştur</h2>
        <div className="grid gap-4 sm:grid-cols-4 mb-6">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold mb-1.5 text-foreground/60">Ders / Atölye</label>
            <select value={subject} onChange={(e) => { setSubject(e.target.value); setGenerated(null); }} className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm">
              {KESIF_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5 text-foreground/60">Sınav Türü</label>
            <select value={examType} onChange={(e) => setExamType(e.target.value)} className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm">
              {KESIF_EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5 text-foreground/60">Soru Sayısı</label>
            <select value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm">
              {[3, 4, 5].map(n => <option key={n} value={n}>{n} soru</option>)}
            </select>
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isGenerating ? "Oluşturuluyor..." : `${subject} - ${examType} Sınavını Oluştur`}
        </button>

        {generated && (
          <div className="mt-8 pt-8 border-t border-border space-y-6">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
              <CheckCircle2 size={18} /> {subject} · {examType} sınavı hazır ({generated.length} soru)
            </div>
            {generated.map((q, i) => (
              <div key={i} className="bg-surface rounded-xl p-5 border border-border">
                <p className="font-medium text-sm mb-3">{i + 1}. {q.text}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className={`text-sm px-3 py-2 rounded-lg border ${oi === q.correct ? "border-blue-500 bg-blue-50 font-semibold text-blue-700" : "border-border bg-white text-foreground/70"}`}>
                      {String.fromCharCode(65 + oi)}) {opt}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Deneyap() {
  const [activities, setActivities] = useState(DENEYAP_ACTIVITIES);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");

  const addActivity = () => {
    if (!title.trim()) return;
    setActivities(prev => [{ title: title.trim(), category: "Yeni Etkinlik", date: "Tarih belirlenecek", location: "Deneyap Atölye", quota: "0/20" }, ...prev]);
    setTitle("");
    setShowForm(false);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl border border-border border-t-4 border-t-orange-500 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/t3/deneyap.webp" alt="Deneyap" className="h-12 shrink-0" />
        <p className="text-foreground/70 leading-relaxed flex-1">
          Deneyap, T3 Vakfı&apos;nın Türkiye genelindeki atölyelerinde gençlere teknoloji üretme deneyimi
          kazandıran amiral gemisi programıdır. Aşağıda örnek atölye/etkinlik listesini ve yeni bir etkinlik
          ekleme akışını görebilirsiniz.
        </p>
        <button
          onClick={() => setShowForm(v => !v)}
          className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-600 transition-colors shrink-0"
        >
          <Plus size={18} /> Etkinlik Ekle
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6 flex flex-col sm:flex-row gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Örn: Yapay Zeka ile Ses Tanıma Atölyesi"
            className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
          />
          <button onClick={addActivity} className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors shrink-0">Kaydet</button>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {activities.map((a, i) => (
          <div key={i} className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-all p-6 flex flex-col">
            <span className="self-start text-xs font-bold px-3 py-1 rounded-full bg-orange-50 text-orange-700 mb-3">{a.category}</span>
            <h3 className="font-bold text-base mb-3 leading-tight">{a.title}</h3>
            <div className="space-y-1.5 text-xs text-foreground/60 mb-4">
              <div className="flex items-center gap-1.5"><Calendar size={13} /> {a.date}</div>
              <div className="flex items-center gap-1.5"><MapPin size={13} /> {a.location}</div>
              <div className="flex items-center gap-1.5"><Users size={13} /> {a.quota} kontenjan dolu</div>
            </div>
            <button className="mt-auto bg-surface-muted hover:bg-orange-50 hover:text-orange-700 text-foreground/70 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              Etkinliğe Katıl
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function T3Akademi() {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl border border-border border-t-4 border-t-red-600 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/t3/t3-akademi.webp" alt="T3 Akademi" className="h-10 shrink-0" />
        <p className="text-foreground/70 leading-relaxed">
          T3 Akademi, yapay zekadan girişimciliğe, siber güvenlikten robotik kodlamaya kadar birçok alanda
          ücretsiz çevrimiçi eğitim sunan T3 Vakfı platformudur. Aşağıda örnek kurs kataloğunu ve ilerleme
          durumunu görebilirsiniz.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {AKADEMI_COURSES.map((c, i) => (
          <div key={i} className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-all p-6 flex flex-col">
            <span className="self-start text-xs font-bold px-3 py-1 rounded-full bg-red-50 text-red-700 mb-3">{c.level}</span>
            <h3 className="font-bold text-base mb-2 leading-tight">{c.title}</h3>
            <p className="text-xs text-foreground/50 mb-4">{c.instructor} · {c.duration}</p>
            <div className="h-2 w-full bg-surface-muted rounded-full overflow-hidden mb-2">
              <div className="h-full bg-gradient-to-r from-red-600 to-orange-500 rounded-full transition-all" style={{ width: `${c.progress}%` }} />
            </div>
            <div className="flex items-center justify-between text-xs text-foreground/50 mb-4">
              <span>%{c.progress} tamamlandı</span>
            </div>
            <button className="mt-auto bg-surface-muted hover:bg-red-50 hover:text-red-700 text-foreground/70 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              {c.progress > 0 ? "Devam Et" : "Kursa Başla"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Videolar() {
  return (
    <div className="space-y-6">
      <p className="text-foreground/60">Keşif Kampüsü, Deneyap ve T3 Akademi içeriklerinden bir seçki.</p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {VIDEOS.map((v, i) => (
          <div key={i} className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-all overflow-hidden group cursor-pointer">
            <div className={`relative aspect-video bg-gradient-to-br ${SOURCE_STYLES[v.source]} flex items-center justify-center`}>
              <div className="w-14 h-14 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play size={22} className="text-white fill-white ml-1" />
              </div>
              <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[11px] font-semibold px-2 py-0.5 rounded">{v.duration}</span>
              <span className="absolute top-2 left-2 bg-white/90 text-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">{v.source}</span>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-sm leading-tight mb-1.5">{v.title}</h3>
              <div className="flex items-center gap-1.5 text-xs text-foreground/50">
                <Eye size={13} /> {v.views} görüntülenme
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
