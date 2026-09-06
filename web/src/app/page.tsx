"use client";

import { useState } from "react";
import Link from "next/link";
import { TwinMark } from "@/components/brand/twin-mark";
import { GraduationCap, User, FileEdit, Settings, Users } from "lucide-react";

export default function LandingPage() {
  const [selectedTier, setSelectedTier] = useState<"anaokulu" | "lgs" | "yks">("lgs");
  const [activePortal, setActivePortal] = useState<string | null>(null);

  const allPortals = [
    { slug: "ogretmen", label: "Öğretmen", desc: "Öğrencilerin gelişimini ve ödevlerini yapay zeka ile takip et.", icon: GraduationCap },
    { slug: "ogrenci", label: "Öğrenci", desc: "Dijital ikizinle zayıf noktalarını keşfet ve netlerini artır.", icon: User },
    { slug: "kaynak-uretici", label: "İçerik Üreticisi", desc: "Akıllı soru havuzuna sorularını ekle ve analiz et.", icon: FileEdit },
    { slug: "yonetici", label: "Yönetici", desc: "Öğretmen atamalarını, sınıfları ve müfredatı okul genelinde yönet.", icon: Settings },
    { slug: "veli", label: "Veli", desc: "Çocuğunuzun gelişim raporlarını ve analizlerini takip edin.", icon: Users }
  ];

  const portals = selectedTier === "anaokulu" 
    ? allPortals.filter(p => p.slug === "ogrenci" || p.slug === "veli")
    : allPortals.filter(p => p.slug !== "veli");

  const isAnaokulu = selectedTier === "anaokulu";

  return (
    <div className={`flex flex-col min-h-screen bg-background transition-colors duration-500`}>
      <header className="flex flex-wrap items-center justify-between px-6 py-5 sm:px-10 bg-surface border-b border-border shadow-sm gap-4 relative z-20">
        <div className="flex items-center gap-2.5">
          <TwinMark />
          <span className={`font-heading text-xl font-semibold tracking-tight transition-colors duration-300 ${isAnaokulu ? 'text-purple-600' : 'text-brand-green'}`}>
            {isAnaokulu ? "İkiz Çocuk" : "İkiz Eğitim"}
          </span>
        </div>
        <nav className="flex items-center gap-1 bg-surface-muted p-1.5 rounded-full text-sm font-medium overflow-x-auto">
          <button 
            className={`px-4 py-2 rounded-full transition-all whitespace-nowrap ${isAnaokulu ? 'bg-purple-600 text-white shadow-sm' : 'hover:bg-surface text-foreground/70'}`}
            onClick={() => { setSelectedTier('anaokulu'); setActivePortal(null); }}
          >
            Anaokulu-İlkokul
          </button>
          <button 
            className={`px-4 py-2 rounded-full transition-all whitespace-nowrap ${selectedTier === 'lgs' ? 'bg-brand-yellow text-foreground shadow-sm' : 'hover:bg-surface text-foreground/70'}`}
            onClick={() => { setSelectedTier('lgs'); setActivePortal(null); }}
          >
            LGS Hazırlık
          </button>
          <button 
            className={`px-4 py-2 rounded-full transition-all whitespace-nowrap ${selectedTier === 'yks' ? 'bg-brand-yellow text-foreground shadow-sm' : 'hover:bg-surface text-foreground/70'}`}
            onClick={() => { setSelectedTier('yks'); setActivePortal(null); }}
          >
            YKS Hazırlık
          </button>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 relative overflow-hidden transition-all duration-700">
        {/* Background decorative elements */}
        <div className={`absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full blur-3xl pointer-events-none transition-all duration-1000 ${isAnaokulu ? 'bg-purple-500/40 scale-150' : 'bg-brand-yellow/20'}`} />
        <div className={`absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full blur-3xl pointer-events-none transition-all duration-1000 ${isAnaokulu ? 'bg-blue-500/40 scale-150' : 'bg-brand-green/10'}`} />
        <div className={`absolute top-[40%] right-[20%] w-[20%] h-[20%] rounded-full blur-3xl pointer-events-none transition-all duration-1000 ${isAnaokulu ? 'bg-pink-400/30 scale-125' : 'opacity-0'}`} />

        <div className="max-w-4xl w-full text-center mb-12 relative z-10 mt-6">
          <h1 className="font-heading text-4xl sm:text-6xl font-semibold tracking-tight text-foreground mb-6 leading-tight transition-all">
            Her öğrencinin, hatasını unutmayan bir <span className={`transition-colors duration-500 ${isAnaokulu ? 'text-purple-600' : 'text-brand-yellow-600'}`}>ikizi</span> var.
          </h1>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            <span className="uppercase font-semibold">{selectedTier}</span> {isAnaokulu ? "döneminde" : "maratonunda"} çözdüğün sorularla eğitilen ikizin sayesinde, tam zayıf olduğun noktalara özel testler ve ödevlerle başarıya ulaş.
          </p>
        </div>

        <div className={`w-full max-w-6xl bg-surface/80 backdrop-blur-xl p-8 sm:p-12 rounded-3xl border border-border shadow-xl relative z-10 border-t-4 transition-colors duration-500 ${isAnaokulu ? 'border-t-purple-500' : 'border-t-brand-yellow'}`}>
          <h2 className="text-2xl font-heading font-semibold text-center mb-10 transition-colors">
            <span className={`uppercase font-bold ${isAnaokulu ? 'text-purple-600' : 'text-brand-green'}`}>{selectedTier}</span> Platformuna Giriş Yap
          </h2>
          <div className={`grid gap-8 sm:grid-cols-2 ${isAnaokulu ? 'lg:grid-cols-2 max-w-3xl mx-auto' : 'lg:grid-cols-4'}`}>
            {portals.map((portal) => {
              const isActive = activePortal === portal.slug;
              const activeBorder = isAnaokulu ? 'border-purple-500 ring-purple-500/20' : 'border-brand-yellow ring-brand-yellow/20';
              const hoverBorder = isAnaokulu ? 'hover:border-purple-400' : 'hover:border-brand-yellow/50';
              
              const Icon = portal.icon;
              
              return (
                <div 
                  key={portal.slug} 
                  className={`group flex flex-col p-8 rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer ${isActive ? `bg-surface ring-2 ${activeBorder}` : `border-border bg-background/50 hover:bg-surface ${hoverBorder}`}`}
                  onClick={() => setActivePortal(portal.slug)}
                >
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-colors ${isActive ? (isAnaokulu ? 'bg-purple-500/20 text-purple-600' : 'bg-brand-yellow/20 text-brand-yellow-700') : 'bg-surface-muted text-foreground/50 group-hover:bg-foreground/5 group-hover:text-foreground'}`}>
                      <Icon size={32} />
                    </div>
                    <h3 className="text-xl font-semibold font-heading mb-3">{portal.label}</h3>
                    <p className="text-center text-sm text-foreground/60 mb-6 flex-1 leading-relaxed">{portal.desc}</p>
                  </div>
                  
                  {/* Giriş Formu (Aktif ise göster) */}
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out flex flex-col gap-3 ${isActive ? 'max-h-64 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                    <input type="email" placeholder="E-posta adresi" className={`w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-1 ${isAnaokulu ? 'focus:border-purple-500 focus:ring-purple-500' : 'focus:border-brand-yellow focus:ring-brand-yellow'}`} defaultValue="demo@ikiz.edu.tr" />
                    <input type="password" placeholder="Şifre" className={`w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-1 ${isAnaokulu ? 'focus:border-purple-500 focus:ring-purple-500' : 'focus:border-brand-yellow focus:ring-brand-yellow'}`} defaultValue="123456" />
                    
                    <Link 
                      href={portal.slug === 'ogrenci' ? `/panel/ogrenci` : `/panel/${portal.slug}`}
                      className={`w-full mt-2 text-center rounded-xl px-6 py-3 text-sm font-semibold transition-all hover:scale-[1.02] shadow-sm ${isAnaokulu ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-brand-yellow text-foreground hover:bg-brand-yellow-600'}`}
                    >
                      Sisteme Gir
                    </Link>
                  </div>

                  {!isActive && (
                    <div className={`w-full text-center rounded-xl bg-surface-muted px-6 py-3 text-sm font-medium text-foreground/70 transition-colors ${isAnaokulu ? 'group-hover:bg-purple-500/20 group-hover:text-purple-700' : 'group-hover:bg-brand-yellow/20 group-hover:text-foreground'}`}>
                      Giriş Seç
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </main>

      <footer className="px-6 py-8 text-center text-sm text-foreground/50 relative z-10">
        İkiz Eğitim Platformu © {new Date().getFullYear()} — Tüm Hakları Saklıdır.
      </footer>
    </div>
  );
}
