"use client";
import Link from "next/link";
import { TwinMark } from "@/components/brand/twin-mark";

export default function VeliCocukPanel() {
  return (
    <div className="min-h-screen bg-surface p-6 sm:p-10 transition-colors duration-500 relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-5%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />

      <header className="flex justify-between items-center mb-10 relative z-10">
        <div className="flex items-center gap-3 h-12 sm:h-16">
          <TwinMark variant="cocuk" className="h-full" />
        </div>
        <Link href="/" className="text-foreground/60 hover:text-purple-600 font-medium transition-colors">
          Ana Sayfaya Dön
        </Link>
      </header>
      
      <main className="max-w-5xl mx-auto space-y-6 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-background/80 backdrop-blur-md rounded-3xl p-8 border border-border shadow-sm text-center">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
            👋
          </div>
          <h2 className="text-3xl font-heading font-semibold mb-4 text-foreground">Hoş Geldiniz, Ziyaretçi Veli</h2>
          <p className="text-foreground/70 mb-8 text-lg max-w-2xl mx-auto">
            Çocuğunuzun bu haftaki gelişim durumu çok iyi! Sınıf öğretmeni ve İkiz Çocuk Yapay Zekası&apos;nın hazırladığı eğlenceli ev etkinliklerine göz atabilirsiniz.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
             <button className="bg-purple-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-600/20">
               Yapay Zeka Etkinlik Önerisi Al
             </button>
             <button className="bg-surface-muted text-foreground px-8 py-3.5 rounded-xl font-bold hover:bg-surface-muted/80 transition-colors">
               Gelişim Raporu
             </button>
          </div>
        </div>
        
        {/* Dummy Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-green-100/50 p-6 rounded-2xl border border-green-200 shadow-sm hover:shadow-md transition-all">
             <div className="text-3xl mb-3">🤝</div>
             <h3 className="font-bold text-green-700 text-lg mb-1">Sosyal Beceriler</h3>
             <p className="text-green-600/80 text-sm font-medium">Arkadaşlarıyla uyumu ve paylaşımcılığı harika ilerliyor.</p>
           </div>
           <div className="bg-blue-100/50 p-6 rounded-2xl border border-blue-200 shadow-sm hover:shadow-md transition-all">
             <div className="text-3xl mb-3">🧠</div>
             <h3 className="font-bold text-blue-700 text-lg mb-1">Bilişsel Gelişim</h3>
             <p className="text-blue-600/80 text-sm font-medium">Sayıları tanıma ve renkleri eşleştirme hedeflerine ulaştı.</p>
           </div>
           <div className="bg-yellow-100/50 p-6 rounded-2xl border border-yellow-200 shadow-sm hover:shadow-md transition-all">
             <div className="text-3xl mb-3">🎨</div>
             <h3 className="font-bold text-yellow-700 text-lg mb-1">Motor Beceriler</h3>
             <p className="text-yellow-600/80 text-sm font-medium">Kalem tutma ve çizim yetenekleri hızla gelişiyor.</p>
           </div>
        </div>
      </main>
    </div>
  );
}
