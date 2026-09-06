"use client";
import Link from "next/link";
import { TwinMark } from "@/components/brand/twin-mark";

export default function OgretmenCocukPanel() {
  return (
    <div className="min-h-screen bg-surface p-6 sm:p-10 transition-colors duration-500 relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-5%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />

      <header className="flex justify-between items-center mb-10 relative z-10">
        <div className="flex items-center gap-3">
          <TwinMark />
          <h1 className="text-2xl font-bold text-purple-600">İkiz Çocuk - Öğretmen Paneli</h1>
        </div>
        <Link href="/" className="text-foreground/60 hover:text-purple-600 font-medium transition-colors">
          Ana Sayfaya Dön
        </Link>
      </header>
      
      <main className="max-w-5xl mx-auto space-y-6 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-background/80 backdrop-blur-md rounded-3xl p-8 border border-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-heading font-semibold mb-2 text-foreground">Papatyalar Sınıfı 🌼</h2>
            <p className="text-foreground/70 font-medium">Mevcut: 15 Öğrenci • Bugün 2 yeni etkinlik paylaşıldı.</p>
          </div>
          <button className="bg-purple-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-600/20 whitespace-nowrap">
            Yapay Zeka Sınıf Etkinliği Üret
          </button>
        </div>
        
        <div className="bg-background/80 backdrop-blur-md rounded-3xl p-8 border border-border shadow-sm">
           <h3 className="text-xl font-bold mb-6 text-foreground flex items-center gap-2">
             📊 Sınıf Gelişim Raporu
           </h3>
           <div className="text-center text-foreground/50 py-16 bg-surface-muted/50 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center gap-4">
             <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-3xl animate-pulse">
               🤖
             </div>
             <p className="max-w-sm">Yapay zeka analizleri ve öğrenci ikiz modelleri yükleniyor... <br/><span className="text-xs mt-2 block">(Bu alan sunum için geçici olarak yer tutucudur)</span></p>
           </div>
        </div>
      </main>
    </div>
  );
}
