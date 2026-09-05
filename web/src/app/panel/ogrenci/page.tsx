"use client";

import { useState } from "react";
import Link from "next/link";
import { TwinMark } from "@/components/brand/twin-mark";

const icons = {
  panel: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>,
  twin: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5" fill="var(--brand-green)"></circle><circle cx="12" cy="12" r="10.5" fill="var(--brand-yellow)" style={{mixBlendMode: 'multiply', transform: 'translate(2.5px, 1.6px)'}}></circle></svg>,
  createQ: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
  exam: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  homework: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  chat: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  video: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  analysis: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
};

const navItems = [
  { id: 'panel', label: 'Panel (Genel)', icon: icons.panel },
  { id: 'twin', label: 'Dijital İkiz', icon: icons.twin },
  { id: 'createQ', label: 'Soru Oluşturma', icon: icons.createQ },
  { id: 'exam', label: 'Sınav-Deneme Oluştur', icon: icons.exam },
  { id: 'homework', label: 'Ödevler', icon: icons.homework },
  { id: 'chat', label: 'Soru Sor (Chatbot)', icon: icons.chat },
  { id: 'video', label: 'Videolar', icon: icons.video },
  { id: 'analysis', label: 'Analiz', icon: icons.analysis },
];

const rootNodes = [
  { id: 'mat', label: 'Matematik', x: 25, y: 30, risk: 80, isTopic: false },
  { id: 'fiz', label: 'Fizik', x: 75, y: 25, risk: 60, isTopic: false },
  { id: 'kim', label: 'Kimya', x: 30, y: 75, risk: 45, isTopic: false },
  { id: 'biyo', label: 'Biyoloji', x: 70, y: 70, risk: 25, isTopic: false },
];

const rootEdges = [
  { source: 'mat', target: 'center', isRelated: false },
  { source: 'fiz', target: 'center', isRelated: false },
  { source: 'kim', target: 'center', isRelated: false },
  { source: 'biyo', target: 'center', isRelated: false },
];

const subjectNodes = {
  mat: [
    { id: 'limit', label: 'Limit', x: 15, y: 20, risk: 84, isTopic: true },
    { id: 'turev', label: 'Türev', x: 45, y: 15, risk: 75, isTopic: true },
    { id: 'polinom', label: 'Polinom', x: 80, y: 35, risk: 45, isTopic: true },
    { id: 'geo', label: 'Geometri', x: 25, y: 75, risk: 65, isTopic: true },
  ],
  fiz: [
    { id: 'optik', label: 'Optik', x: 20, y: 30, risk: 65, isTopic: true },
    { id: 'dinamik', label: 'Dinamik', x: 80, y: 25, risk: 50, isTopic: true },
    { id: 'elektrik', label: 'Elektrik', x: 50, y: 80, risk: 40, isTopic: true },
  ],
  kim: [
    { id: 'denge', label: 'Denge', x: 25, y: 25, risk: 60, isTopic: true },
    { id: 'organik', label: 'Organik', x: 75, y: 65, risk: 40, isTopic: true },
  ],
  biyo: [
    { id: 'sinir', label: 'Sinir S.', x: 35, y: 25, risk: 25, isTopic: true },
    { id: 'hucre', label: 'Hücre', x: 65, y: 65, risk: 15, isTopic: true },
  ]
};

const subjectEdges = {
  mat: [
    { source: 'limit', target: 'center', isRelated: false },
    { source: 'turev', target: 'center', isRelated: false },
    { source: 'polinom', target: 'center', isRelated: false },
    { source: 'geo', target: 'center', isRelated: false },
    { source: 'limit', target: 'turev', isRelated: true }, 
  ],
  fiz: [
    { source: 'optik', target: 'center', isRelated: false },
    { source: 'dinamik', target: 'center', isRelated: false },
    { source: 'elektrik', target: 'center', isRelated: false },
    { source: 'dinamik', target: 'elektrik', isRelated: true }, 
  ],
  kim: [
    { source: 'denge', target: 'center', isRelated: false },
    { source: 'organik', target: 'center', isRelated: false },
  ],
  biyo: [
    { source: 'sinir', target: 'center', isRelated: false },
    { source: 'hucre', target: 'center', isRelated: false },
  ]
};

interface TwinData {
  title: string;
  desc: string;
  stats: { label: string; val: string }[];
  questions: { id: number; title: string; desc: string; risk: string; color?: string }[];
}

const twinData: Record<string, TwinData> = {
  mat: {
    title: 'Matematik',
    desc: 'Genel hata oranınız yüksek. Özellikle türev ve limit noktalarında kavram yanılgıları var.',
    stats: [{ label: 'İşlem Hatası', val: '%42' }, { label: 'Kavram', val: '%35' }],
    questions: [
      { id: 1, title: 'Limit Belirsizlikleri Karma Test - Soru 7', desc: 'İkizin eşlenik çarpımında hata yaptı. 3 kez tekrarlandı.', risk: 'Yüksek Risk' },
      { id: 2, title: 'Türev Eğim Grafiği - Soru 11', desc: 'İkizin azalan fonksiyon işaretini kaçırdı.', risk: 'Orta Risk' }
    ]
  },
  fiz: {
    title: 'Fizik',
    desc: 'Formül ezberine dayalı konularda hata yapmıyorsunuz ancak yoruma dayalı optik konularında risk var.',
    stats: [{ label: 'Yorum', val: '%60' }, { label: 'Formül', val: '%15' }],
    questions: [
      { id: 1, title: 'Optik Kırılma - Soru 4', desc: 'İkizin tam yansıma sınır açısını hesaba katmadı.', risk: 'Yüksek Risk' }
    ]
  },
  kim: {
    title: 'Kimya',
    desc: 'Denge konularında mol kavramı geçişlerinde işlem süresi uzuyor.',
    stats: [{ label: 'İşlem Hızı', val: '%55' }, { label: 'Dikkat', val: '%20' }],
    questions: [
      { id: 1, title: 'Kimyasal Denge - Soru 9', desc: 'İkizin kısmi basınç hesaplarken mol oranlarını karıştırdı.', risk: 'Kritik' }
    ]
  },
  biyo: {
    title: 'Biyoloji',
    desc: 'Sistemler konusunda ufak bilgi eksiklikleri dışında ikizin gayet başarılı.',
    stats: [{ label: 'Bilgi Eksikliği', val: '%18' }, { label: 'Dikkat', val: '%10' }],
    questions: [
      { id: 1, title: 'Sinir Sistemi - Soru 2', desc: 'İkizin depolarizasyon grafiğini yanlış yorumladı.', risk: 'Düşük Risk' }
    ]
  },
  limit: {
    title: 'Limit (Matematik)',
    desc: 'En riskli konu. İkizin bu konuda %84 oranda yanılıyor.',
    stats: [{ label: 'İşlem Hatası', val: '%45' }, { label: 'Belirsizlik', val: '%39' }],
    questions: [
      { id: 1, title: 'Limit ve Süreklilik - Soru 7', desc: 'İkizin eşlenik çarpımında hata yaptı.', risk: 'Kritik' }
    ]
  },
  turev: {
    title: 'Türev (Matematik)',
    desc: 'Limit konularındaki eksiklikler türevi de doğrudan etkiliyor. İkisi birbiriyle bağlantılı hatalar barındırıyor.',
    stats: [{ label: 'Kavram', val: '%40' }, { label: 'İşlem', val: '%25' }],
    questions: [
      { id: 1, title: 'Türev Geometrik Yorum - Soru 2', desc: 'İkizin teğet eğimini negatif almayı unuttu.', risk: 'Yüksek Risk' }
    ]
  },
  optik: {
    title: 'Optik (Fizik)',
    desc: 'Mercekler ve kırılma yasalarında kavram yanılgısı mevcut.',
    stats: [{ label: 'Kavram', val: '%65' }, { label: 'İşlem', val: '%15' }],
    questions: [
      { id: 1, title: 'İnce Kenarlı Mercek - Soru 1', desc: 'Odak noktasını yanlış hesapladı.', risk: 'Orta Risk' }
    ]
  }
};

export default function StudentPanel() {
  const [activeTab, setActiveTab] = useState('panel');

  // Twin Graph States
  const [twinViewMode, setTwinViewMode] = useState<'root' | 'subject'>('root');
  const [selectedTwinNode, setSelectedTwinNode] = useState('mat');
  
  // Soru Oluşturma (createQ) States
  const [qCount, setQCount] = useState('10');
  const [qLevel, setQLevel] = useState('Orta');
  const [useTwinWeight, setUseTwinWeight] = useState(true);

  // Sınav-Deneme (exam) States
  const [examStep, setExamStep] = useState(1);
  const [examSubject, setExamSubject] = useState("");

  const renderContent = () => {
    switch (activeTab) {
      case 'panel':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-3xl font-heading font-semibold mb-2 tracking-tight">Hoş geldin, Ayşe</h1>
            <p className="text-foreground/60 mb-8">İkizin bu sabah <span className="font-semibold text-brand-green">240 soru</span> çözdü. İşte bugünün özeti:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <span className="text-sm font-semibold text-brand-green uppercase tracking-wider">Net Değişimi</span>
                <div className="text-5xl font-bold mt-4">+4.5</div>
                <div className="h-1.5 w-12 bg-brand-green mt-4 mb-3 rounded-full" />
                <span className="text-sm text-foreground/60">Son denemeye göre artış</span>
              </div>
              <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <span className="text-sm font-semibold text-brand-yellow-600 uppercase tracking-wider">Riskli Konular</span>
                <div className="text-5xl font-bold mt-4">3</div>
                <div className="h-1.5 w-12 bg-brand-yellow mt-4 mb-3 rounded-full" />
                <span className="text-sm text-foreground/60">Öncelikli çalışman gereken alan</span>
              </div>
              <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <span className="text-sm font-semibold text-foreground/50 uppercase tracking-wider">Çözülen Soru</span>
                <div className="text-5xl font-bold mt-4">1240</div>
                <div className="h-1.5 w-12 bg-border mt-4 mb-3 rounded-full" />
                <span className="text-sm text-foreground/60">Bu hafta havuzda taranan</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-surface p-8 rounded-2xl border border-border shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 rounded-bl-full transition-transform group-hover:scale-110" />
                <h3 className="font-heading font-semibold text-xl mb-2 relative z-10">İkizinin bugün öne çıkardığı sorular</h3>
                <p className="text-sm text-foreground/60 mb-8 relative z-10">Senin çözdüğün sorularla eğitilen ikizin bunları da yanlış yaptı. Aynı tuzağa düşme ihtimalin yüksek.</p>
                
                <div className="space-y-6 relative z-10">
                  {[
                    { num: "01", title: "Limit ve Süreklilik - YKS Matematik", risk: "Yüksek Risk", reason: "İşlem hatası (D şıkkı)", src: "3D Yayınları" },
                    { num: "02", title: "Elektrik Devreleri - YKS Fizik", risk: "Orta Risk", reason: "Formül yanılgısı (B şıkkı)", src: "Endemik" },
                    { num: "03", title: "Organik Kimya - YKS Kimya", risk: "Kritik", reason: "Kavram hatası (A şıkkı)", src: "Aydın Yayınları" }
                  ].map((item) => (
                    <div key={item.num} className="flex gap-5 items-start">
                      <div className="font-heading font-bold text-3xl text-brand-green/20 w-10 flex-none">{item.num}</div>
                      <div>
                        <div className="font-semibold text-base">{item.title}</div>
                        <div className="text-sm text-foreground/60 mt-1">{item.reason}</div>
                        <div className="flex gap-2 mt-3">
                          <span className={`text-[11px] px-2.5 py-1 rounded font-semibold ${item.risk === 'Kritik' ? 'bg-red-100 text-red-700' : 'bg-brand-yellow/20 text-brand-yellow-600'}`}>{item.risk}</span>
                          <span className="text-[11px] px-2.5 py-1 rounded bg-surface-muted text-foreground/70 font-semibold">{item.src}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex gap-3">
                  <button onClick={() => setActiveTab('chat')} className="flex-1 bg-brand-green hover:bg-brand-green-600 text-white font-medium py-2.5 rounded-full transition-colors text-sm">Bota soru sor</button>
                  <button onClick={() => setActiveTab('createQ')} className="flex-1 border border-border hover:bg-surface-muted font-medium py-2.5 rounded-full transition-colors text-sm">Test oluştur</button>
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-surface p-8 rounded-2xl border border-border shadow-sm">
                  <h3 className="font-heading font-semibold text-xl mb-5">Bugünün Ödevi</h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-background border border-border hover:border-brand-green/40 transition-colors cursor-pointer group">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-sm mb-1 group-hover:text-brand-green transition-colors">Limit ve Süreklilik Kavrama Testi</div>
                          <div className="text-xs text-foreground/60">3D TYT Matematik Soru Bankası - Test 12</div>
                        </div>
                        <span className="bg-brand-green/10 text-brand-green text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">Aktif</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-background border border-border hover:border-brand-green/40 transition-colors cursor-pointer group">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-sm mb-1 group-hover:text-brand-green transition-colors">Elektrik Devreleri Pratik</div>
                          <div className="text-xs text-foreground/60">Endemik Fizik Föy - Föy 4</div>
                        </div>
                        <span className="bg-brand-yellow/10 text-brand-yellow-600 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">Yarın</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('homework')} className="mt-5 text-sm text-brand-green font-medium hover:underline">Tüm ödevlendirmeler →</button>
                </div>

                <div className="bg-surface p-8 rounded-2xl border border-border shadow-sm">
                  <h3 className="font-heading font-semibold text-xl mb-6">En Zayıf Üç Konu</h3>
                  <div className="space-y-5">
                    {[
                      { name: 'Limit ve Süreklilik', val: '84%', w: 'w-[84%]', color: 'bg-red-500' },
                      { name: 'Optik', val: '72%', w: 'w-[72%]', color: 'bg-brand-yellow' },
                      { name: 'Türev', val: '65%', w: 'w-[65%]', color: 'bg-brand-green' }
                    ].map((subj) => (
                      <div key={subj.name}>
                        <div className="flex justify-between text-sm mb-2 font-medium">
                          <span>{subj.name}</span>
                          <span className="text-foreground/50">{subj.val} risk</span>
                        </div>
                        <div className="h-2.5 w-full bg-surface-muted rounded-full overflow-hidden">
                          <div className={`h-full ${subj.w} ${subj.color} rounded-full transition-all duration-1000 ease-out`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'twin':
        const isRoot = twinViewMode === 'root';
        const currentNodes = isRoot ? rootNodes : (subjectNodes[selectedTwinNode as keyof typeof subjectNodes] || subjectNodes['mat']);
        const currentEdges = isRoot ? rootEdges : (subjectEdges[selectedTwinNode as keyof typeof subjectEdges] || subjectEdges['mat']);
        const centerLabel = isRoot ? "İKİZİN" : (rootNodes.find(n => n.id === selectedTwinNode)?.label || "İKİZİN");
        const activeData = twinData[selectedTwinNode] || twinData['mat'];

        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-3xl font-heading font-semibold mb-2 tracking-tight">Dijital İkizin Ağ Haritası</h1>
            <p className="text-foreground/60 mb-8 max-w-2xl">
              Düğümlerin büyüklüğü o derste veya konuda yapılan hata sayısını (risk oranını) belirtir. İlgili dersin içerisine girmek (drill-down) için ders düğümüne tıklayın.
            </p>
            
            <div className="bg-surface p-8 rounded-3xl border border-border shadow-sm mb-8 relative overflow-hidden min-h-[450px] flex items-center justify-center">
              {!isRoot && (
                <button 
                  onClick={() => { setTwinViewMode('root'); setSelectedTwinNode('mat'); }} 
                  className="absolute top-6 left-6 z-20 bg-background hover:bg-surface-muted px-4 py-2 rounded-xl border border-border shadow-sm font-bold text-sm text-brand-green transition-colors active:scale-95 flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                  Genel Görünüme Dön
                </button>
              )}

              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, var(--color-foreground) 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }}/>
              
              <div className="relative w-full max-w-3xl h-[350px]">
                {/* SVG Edges */}
                <svg className="absolute inset-0 w-full h-full" overflow="visible">
                  {currentEdges.map((edge, i) => {
                    const src = currentNodes.find(n => n.id === edge.source);
                    const tgt = edge.target === 'center' ? { x: 50, y: 50 } : currentNodes.find(n => n.id === edge.target);
                    if (!src || !tgt) return null;
                    return (
                      <line 
                        key={`${twinViewMode}-${i}`} 
                        x1={`${src.x}%`} y1={`${src.y}%`} 
                        x2={`${tgt.x}%`} y2={`${tgt.y}%`} 
                        stroke={edge.isRelated ? 'var(--color-brand-yellow)' : 'var(--color-border)'} 
                        strokeWidth={edge.isRelated ? "3" : "2"} 
                        strokeDasharray={edge.isRelated ? "none" : "5 5"} 
                        className={edge.isRelated ? "animate-pulse" : ""}
                      />
                    );
                  })}
                </svg>
                
                {/* HTML Nodes */}
                {currentNodes.map(node => {
                  const isSelected = selectedTwinNode === node.id;
                  
                  // Dynamic size based on risk
                  const sizeClass = node.isTopic 
                    ? (node.risk > 70 ? 'w-24 h-24' : node.risk > 50 ? 'w-20 h-20' : 'w-16 h-16')
                    : (node.risk > 70 ? 'w-28 h-28' : node.risk > 50 ? 'w-24 h-24' : 'w-20 h-20');
                    
                  return (
                    <div 
                      key={`${twinViewMode}-${node.id}`}
                      onClick={() => {
                        setSelectedTwinNode(node.id);
                        if (!node.isTopic && isRoot) {
                          setTwinViewMode('subject'); // Drill down
                        }
                      }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 ${sizeClass} rounded-full flex flex-col items-center justify-center shadow-lg z-10 transition-all cursor-pointer animate-in zoom-in duration-500 ${
                        isSelected && !isRoot ? 'scale-110 ring-4 ring-brand-yellow ring-offset-4 ring-offset-background' : 'hover:scale-110 hover:ring-2 hover:ring-brand-green/50 hover:ring-offset-2'
                      } ${node.isTopic ? (node.risk > 70 ? 'bg-red-50 border-4 border-brand-yellow' : 'bg-surface border-4 border-brand-yellow') : 'bg-brand-green/5 border-4 border-brand-green'}`}
                      style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    >
                      <span className={`font-bold ${node.isTopic ? 'text-sm text-red-700' : 'text-sm text-brand-green'}`}>{node.label}</span>
                      {node.isTopic && <span className="text-[10px] text-red-500 mt-1">%{node.risk} Risk</span>}
                      {isSelected && !isRoot && <div className="absolute inset-0 bg-brand-yellow/20 rounded-full animate-ping -z-10" />}
                    </div>
                  );
                })}

                {/* Center Node */}
                <div className={`absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full ${isRoot ? 'bg-brand-green text-white' : 'bg-surface border-4 border-brand-green text-brand-green'} flex flex-col items-center justify-center shadow-2xl z-10 font-heading font-bold text-xl border-4 ${isRoot ? 'border-white/20' : ''} animate-in zoom-in duration-300`}>
                  {isRoot && <TwinMark size={24} />}
                  <span className={isRoot ? "mt-2" : ""}>{centerLabel}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-surface p-8 rounded-2xl border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="font-heading font-semibold text-xl">Seçili Analiz:</h3>
                  <span className="bg-brand-yellow/20 text-brand-yellow-700 px-3 py-1 rounded-full text-sm font-bold shadow-sm">{activeData?.title || 'Bilinmeyen'}</span>
                </div>
                <p className="text-sm text-foreground/70 mb-6">{activeData?.desc || 'Veri bulunamadı.'}</p>
                
                {activeData?.stats && (
                  <div className="flex gap-4 items-center mb-8">
                    {activeData.stats.map((stat, i) => (
                      <div key={i} className="flex gap-4 items-center">
                        <div className="text-4xl font-heading font-bold text-brand-yellow">{stat.val}</div>
                        <div className="text-sm font-medium leading-tight text-foreground/70">{stat.label} <br/>Hatası</div>
                        {i < activeData.stats.length - 1 && <div className="w-[1px] h-12 bg-border mx-1"></div>}
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={() => setActiveTab('createQ')} className="w-full bg-brand-green hover:bg-brand-green-600 text-white font-bold py-3.5 rounded-full transition-colors text-sm shadow-sm active:scale-95">
                  Bu Analizden Test Oluştur
                </button>
              </div>

              <div className="bg-surface p-8 rounded-2xl border border-border shadow-sm">
                <h3 className="font-heading font-semibold text-xl mb-4">İkizin Çözüm Akışı</h3>
                <p className="text-sm text-foreground/60 mb-6">Son 24 saat · {activeData?.title || ''}</p>
                <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                  {activeData?.questions ? activeData.questions.map((q, i) => (
                    <div key={i} className={`p-4 border-l-4 border-${q.color || 'brand-yellow'} bg-surface-muted/50 rounded-r-lg`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold text-sm">{q.title}</div>
                        {q.risk && <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${q.risk.includes('Kritik') ? 'bg-red-100 text-red-700' : 'bg-brand-yellow/20 text-brand-yellow-700'}`}>{q.risk}</span>}
                      </div>
                      <p className="text-sm text-foreground/70">{q.desc}</p>
                    </div>
                  )) : (
                    <p className="text-sm text-foreground/50 italic">Soru kaydı bulunamadı.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'createQ':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-3xl font-heading font-semibold mb-2 tracking-tight">Özel Soru & Test Oluştur</h1>
            <p className="text-foreground/60 mb-8 max-w-2xl">Zayıf noktalarına tam odaklanan, havuzdan seçilen ve AI tarafından sentezlenen özel sorular oluştur.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8">
              <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm space-y-6 h-fit">
                <div>
                  <label className="block text-sm font-semibold mb-2">Ders & Konu Seçimi</label>
                  <select className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-green cursor-pointer">
                    <option>YKS Matematik - Limit</option>
                    <option>YKS Matematik - Türev</option>
                    <option>YKS Fizik - Optik</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Soru Sayısı</label>
                  <div className="flex gap-2">
                    {['5', '10', '15', '20'].map((num) => (
                      <button 
                        key={num} 
                        onClick={() => setQCount(num)}
                        className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${qCount === num ? 'border-brand-green bg-brand-green/10 text-brand-green shadow-sm' : 'border-border text-foreground/70 hover:bg-surface-muted'}`}>{num}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Zorluk Seviyesi</label>
                  <div className="flex gap-2">
                    {['Kolay', 'Orta', 'Zor'].map((lvl) => (
                      <button 
                        key={lvl} 
                        onClick={() => setQLevel(lvl)}
                        className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${qLevel === lvl ? 'border-brand-yellow bg-brand-yellow/10 text-brand-yellow-700 shadow-sm' : 'border-border text-foreground/70 hover:bg-surface-muted'}`}>{lvl}</button>
                    ))}
                  </div>
                </div>
                <div className="pt-2">
                  <label 
                    onClick={() => setUseTwinWeight(!useTwinWeight)}
                    className={`flex items-center gap-4 cursor-pointer p-4 rounded-xl border-2 transition-all shadow-sm ${useTwinWeight ? 'border-brand-green bg-brand-green/5 hover:bg-brand-green/10' : 'border-border bg-background hover:bg-surface-muted'}`}>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${useTwinWeight ? 'border-brand-green bg-brand-green text-white' : 'border-border bg-transparent text-transparent'}`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <span className={`text-sm font-bold ${useTwinWeight ? 'text-brand-green' : 'text-foreground/60'}`}>İkizimin hata desenini (nöral ağırlıkları) kullan</span>
                  </label>
                </div>
                <button className="w-full bg-brand-green text-white font-bold py-3 rounded-xl hover:bg-brand-green-600 transition-transform active:scale-95 shadow-sm mt-2">Testi Üret</button>
              </div>

              <div className="bg-surface p-8 rounded-2xl border border-border shadow-sm flex flex-col items-center justify-center min-h-[500px]">
                <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green mb-4">
                  {icons.createQ}
                </div>
                <h3 className="font-heading font-semibold text-lg text-brand-green mb-2">Yapay Zeka Testi Üretiyor...</h3>
                <p className="text-sm text-foreground/50 text-center max-w-md mb-8">
                  {useTwinWeight ? 'İkizinizin nöral ağırlıkları devrede. Limit ve türev odaklı sentezleme yapılıyor.' : 'Havuzdaki sorular standart müfredat ağırlığına göre çekiliyor.'}
                </p>
                <div className="w-full max-w-md h-2 bg-surface-muted rounded-full overflow-hidden">
                  <div className="h-full bg-brand-yellow w-2/3 rounded-full animate-pulse" />
                </div>
                <div className="mt-4 text-xs font-semibold text-foreground/40 uppercase tracking-widest">%66 Tamamlandı</div>
              </div>
            </div>
          </div>
        );

      case 'exam':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-3xl font-heading font-semibold mb-2 tracking-tight">Sınav ve Denemeler</h1>
            <p className="text-foreground/60 mb-8 max-w-2xl">Geçmiş sınavlarınızı görüntüleyin ve Türkiye geneli yapay zeka denemelerine katılın veya öğretmen havuzundan kendi sınavınızı oluşturun.</p>
            
            <div className="bg-surface p-8 rounded-2xl border border-border shadow-sm mb-10 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-yellow/5 rounded-bl-full pointer-events-none" />
              
              <h3 className="font-heading font-semibold text-xl mb-6 relative z-10 text-brand-green">Öğretmen Havuzundan Sınav Hazırla</h3>
              
              <div className="relative z-10">
                {examStep === 1 && (
                  <div className="animate-in fade-in slide-in-from-right-8 space-y-4">
                    <label className="block text-sm font-semibold mb-2">1. Adım: Ders Seçin</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe', 'Tarih', 'Coğrafya', 'Felsefe'].map(sub => (
                        <button 
                          key={sub} 
                          onClick={() => { setExamSubject(sub); setExamStep(2); }} 
                          className="p-4 rounded-xl border border-border bg-background hover:border-brand-green hover:bg-brand-green/5 transition-all hover:scale-[1.02] font-medium text-center shadow-sm">
                          {sub}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {examStep === 2 && (
                  <div className="animate-in fade-in slide-in-from-right-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-semibold">2. Adım: {examSubject} Kazanımlarını Seçin</label>
                      <button onClick={() => setExamStep(1)} className="text-xs text-foreground/50 hover:text-foreground hover:underline font-medium px-2 py-1 rounded bg-surface-muted transition-colors">← Ders Seçimine Dön</button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {['Temel Kavramlar', 'Üslü Sayılar', 'Köklü Sayılar', 'Çarpanlara Ayırma', 'Denklemler', 'Fonksiyonlar', 'Polinomlar', 'Limit'].map(kaz => (
                        <label key={kaz} className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-background hover:bg-surface-muted hover:border-brand-yellow/50 cursor-pointer transition-all">
                          <input type="checkbox" className="w-4 h-4 text-brand-yellow accent-brand-yellow-600 rounded cursor-pointer" />
                          <span className="text-sm font-medium">{kaz}</span>
                        </label>
                      ))}
                    </div>
                    
                    <div className="flex gap-4 pt-4 border-t border-border mt-4">
                      <button onClick={() => setExamStep(3)} className="bg-brand-yellow hover:bg-brand-yellow-600 text-foreground font-bold px-8 py-3 rounded-xl text-sm shadow-sm transition-transform active:scale-95">Havuzdan Sınavı Oluştur</button>
                    </div>
                  </div>
                )}

                {examStep === 3 && (
                  <div className="animate-in zoom-in-95 flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-20 h-20 bg-brand-yellow/20 rounded-full flex items-center justify-center text-brand-yellow-700 mb-5 animate-pulse">
                      {icons.exam}
                    </div>
                    <h4 className="font-bold text-xl text-brand-yellow-700 mb-2">Sınavınız Hazırlanıyor...</h4>
                    <p className="text-sm text-foreground/60 mb-8 max-w-md">Öğretmenlerinizin {examSubject} havuzuna eklediği sorular seçtiğiniz kazanımlara göre çekilip diziliyor.</p>
                    <button onClick={() => setExamStep(1)} className="text-sm font-semibold text-foreground/50 underline hover:text-foreground">İptal veya Yeni Sınav Oluştur</button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gradient-to-br from-brand-green to-brand-green-600 p-8 rounded-3xl text-white shadow-lg relative overflow-hidden group hover:shadow-xl transition-shadow cursor-pointer">
                <div className="relative z-10">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-4 inline-block">Aktif</span>
                  <h3 className="text-2xl font-heading font-bold mb-2">İkizinle Denemede Yarış</h3>
                  <p className="text-white/80 text-sm mb-6 max-w-xs">İkizinizle aynı anda aynı denemeye girin ve onun nöral modelini yenip yenemeyeceğinizi görün.</p>
                  <button className="bg-white text-brand-green font-bold px-6 py-2.5 rounded-full text-sm hover:scale-105 transition-transform shadow-md">Hemen Katıl</button>
                </div>
                <div className="absolute -bottom-10 -right-10 opacity-20 transform scale-150 group-hover:scale-[1.6] transition-transform duration-500">
                  <TwinMark size={160} />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-brand-yellow to-brand-yellow-600 p-8 rounded-3xl text-foreground shadow-lg relative overflow-hidden group hover:shadow-xl transition-shadow cursor-pointer">
                <div className="relative z-10">
                  <span className="bg-foreground/10 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-4 inline-block">Bugün</span>
                  <h3 className="text-2xl font-heading font-bold mb-2">Deneme Çöz</h3>
                  <p className="text-foreground/80 text-sm mb-6 max-w-xs">Türkiye geneli YKS #4 denemesi hazır. Gerçek sıralamanızı görün ve eksiklerinizi güncelleyin.</p>
                  <button className="bg-foreground text-background font-bold px-6 py-2.5 rounded-full text-sm hover:scale-105 transition-transform shadow-md">Denemeye Başla</button>
                </div>
                <div className="absolute -bottom-10 -right-10 opacity-10 transform scale-150 group-hover:scale-[1.6] transition-transform duration-500">
                  <svg width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </div>
              </div>
            </div>

            <div className="bg-surface-muted border border-border rounded-xl p-4 mb-10 flex items-start gap-4">
              <div className="bg-brand-green/10 text-brand-green p-2 rounded-lg shrink-0 mt-0.5">
                <TwinMark size={24} />
              </div>
              <div>
                <h4 className="font-semibold text-sm">İkizin Ağırlık Güncellemesi</h4>
                <p className="text-sm text-foreground/70 mt-1">Çözeceğiniz her deneme ve test, arka planda dijital ikizinizin nöral bağlantılarını (risk ağırlıklarını) canlı olarak günceller. Performansınız haritadaki risk düğümlerine doğrudan yansır.</p>
              </div>
            </div>
            
            <h3 className="font-heading font-semibold text-xl mb-4 mt-10">Son Sınav Sonuçları</h3>
            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-foreground/70">Deneme Adı</th>
                    <th className="px-6 py-4 font-semibold text-foreground/70">Tarih</th>
                    <th className="px-6 py-4 font-semibold text-foreground/70">Net</th>
                    <th className="px-6 py-4 font-semibold text-foreground/70">İkizle Benzerlik</th>
                    <th className="px-6 py-4 font-semibold text-foreground/70">Sıralama</th>
                    <th className="px-6 py-4 font-semibold text-foreground/70 text-right">Detay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { name: 'Karekök Deneme 12', date: '5 Eyl 2026', net: '88.25', sim: '%88', rank: '%3' },
                    { name: 'Bilfen TYT 7', date: '28 Ağu 2026', net: '84.50', sim: '%92', rank: '%5' },
                    { name: 'Okul Denemesi 4', date: '20 Ağu 2026', net: '86.75', sim: '%85', rank: '%4' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-surface-muted/30 transition-colors cursor-pointer">
                      <td className="px-6 py-4 font-medium">{row.name}</td>
                      <td className="px-6 py-4 text-foreground/60">{row.date}</td>
                      <td className="px-6 py-4 font-bold text-brand-green">{row.net}</td>
                      <td className="px-6 py-4"><span className="font-bold text-foreground/70">{row.sim}</span></td>
                      <td className="px-6 py-4"><span className="bg-brand-yellow/20 text-brand-yellow-700 px-2.5 py-1 rounded-md font-semibold text-xs">{row.rank}</span></td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-brand-green hover:underline font-medium text-sm">Analizi Gör</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'chat':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 h-full flex flex-col -mx-4 -mb-4 lg:-mx-12 lg:-mb-12">
            
            <div className="flex h-[calc(100vh-theme(spacing.24))] border-t border-border mt-4">
              
              <div className="w-64 border-r border-border bg-surface flex flex-col shrink-0">
                <div className="p-4 border-b border-border bg-background/50">
                  <button className="w-full flex items-center justify-center gap-2 bg-brand-green text-white font-semibold py-3 rounded-xl text-sm hover:bg-brand-green-600 transition-transform active:scale-95 shadow-sm">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Yeni Soru Sor
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar bg-surface">
                  <div className="text-xs font-bold text-foreground/40 uppercase tracking-widest pl-3 pt-3 mb-2">Bugün</div>
                  <button className="w-full text-left p-3 rounded-xl bg-surface-muted border border-border text-sm font-semibold truncate text-brand-green shadow-sm">
                    Türev - Eğim ve İşaret
                  </button>
                  <button className="w-full text-left p-3 rounded-xl hover:bg-surface-muted border border-transparent text-sm font-medium text-foreground/70 truncate transition-colors">
                    Optik - Mercekler
                  </button>
                  <div className="text-xs font-bold text-foreground/40 uppercase tracking-widest pl-3 pt-5 mb-2">Dün</div>
                  <button className="w-full text-left p-3 rounded-xl hover:bg-surface-muted border border-transparent text-sm font-medium text-foreground/70 truncate transition-colors">
                    Momentum Korunumu
                  </button>
                  <button className="w-full text-left p-3 rounded-xl hover:bg-surface-muted border border-transparent text-sm font-medium text-foreground/70 truncate transition-colors">
                    Kimyasal Denge Soru #12
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-background flex flex-col relative overflow-hidden">
                <div className="absolute top-0 w-full p-4 flex items-center justify-between bg-background/80 backdrop-blur-md border-b border-border z-10">
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading font-semibold text-lg text-foreground">İkiz Asistan</h2>
                  </div>
                </div>

                <div className="flex-1 p-8 pt-20 overflow-y-auto space-y-6 custom-scrollbar">
                  <div className="flex justify-end">
                    <div className="bg-surface p-5 rounded-2xl rounded-tr-sm max-w-lg shadow-sm border border-border">
                      <p className="text-sm font-medium">Hocam, bu türev sorusunda eğimi bulurken işareti yanlış mı alıyorum?</p>
                      <div className="mt-4 w-56 h-36 bg-surface-muted border border-border rounded-xl flex flex-col items-center justify-center text-xs text-foreground/50">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        [Ekran_Goruntusu.jpg]
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-surface-muted/50 p-6 rounded-2xl rounded-tl-sm max-w-2xl shadow-sm border border-brand-green/20">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-brand-green/10 p-1.5 rounded-full">
                          <TwinMark size={18} />
                        </div>
                        <span className="text-xs font-bold text-brand-green uppercase tracking-wider">İkiz Asistan</span>
                      </div>
                      <div className="text-sm text-foreground/80 leading-relaxed space-y-3">
                        <p>Merhaba Ayşe! Evet, haklısın. İkizin de aynı soruda aynı hatayı yapmıştı. Fonksiyon azalan olduğu için türevin negatif çıkması gerekiyor. Mutlak değerden çıkarırken başına (-) almayı unutmuşsun.</p>
                        <p>Gel, adımları birlikte yazalım:</p>
                        <div className="bg-background px-4 py-3 rounded-xl text-sm border border-border font-mono text-brand-green shadow-inner">
                          f&apos;(x) = - (2x - 4) <br/>
                          f&apos;(x) = -2x + 4
                        </div>
                        <p>Burada eksi işaretini dağıtmayı unutmamak çok önemli. Anlaşılmayan bir yer var mı?</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-background">
                  <div className="max-w-4xl mx-auto flex gap-3 relative bg-surface border border-border rounded-2xl p-2 shadow-sm focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                    <button className="p-3 bg-surface-muted rounded-xl hover:bg-surface border border-transparent hover:border-border transition-colors text-foreground/60 active:scale-95">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                    </button>
                    <input type="text" placeholder="İkiz Asistan'a soru sor..." className="flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-foreground/40 font-medium" />
                    <button className="px-5 bg-brand-green text-white font-bold rounded-xl hover:bg-brand-green-600 transition-all shadow-sm active:scale-95">
                      Gönder
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        );

      // homework, video, and analysis cases omitted for brevity - wait, I need to include them so I don't break the file!
      case 'homework':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-3xl font-heading font-semibold mb-2 tracking-tight">Ödevlerin</h1>
            <p className="text-foreground/60 mb-8 max-w-2xl">Öğretmeninin ve yapay zekanın senin için oluşturduğu ödev haritası.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-brand-green p-6 rounded-2xl text-white shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <span className="text-sm font-semibold uppercase tracking-wider opacity-80">Tamamlanan</span>
                <div className="text-5xl font-bold mt-4">12</div>
                <span className="text-sm opacity-80 mt-2">Bu ay</span>
              </div>
              <div className="bg-brand-yellow p-6 rounded-2xl text-foreground shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <span className="text-sm font-semibold uppercase tracking-wider opacity-80">Bekleyen</span>
                <div className="text-5xl font-bold mt-4">4</div>
                <span className="text-sm opacity-80 mt-2">Aktif ödevin var</span>
              </div>
              <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <span className="text-sm font-semibold text-foreground/50 uppercase tracking-wider">İsabet Oranı</span>
                <div className="text-5xl font-bold mt-4 text-brand-green">%92</div>
                <span className="text-sm text-foreground/60 mt-2">Ödevlerdeki başarı oranın</span>
              </div>
            </div>

            <h3 className="font-heading font-semibold text-xl mb-4">Aktif Ödevler</h3>
            <div className="space-y-4 mb-10">
              {[
                { title: 'Türev Karma Testler', source: 'Orijinal AYT Matematik Soru Bankası', progress: 60, due: 'Yarın' },
                { title: 'Momentum Föyleri', source: 'VIP Fizik Fasikülleri', progress: 20, due: '2 Gün Kaldı' },
                { title: 'Paragraf Denemesi', source: 'Hız Renk Paragraf', progress: 0, due: '3 Gün Kaldı' }
              ].map((hw, i) => (
                <div key={i} className="bg-surface p-6 rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-brand-yellow transition-all cursor-pointer flex items-center justify-between group">
                  <div className="flex-1">
                    <h4 className="font-bold text-lg mb-1 group-hover:text-brand-green transition-colors">{hw.title}</h4>
                    <p className="text-sm text-foreground/60 mb-4">{hw.source}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2.5 bg-surface-muted rounded-full overflow-hidden max-w-sm">
                        <div className="h-full bg-brand-green rounded-full transition-all duration-1000 ease-out" style={{ width: `${hw.progress}%` }} />
                      </div>
                      <span className="text-xs font-bold text-brand-green">%{hw.progress}</span>
                    </div>
                  </div>
                  <div className="ml-6 flex flex-col items-end">
                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold mb-3 shadow-sm">{hw.due}</span>
                    <button className="bg-brand-green/10 text-brand-green hover:bg-brand-green hover:text-white transition-colors px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm active:scale-95">
                      Devam Et
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-3xl font-heading font-semibold mb-2 tracking-tight">Önerilen Videolar</h1>
            <p className="text-foreground/60 mb-8 max-w-2xl">İkizinin zayıf olduğu konulara ve çözemediğin soru tiplerine göre sana özel derlenmiş anlatımlar.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Limit Belirsizlikleri Pratik Çözüm', chan: 'Rehber Matematik', time: '14:20', tag: 'Zayıf Konu', vid: 'xxZ0FslZrqU' },
                { title: 'Eşdeğer Direnç Bulma Taktikleri', chan: 'VIP Fizik', time: '08:45', tag: 'Dünkü Hata', vid: '82tHvlbU3Yo' },
                { title: 'Organik Kimya Adlandırma', chan: 'Kimya Adası', time: '22:10', tag: 'Kritik Eksik', vid: 'ox-9Uks6qdI' },
                { title: 'Türev Geometrik Yorum', chan: 'Mert Hoca', time: '45:00', tag: 'Önerilen', vid: 'z8k4Vy3Ct-g' },
                { title: 'Paragraf Taktikleri 2026', chan: 'Rüştü Hoca', time: '18:30', tag: 'Genel Tekrar', vid: 'vOiuQm0DSwo' },
                { title: 'Optik Kırılma Yasaları', chan: 'Ertan Sinan Şahin', time: '32:15', tag: 'Riskli', vid: 'WSMcs1GCqT4' },
              ].map((vid, i) => (
                <div key={i} className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden group cursor-pointer hover:border-brand-yellow hover:shadow-md transition-all">
                  <div className="aspect-video bg-surface-muted relative flex items-center justify-center overflow-hidden">
                    <img src={`https://img.youtube.com/vi/${vid.vid}/hqdefault.jpg`} alt={vid.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1" className="absolute z-10 opacity-70 group-hover:scale-110 group-hover:opacity-100 transition-all duration-300 drop-shadow-lg"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                    <span className="absolute bottom-3 right-3 z-10 bg-black/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-md">{vid.time}</span>
                  </div>
                  <div className="p-6">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded mb-3 inline-block shadow-sm ${vid.tag === 'Kritik Eksik' || vid.tag === 'Dünkü Hata' ? 'bg-red-100 text-red-700' : 'bg-brand-yellow/20 text-brand-yellow-700'}`}>{vid.tag}</span>
                    <h4 className="font-bold text-lg leading-tight mb-2 group-hover:text-brand-green transition-colors">{vid.title}</h4>
                    <p className="text-xs text-foreground/50 font-semibold">{vid.chan}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'analysis':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-3xl font-heading font-semibold mb-2 tracking-tight">Detaylı Analiz</h1>
            <p className="text-foreground/60 mb-8 max-w-2xl">YKS net gelişimin ve ders bazında güçlü/zayıf taraflarının kapsamlı görünümü.</p>
            
            <div className="bg-surface p-8 sm:p-10 rounded-3xl border border-border shadow-sm mb-10 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/5 rounded-bl-full pointer-events-none" />
              <h3 className="font-heading font-semibold text-xl mb-8 relative z-10 text-brand-green">Ay Ay Net Ortalaması (TYT)</h3>
              
              <div className="h-[280px] w-full relative border-l-2 border-b-2 border-border/80 pl-2 pb-2">
                
                <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-brand-green)" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="var(--color-brand-green)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  {[20, 40, 60, 80].map(line => (
                    <line key={line} x1="0" y1={line} x2="100" y2={line} stroke="var(--color-border)" strokeDasharray="1 3" strokeWidth="0.5" />
                  ))}

                  <path d="M0,70 L12.5,60 L25,65 L37.5,47.5 L50,40 L62.5,45 L75,27.5 L87.5,20 L100,10 L100,100 L0,100 Z" fill="url(#areaGrad)" />
                  <polyline points="0,70 12.5,60 25,65 37.5,47.5 50,40 62.5,45 75,27.5 87.5,20 100,10" fill="none" stroke="var(--color-brand-green)" strokeWidth="2.5" strokeLinejoin="round" />
                </svg>

                {[
                  { month: 'Ekim', val: 62, x: 0, y: 70 },
                  { month: 'Kasım', val: 66, x: 12.5, y: 60 },
                  { month: 'Aralık', val: 64, x: 25, y: 65 },
                  { month: 'Ocak', val: 71, x: 37.5, y: 47.5 },
                  { month: 'Şubat', val: 74, x: 50, y: 40 },
                  { month: 'Mart', val: 72, x: 62.5, y: 45 },
                  { month: 'Nisan', val: 79, x: 75, y: 27.5 },
                  { month: 'Mayıs', val: 82, x: 87.5, y: 20 },
                  { month: 'Haziran', val: 86, x: 100, y: 10 },
                ].map((pt, i) => (
                  <div key={i} className="absolute group" style={{ left: `${pt.x}%`, top: `${pt.y}%` }}>
                    <div className="w-4 h-4 -translate-x-1/2 -translate-y-1/2 bg-surface border-[3px] border-brand-green rounded-full shadow-md group-hover:scale-[1.6] group-hover:border-brand-yellow transition-all duration-300 cursor-pointer relative z-10" />
                    
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-lg">
                      <span className="text-brand-yellow mr-1">{pt.month}:</span> {pt.val} Net
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45" />
                    </div>
                    
                    <span className="absolute top-8 left-1/2 -translate-x-1/2 text-xs font-semibold text-foreground/50">{pt.month.slice(0,3)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-surface p-8 rounded-3xl border border-border shadow-sm">
                <h3 className="font-heading font-semibold text-lg mb-6">Ders Bazında Karşılaştırma (AYT)</h3>
                <div className="space-y-7">
                  {[
                    { name: 'Matematik', val: 28.5, max: 40, col: 'bg-brand-green' },
                    { name: 'Geometri', val: 6.4, max: 10, col: 'bg-brand-green' },
                    { name: 'Fizik', val: 9.2, max: 14, col: 'bg-brand-yellow' },
                    { name: 'Kimya', val: 11.5, max: 13, col: 'bg-brand-green' },
                    { name: 'Biyoloji', val: 8.0, max: 13, col: 'bg-red-400' },
                  ].map((sub, i) => (
                    <div key={i} className="flex items-center gap-5 group">
                      <div className="w-24 text-sm font-bold text-foreground/70 group-hover:text-foreground transition-colors">{sub.name}</div>
                      <div className="flex-1 h-4 bg-surface-muted rounded-full overflow-hidden shadow-inner">
                        <div className={`h-full ${sub.col} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${(sub.val / sub.max) * 100}%` }} />
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
                <h3 className="font-heading font-semibold text-lg mb-2">Genel Sıralama Özeti</h3>
                <p className="text-sm text-foreground/50 mb-8">İl, İlçe ve Sınıf bazında tahmini sıralaman</p>
                <div className="space-y-5">
                  <div className="flex justify-between items-center p-5 bg-background border border-border rounded-2xl shadow-sm hover:border-brand-green transition-colors">
                    <span className="font-semibold text-foreground/80">Sınıf Sıralaması</span>
                    <span className="text-3xl font-heading font-bold text-brand-green">2<span className="text-sm text-foreground/40 font-sans ml-1">/34</span></span>
                  </div>
                  <div className="flex justify-between items-center p-5 bg-background border border-border rounded-2xl shadow-sm hover:border-brand-yellow transition-colors">
                    <span className="font-semibold text-foreground/80">Okul Sıralaması</span>
                    <span className="text-3xl font-heading font-bold text-brand-yellow-600">14<span className="text-sm text-foreground/40 font-sans ml-1">/256</span></span>
                  </div>
                  <div className="flex justify-between items-center p-5 bg-background border border-border rounded-2xl shadow-sm hover:border-foreground/30 transition-colors">
                    <span className="font-semibold text-foreground/80">İl Geneli (Tahmini)</span>
                    <span className="text-3xl font-heading font-bold text-foreground">540<span className="text-sm text-foreground/40 font-sans ml-1">/18K</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[280px] flex-none flex flex-col bg-surface border-r border-border shadow-sm relative z-20">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2.5 mb-2 hover:opacity-80 transition-opacity">
            <TwinMark />
            <div>
              <div className="font-heading text-2xl font-bold tracking-tight text-brand-green leading-none">İkiz</div>
            </div>
          </Link>
          <div className="text-[10px] tracking-widest uppercase text-brand-yellow-600 font-bold ml-9">Öğrenci Paneli</div>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1 px-4 overflow-y-auto pb-4 custom-scrollbar">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all font-medium text-sm border outline-none focus-visible:ring-2 focus-visible:ring-brand-green ${
                  isActive 
                    ? 'bg-brand-yellow/10 text-brand-yellow-700 border-brand-yellow/20 shadow-sm' 
                    : 'text-foreground/70 hover:bg-surface-muted border-transparent hover:text-foreground'
                }`}
              >
                <span className={`${isActive ? 'text-brand-yellow-600' : 'text-foreground/40'} transition-colors`}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border bg-surface-muted/30">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-muted cursor-pointer transition-colors">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-green to-brand-green-600 text-white flex items-center justify-center font-bold shadow-sm">
              AY
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate text-foreground">Ayşe Yılmaz</div>
              <div className="text-xs text-foreground/50 truncate font-medium">YKS - Sayısal (12. Sınıf)</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto relative bg-background custom-scrollbar">
        <div className="max-w-6xl mx-auto p-8 lg:p-12 pb-24">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
