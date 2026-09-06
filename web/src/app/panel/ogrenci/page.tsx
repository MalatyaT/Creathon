"use client";

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { TwinMark } from "@/components/brand/twin-mark";
import { Markdown } from "@/components/ui/markdown";
import {
  createChatSession,
  generateSingleQuestionAction,
  getChatMessages,
  listChatSessions,
  listKazanimOptions,
  listSubjectOptions,
  sendChatMessage,
  type ChatMessageRecord,
  type ChatSessionSummary,
  type KazanimOption,
  type ReferenceQuestion,
  type SubjectOption,
} from "@/app/panel/ogrenci/actions";
import type { GeneratedQuestion } from "@/lib/schemas/generation";

type ChatUIMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  imagePreview?: string;
  topicLabel?: string | null;
  sourceReference?: string | null;
};

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const result = String(reader.result);
      const base64 = result.slice(result.indexOf(",") + 1);
      resolve({ base64, mimeType: file.type || "image/png" });
    };
    reader.readAsDataURL(file);
  });
}

function sessionDayLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(date, today)) return "Bugün";
  if (sameDay(date, yesterday)) return "Dün";
  return "Daha önce";
}

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
      { id: 1, title: 'Limit ve Süreklilik - Soru 7', desc: 'İkizin eşlenik çarpımında hata yaptı.', risk: 'Kritik' },
      { id: 2, title: 'Limit Belirsizlik - Soru 12', desc: 'İkizin paydayı sıfır yapan değeri sadeleştirmeyi unuttu.', risk: 'Yüksek Risk' },
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
      { id: 1, title: 'İnce Kenarlı Mercek - Soru 1', desc: 'Odak noktasını yanlış hesapladı.', risk: 'Orta Risk' },
      { id: 2, title: 'Kırılma - Soru 5', desc: 'Sınır açısını hesaplamadan tam yansıma yaptı.', risk: 'Kritik' },
      { id: 3, title: 'Aynalar - Soru 8', desc: 'Tümsek aynada görüntüyü gerçek kabul etti.', risk: 'Yüksek Risk' },
    ]
  },
  polinom: {
    title: 'Polinomlar (Matematik)',
    desc: 'Bölme kurallarında işlem hızınız yavaş.',
    stats: [{ label: 'İşlem Hızı', val: '%40' }, { label: 'Dikkat', val: '%10' }],
    questions: [
      { id: 1, title: 'Kalan Bulma - Soru 4', desc: 'Değer verirken işareti yanlış aldı.', risk: 'Orta Risk' }
    ]
  },
  geo: {
    title: 'Geometri (Matematik)',
    desc: 'Üçgenlerde benzerlik kaçırılıyor.',
    stats: [{ label: 'Görme', val: '%70' }, { label: 'Formül', val: '%5' }],
    questions: [
      { id: 1, title: 'Benzerlik - Soru 2', desc: 'Kelebek kuralını göremedi.', risk: 'Yüksek Risk' }
    ]
  },
  dinamik: {
    title: 'Dinamik (Fizik)',
    desc: 'Sürtünme kuvveti yönünü yanlış belirliyor.',
    stats: [{ label: 'Kavram', val: '%40' }, { label: 'İşlem', val: '%20' }],
    questions: [
      { id: 1, title: 'Eğik Düzlem - Soru 3', desc: 'Sürtünmeyi harekete zıt almayı unuttu.', risk: 'Yüksek Risk' }
    ]
  },
  elektrik: {
    title: 'Elektrik (Fizik)',
    desc: 'Eşdeğer direnç sorularında köprüleri kaçırıyor.',
    stats: [{ label: 'Görme', val: '%50' }, { label: 'İşlem', val: '%15' }],
    questions: [
      { id: 1, title: 'Dirençler - Soru 9', desc: 'Kısa devreyi fark etmedi.', risk: 'Orta Risk' }
    ]
  },
  denge: {
    title: 'Denge (Kimya)',
    desc: 'Denge sabitini hesaplarken katsayıları unuttu.',
    stats: [{ label: 'Dikkat', val: '%45' }, { label: 'İşlem', val: '%20' }],
    questions: [
      { id: 1, title: 'Kc Hesaplama - Soru 4', desc: 'Katsayıyı üs olarak yazmadı.', risk: 'Kritik' }
    ]
  },
  organik: {
    title: 'Organik Kimya (Kimya)',
    desc: 'IUPAC adlandırmada numaralandırma hatası.',
    stats: [{ label: 'Kural Hatası', val: '%60' }, { label: 'Dikkat', val: '%10' }],
    questions: [
      { id: 1, title: 'Adlandırma - Soru 2', desc: 'Dallanmaya en küçük sayıyı vermedi.', risk: 'Yüksek Risk' }
    ]
  },
  sinir: {
    title: 'Sinir Sistemi (Biyoloji)',
    desc: 'Polarizasyon evreleri karıştırılıyor.',
    stats: [{ label: 'Bilgi Eksikliği', val: '%40' }, { label: 'Yorum', val: '%10' }],
    questions: [
      { id: 1, title: 'Aksiyon Potansiyeli - Soru 5', desc: 'Sodyum kanallarının durumunu yanlış işaretledi.', risk: 'Orta Risk' }
    ]
  },
  hucre: {
    title: 'Hücre (Biyoloji)',
    desc: 'Organel görevleri genel olarak iyi, zar geçişlerinde ufak sorunlar.',
    stats: [{ label: 'Dikkat', val: '%15' }, { label: 'Bilgi', val: '%5' }],
    questions: [
      { id: 1, title: 'Osmoz - Soru 2', desc: 'Hipertonik ortamda su kaybedeceğini unuttu.', risk: 'Düşük Risk' }
    ]
  }
};

export default function StudentPanel() {
  const [activeTab, setActiveTab] = useState('panel');

  // Twin Graph States: Drill-down history
  // e.g. ['root'] -> ['root', 'mat'] -> ['root', 'mat', 'optik']
  const [twinHistory, setTwinHistory] = useState<string[]>(['root']);
  const currentTwinView = twinHistory[twinHistory.length - 1]; 
  const [selectedTwinNode, setSelectedTwinNode] = useState('mat');
  
  // Soru Oluşturma (createQ) States — pgvector retrieval + Gemini (bkz. lib/gemini-tasks/generate-rag-question.ts)
  const [qSubjects, setQSubjects] = useState<SubjectOption[]>([]);
  const [qSubjectId, setQSubjectId] = useState("");
  const [qKazanimlar, setQKazanimlar] = useState<KazanimOption[]>([]);
  const [qKazanimId, setQKazanimId] = useState("");
  const [qLevel, setQLevel] = useState('Orta');
  const [useTwinWeight, setUseTwinWeight] = useState(true);
  const [qType, setQType] = useState('Çoktan Seçmeli');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [referenceQ, setReferenceQ] = useState<ReferenceQuestion | null>(null);
  const [generatedQ, setGeneratedQ] = useState<GeneratedQuestion | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  useEffect(() => {
    listSubjectOptions().then((list) => {
      setQSubjects(list);
      setQSubjectId(list[0]?.id ?? "");
    });
  }, []);

  useEffect(() => {
    if (!qSubjectId) return;
    listKazanimOptions(qSubjectId).then((list) => {
      setQKazanimlar(list);
      setQKazanimId(list[0]?.id ?? "");
    });
  }, [qSubjectId]);

  const handleGenerate = async () => {
    if (!qSubjectId || !qKazanimId) return;
    setIsGenerating(true);
    setGenerateError(null);
    setGeneratedQ(null);
    setReferenceQ(null);
    setShowAnswer(false);
    setGenerationStep(1);

    const stepTimers = [
      setTimeout(() => setGenerationStep(2), 900),
      setTimeout(() => setGenerationStep(3), 1800),
      setTimeout(() => setGenerationStep(4), 2700),
    ];

    try {
      const subjectName = qSubjects.find(s => s.id === qSubjectId)?.name || "Bilinmeyen Ders";
      const result = await generateSingleQuestionAction({
        subjectId: qSubjectId,
        kazanimId: qKazanimId,
        questionType: qType === 'Çoktan Seçmeli' ? "multiple_choice" : "open_ended",
        difficultyLabel: qLevel,
        weightByRisk: useTwinWeight,
      });
      setReferenceQ(result.reference);
      setGeneratedQ(result.generated);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Soru üretilemedi");
    } finally {
      stepTimers.forEach(clearTimeout);
      setIsGenerating(false);
    }
  };

  // Sınav-Deneme (exam) States — ders/kazanım listesi qSubjects/qKazanimlar'daki aynı
  // "bitmiş" (embedding'i olan) kazanım kaynağından geliyor (bkz. lib/finished-kazanim.ts).
  const [examStep, setExamStep] = useState(1);
  const [examSubjects, setExamSubjects] = useState<SubjectOption[]>([]);
  const [examSubjectId, setExamSubjectId] = useState("");
  const [examSubject, setExamSubject] = useState("");
  const [examKazanimlar, setExamKazanimlar] = useState<KazanimOption[]>([]);

  useEffect(() => {
    listSubjectOptions().then(setExamSubjects);
  }, []);

  useEffect(() => {
    if (!examSubjectId) return;
    listKazanimOptions(examSubjectId).then(setExamKazanimlar);
  }, [examSubjectId]);

  // Soru Sor (chat) States — gerçek Gemini bağlantısı + oturum (session) geçmişi
  const [chatSessions, setChatSessions] = useState<ChatSessionSummary[]>([]);
  const [activeChatSessionId, setActiveChatSessionId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatUIMessage[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [chatImage, setChatImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const [chatPending, setChatPending] = useState(false);
  const [chatSessionsLoading, setChatSessionsLoading] = useState(true);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listChatSessions()
      .then(setChatSessions)
      .finally(() => setChatSessionsLoading(false));
  }, []);

  function recordToUIMessage(m: ChatMessageRecord): ChatUIMessage {
    return {
      id: m.id,
      role: m.role,
      text: m.content,
      topicLabel: m.topicLabel,
      sourceReference: m.sourceReference,
    };
  }

  async function handleSelectChatSession(sessionId: string) {
    setActiveChatSessionId(sessionId);
    setChatError(null);
    const records = await getChatMessages(sessionId);
    setChatMessages(records.map(recordToUIMessage));
  }

  function handleNewChatSession() {
    setActiveChatSessionId(null);
    setChatMessages([]);
    setChatError(null);
    setChatDraft("");
    setChatImage(null);
  }

  function handleChatImagePick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setChatImage({ file, previewUrl: URL.createObjectURL(file) });
  }

  async function handleChatSend() {
    const question = chatDraft.trim();
    if (!question && !chatImage) return;

    setChatError(null);
    const pendingImage = chatImage;
    setChatDraft("");
    setChatImage(null);
    if (chatFileInputRef.current) chatFileInputRef.current.value = "";

    const userMessage: ChatUIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: question || "(görsel)",
      imagePreview: pendingImage?.previewUrl,
    };
    const historyBeforeSend = chatMessages;
    setChatMessages((prev) => [...prev, userMessage]);
    setChatPending(true);

    try {
      let sessionId = activeChatSessionId;
      if (!sessionId) {
        const session = await createChatSession();
        sessionId = session.id;
        setActiveChatSessionId(sessionId);
        setChatSessions((prev) => [
          { id: sessionId!, title: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          ...prev,
        ]);
      }

      let imagePayload: { imageBase64?: string; imageMimeType?: string } = {};
      if (pendingImage) {
        const { base64, mimeType } = await fileToBase64(pendingImage.file);
        imagePayload = { imageBase64: base64, imageMimeType: mimeType };
      }

      const answer = await sendChatMessage({
        sessionId,
        history: historyBeforeSend.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          text: m.text,
        })),
        question: question || "Bu görseldeki soruyu çöz.",
        ...imagePayload,
      });

      setChatMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: answer.answer,
          topicLabel: answer.topic_label,
          sourceReference: answer.source_reference || undefined,
        },
      ]);

      setChatSessions((prev) => {
        const now = new Date().toISOString();
        const existing = prev.find((s) => s.id === sessionId);
        const title = existing?.title || answer.topic_label || question.slice(0, 48) || "Yeni sohbet";
        const updated = { id: sessionId!, title, createdAt: existing?.createdAt ?? now, updatedAt: now };
        return [updated, ...prev.filter((s) => s.id !== sessionId)];
      });
    } catch (err) {
      setChatError(err instanceof Error ? err.message : "Bir şeyler ters gitti");
    } finally {
      setChatPending(false);
    }
  }

  function handleChatKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleChatSend();
    }
  }

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
        const getCenterLabel = (viewId: string) => {
          if (viewId === 'root') return "İKİZİN";
          const rootMatch = rootNodes.find(n => n.id === viewId);
          if (rootMatch) return rootMatch.label;
          
          for (const subj in subjectNodes) {
            const topicMatch = subjectNodes[subj as keyof typeof subjectNodes].find(n => n.id === viewId);
            if (topicMatch) return topicMatch.label;
          }
          return viewId.toUpperCase();
        };

        const getCurrentGraphData = (viewId: string) => {
          if (viewId === 'root') {
            return { nodes: rootNodes, edges: rootEdges };
          }
          
          if (subjectNodes[viewId as keyof typeof subjectNodes]) {
            return { 
              nodes: subjectNodes[viewId as keyof typeof subjectNodes], 
              edges: subjectEdges[viewId as keyof typeof subjectEdges] 
            };
          }
          
          // Drill-down Level 3 (Topic -> Questions)
          const tData = twinData[viewId];
          if (tData && tData.questions) {
            const positions = [
               {x: 25, y: 30}, {x: 75, y: 25}, {x: 50, y: 75}, {x: 20, y: 65}, {x: 80, y: 65}
            ];
            const nodes = tData.questions.map((q, i) => {
              const pos = positions[i % positions.length];
              return {
                 id: `q-${viewId}-${q.id}`,
                 label: `Soru ${q.id}`,
                 x: pos.x,
                 y: pos.y,
                 risk: q.risk === 'Kritik' ? 90 : q.risk === 'Yüksek Risk' ? 70 : 50,
                 isTopic: false,
                 isQuestion: true
              };
            });
            
            const edges = nodes.map(n => ({
              source: n.id,
              target: 'center',
              isRelated: false
            }));
            
            return { nodes, edges };
          }
          
          return { nodes: [], edges: [] };
        };

        const isRoot = currentTwinView === 'root';
        const centerLabel = getCenterLabel(currentTwinView);
        const { nodes: currentNodes, edges: currentEdges } = getCurrentGraphData(currentTwinView);
        
        const isSelectedQuestion = selectedTwinNode.startsWith('q-');
        
        let activeData = twinData[selectedTwinNode];
        // Handle if a question node is selected to generate data panel on the fly
        if (!activeData && selectedTwinNode.startsWith('q-')) {
          const [, topicId, qIdStr] = selectedTwinNode.split('-');
          const qId = parseInt(qIdStr, 10);
          const qData = twinData[topicId]?.questions.find(q => q.id === qId);
          if (qData) {
            activeData = {
              title: qData.title,
              desc: qData.desc,
              stats: [{label: 'Risk Seviyesi', val: qData.risk || 'Orta'}],
              questions: [qData]
            };
          }
        }
        if (!activeData) activeData = twinData['mat']; // default fallback

        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-3xl font-heading font-semibold mb-2 tracking-tight">Dijital İkizin Ağ Haritası</h1>
            <p className="text-foreground/60 mb-8 max-w-2xl">
              Düğümlerin büyüklüğü hata sayısını (risk oranını) belirtir. İlgili dersin veya konunun içerisine girmek (drill-down) için düğüme tıklayın. Soruları yuvarlaklar halinde görmek için konulara tıklayabilirsiniz.
            </p>
            
            <div className="bg-surface p-8 rounded-3xl border border-border shadow-sm mb-8 relative overflow-hidden min-h-[450px] flex items-center justify-center">
              {twinHistory.length > 1 && (
                <button 
                  onClick={() => { 
                    const newHistory = [...twinHistory];
                    newHistory.pop();
                    setTwinHistory(newHistory);
                    setSelectedTwinNode(newHistory[newHistory.length - 1]);
                  }} 
                  className="absolute top-6 left-6 z-20 bg-background hover:bg-surface-muted px-4 py-2 rounded-xl border border-border shadow-sm font-bold text-sm text-brand-green transition-colors active:scale-95 flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                  Geri Dön
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
                        key={`${currentTwinView}-${i}`} 
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
                  // @ts-expect-error - isQuestion is dynamically injected
                  const isQ = node.isQuestion;
                  const sizeClass = node.isTopic 
                    ? (node.risk > 70 ? 'w-24 h-24' : node.risk > 50 ? 'w-20 h-20' : 'w-16 h-16')
                    : isQ 
                      ? (node.risk > 70 ? 'w-20 h-20' : 'w-16 h-16') 
                      : (node.risk > 70 ? 'w-28 h-28' : node.risk > 50 ? 'w-24 h-24' : 'w-20 h-20');
                    
                  return (
                    <div 
                      key={`${currentTwinView}-${node.id}`}
                      onClick={() => {
                        setSelectedTwinNode(node.id);
                        if (!isQ) {
                          // Drill down into subject or topic
                          setTwinHistory(prev => [...prev, node.id]);
                        }
                      }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 ${sizeClass} rounded-full flex flex-col items-center justify-center shadow-lg z-10 transition-all cursor-pointer animate-in zoom-in duration-500 ${
                        isSelected && !isRoot ? 'scale-110 ring-4 ring-brand-yellow ring-offset-4 ring-offset-background' : 'hover:scale-110 hover:ring-2 hover:ring-brand-green/50 hover:ring-offset-2'
                      } ${node.isTopic ? (node.risk > 70 ? 'bg-red-50 border-4 border-brand-yellow' : 'bg-surface border-4 border-brand-yellow') : isQ ? (node.risk > 70 ? 'bg-red-50 border-2 border-red-500' : 'bg-surface border-2 border-brand-yellow') : 'bg-brand-green/5 border-4 border-brand-green'}`}
                      style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    >
                      <span className={`font-bold ${node.isTopic ? 'text-sm text-red-700' : isQ ? 'text-xs text-foreground/80' : 'text-sm text-brand-green'}`}>{node.label}</span>
                      {(node.isTopic || isQ) && <span className={`text-[10px] mt-1 ${isQ ? 'text-foreground/50' : 'text-red-500'}`}>%{node.risk} Risk</span>}
                      {isSelected && !isRoot && <div className="absolute inset-0 bg-brand-yellow/20 rounded-full animate-ping -z-10" />}
                    </div>
                  );
                })}

                {/* Center Node */}
                <div className={`absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full ${isRoot ? 'bg-brand-green text-white' : 'bg-surface border-4 border-brand-green text-brand-green'} flex flex-col items-center justify-center shadow-2xl z-10 font-heading font-bold text-xl border-4 ${isRoot ? 'border-white/20' : ''} animate-in zoom-in duration-300`}>
                  {isRoot && <TwinMark size={24} />}
                  <span className={isRoot ? "mt-2" : "text-center px-2"}>{centerLabel}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-surface p-8 rounded-2xl border border-border shadow-sm">
                {isSelectedQuestion ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                       <h3 className="font-heading font-semibold text-xl text-brand-green">Hatalı Soru İncelemesi</h3>
                       <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold uppercase">{activeData?.stats?.[0]?.val || 'Orta'}</span>
                    </div>
                    <div className="p-5 border border-border rounded-xl bg-background mb-6 shadow-inner relative">
                       <div className="absolute top-2 right-3 text-[10px] font-bold text-foreground/30 uppercase">Soru 14</div>
                       <p className="text-sm font-medium leading-relaxed mt-2 mb-4">
                         {activeData?.title?.includes('Optik') || activeData?.title?.includes('Mercek') || activeData?.title?.includes('Ayna') || activeData?.title?.includes('Kırılma') ? 'Hava ortamından cam ortamına geçen tek renkli I ışınının izlediği yol şekildeki gibidir. Buna göre sınır açısı kaç derecedir?' : 
                          activeData?.title?.includes('Limit') ? 'Gerçel sayılar kümesi üzerinde tanımlı f fonksiyonu için lim (x->2) (x² - 4) / (x - 2) ifadesinin değeri kaçtır?' : 
                          activeData?.title?.includes('Türev') ? 'f(x) = x³ - 3x² + 2 fonksiyonunun azalan olduğu aralığı bulunuz.' :
                          activeData?.title?.includes('Denge') ? 'Sabit hacimli kapalı bir kapta gerçekleşen tepkimenin denge sabiti Kc kaçtır?' :
                          'Yukarıda verilen bilgilere göre, ifadelerinden hangileri kesinlikle doğrudur?'}
                       </p>
                       <div className="space-y-2 text-sm font-medium">
                         <div className="p-2 border border-border rounded flex gap-2"><span className="text-foreground/50">A)</span> 1 ve 2</div>
                         <div className="p-2 border border-brand-green bg-brand-green/10 text-brand-green rounded flex gap-2 font-bold"><span className="text-brand-green/50">B)</span> Doğru Cevap (İkizin Seçmedi)</div>
                         <div className="p-2 border border-red-500 bg-red-50 text-red-700 rounded flex gap-2 font-bold relative"><span className="text-red-700/50">C)</span> İkizinin Yanlış Cevabı <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></div>
                         <div className="p-2 border border-border rounded flex gap-2"><span className="text-foreground/50">D)</span> Yalnız 3</div>
                         <div className="p-2 border border-border rounded flex gap-2"><span className="text-foreground/50">E)</span> Hiçbiri</div>
                       </div>
                    </div>
                    <p className="text-sm text-foreground/70 mb-4 font-semibold text-red-600">İkizinin Hatası: <span className="font-normal text-foreground/70">{activeData?.desc}</span></p>
                    <button onClick={() => setActiveTab('chat')} className="w-full bg-brand-green hover:bg-brand-green-600 text-white font-bold py-3.5 rounded-full transition-colors text-sm shadow-sm active:scale-95">
                      Bu Soruyu Asistana Sor
                    </button>
                  </>
                ) : (
                  <>
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
                            <div className="text-sm font-medium leading-tight text-foreground/70">{stat.label}</div>
                            {i < activeData.stats.length - 1 && <div className="w-[1px] h-12 bg-border mx-1"></div>}
                          </div>
                        ))}
                      </div>
                    )}

                    <button onClick={() => setActiveTab('createQ')} className="w-full bg-brand-green hover:bg-brand-green-600 text-white font-bold py-3.5 rounded-full transition-colors text-sm shadow-sm active:scale-95">
                      Bu Analizden Test Oluştur
                    </button>
                  </>
                )}
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
            <h1 className="text-3xl font-heading font-semibold mb-2 tracking-tight">Özel Soru Oluştur</h1>
            <p className="text-foreground/60 mb-8 max-w-2xl">Seçtiğin kazanıma göre Gemini, havuzdaki en benzer referans sorulara (retrieval) bakarak tamamen yeni, özgün bir soru sentezler — referans ve üretilen soru aşağıda karşılaştırmalı görünür.</p>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8">
              <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm space-y-6 h-fit">
                <div>
                  <label className="block text-sm font-semibold mb-2">Ders</label>
                  <select
                    value={qSubjectId}
                    onChange={(e) => setQSubjectId(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-green cursor-pointer">
                    {qSubjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Kazanım</label>
                  <select
                    value={qKazanimId}
                    onChange={(e) => setQKazanimId(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-green cursor-pointer">
                    {qKazanimlar.map((k) => (
                      <option key={k.id} value={k.id}>{k.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Soru Tipi</label>
                  <div className="flex gap-2">
                    {['Çoktan Seçmeli', 'Açık Uçlu'].map((typ) => (
                      <button
                        key={typ}
                        onClick={() => setQType(typ)}
                        className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${qType === typ ? 'border-brand-green bg-brand-green/10 text-brand-green shadow-sm' : 'border-border text-foreground/70 hover:bg-surface-muted'}`}>{typ}</button>
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
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !qKazanimId}
                  className={`w-full text-white font-bold py-3 rounded-xl transition-all shadow-sm mt-2 ${isGenerating ? 'bg-foreground/20 cursor-not-allowed' : 'bg-brand-green hover:bg-brand-green-600 active:scale-95'}`}>
                  {isGenerating ? 'Sistem Çalışıyor...' : 'Yeni Soru Sentezle'}
                </button>
                {generateError && <p className="text-sm text-red-600">{generateError}</p>}
              </div>

              <div className="bg-surface p-8 rounded-2xl border border-border shadow-sm flex flex-col min-h-[500px]">
                {!isGenerating && !generatedQ && (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green mb-4">
                      {icons.createQ}
                    </div>
                    <h3 className="font-heading font-semibold text-lg text-foreground mb-2">AI Destekli Soru Motoru Bekliyor</h3>
                    <p className="text-sm text-foreground/50 text-center max-w-md">Sol taraftaki ayarları seçip butona bastığınızda yapay zeka seçtiğin kazanıma özgü yeni bir soru üretecektir.</p>
                  </div>
                )}

                {isGenerating && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center max-w-lg mx-auto w-full animate-in fade-in duration-500">
                    <div className="relative w-24 h-24 mb-8">
                       <div className="absolute inset-0 rounded-full border-4 border-surface-muted"></div>
                       <div className="absolute inset-0 rounded-full border-4 border-brand-green border-t-transparent animate-spin"></div>
                       <div className="absolute inset-0 flex items-center justify-center">
                          <span className="font-bold text-lg text-brand-green">{generationStep}/4</span>
                       </div>
                    </div>

                    <h3 className="font-heading font-bold text-xl text-brand-green mb-6">Sistem Çalışıyor...</h3>

                    <div className="w-full text-left bg-background p-5 rounded-xl border border-border shadow-inner font-mono text-xs space-y-3 h-48 overflow-hidden">
                       <div className={`transition-opacity duration-300 ${generationStep >= 1 ? 'opacity-100 text-foreground' : 'opacity-0'}`}>
                         <span className="text-brand-yellow mr-2">[1/4]</span> Havuzdan referans soru aranıyor: <span className="text-brand-green font-bold">{qKazanimlar.find((k) => k.id === qKazanimId)?.name}</span>
                       </div>
                       <div className={`transition-opacity duration-300 ${generationStep >= 2 ? 'opacity-100 text-foreground' : 'opacity-0'}`}>
                         <span className="text-brand-yellow mr-2">[2/4]</span> İkiz Asistan risk profili kontrol ediliyor ({qSubjects.find(s => s.id === qSubjectId)?.name} ağırlığı {useTwinWeight ? 'açık' : 'kapalı'})...
                       </div>
                       <div className={`transition-opacity duration-300 ${generationStep >= 3 ? 'opacity-100 text-foreground' : 'opacity-0'}`}>
                         <span className="text-brand-yellow mr-2">[3/4]</span> Gemini'ye istek gönderiliyor ({qLevel} zorluk, {qType})...
                       </div>
                       <div className={`transition-opacity duration-300 ${generationStep >= 4 ? 'opacity-100 text-brand-green font-bold' : 'opacity-0'}`}>
                         <span className="text-brand-yellow mr-2">[4/4]</span> Yanıt doğrulanıyor... Lütfen bekleyin.
                       </div>
                    </div>
                  </div>
                )}

                {generatedQ && (
                  <div className="animate-in slide-in-from-right-8 duration-500 h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
                    {referenceQ && (
                      <div className="rounded-2xl border border-border bg-background p-5">
                        <h4 className="font-heading font-semibold text-sm text-foreground/70 mb-3 flex items-center gap-2">
                          📖 Referans Soru {referenceQ.sourceLabel ? `— ${referenceQ.sourceLabel}` : "(havuzdan)"}
                        </h4>
                        <p className="text-sm leading-relaxed mb-3 text-foreground/90">{referenceQ.text}</p>
                        {referenceQ.options.length > 0 && (
                          <div className="grid gap-1 text-sm text-foreground/75 sm:grid-cols-2 mb-2">
                            {referenceQ.options.map((opt, i) => (
                              <div key={i}>{String.fromCharCode(65 + i)}) {opt}</div>
                            ))}
                          </div>
                        )}
                        <div className="text-xs text-foreground/50">Doğru cevap: {referenceQ.correctAnswer || "—"}</div>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                         <h3 className="font-heading font-semibold text-xl text-brand-green flex items-center gap-2">
                           <TwinMark size={20} /> AI Tarafından Sentezlendi (Gemini)
                         </h3>
                         <div className="flex gap-2">
                           <span className="bg-brand-green/10 text-brand-green px-2 py-1 rounded text-xs font-bold uppercase">{qLevel}</span>
                           <span className="bg-surface-muted px-2 py-1 rounded text-xs font-bold uppercase text-foreground/70">
                             {generatedQ.question_type === 'open_ended' ? 'Açık Uçlu' : 'Çoktan Seçmeli'}
                           </span>
                         </div>
                      </div>

                      <p className="text-sm font-medium leading-relaxed mb-6 text-foreground/90 text-justify">
                        {generatedQ.question_text}
                      </p>

                      {generatedQ.question_type === 'multiple_choice' ? (
                        <div className="space-y-3 text-sm font-medium">
                          {generatedQ.options.map((opt, i) => {
                            const letter = String.fromCharCode(65 + i);
                            const isCorrect = showAnswer && letter === generatedQ.correct_answer;
                            return (
                              <label
                                key={i}
                                className={`p-3 border rounded-xl flex items-start gap-3 transition-colors ${
                                  isCorrect
                                    ? 'border-brand-green bg-brand-green/10'
                                    : 'border-border hover:border-brand-green/50'
                                }`}>
                                <span className={isCorrect ? 'text-brand-green font-bold' : 'text-foreground/50 font-bold'}>{letter})</span>
                                <span>{opt}</span>
                                {isCorrect && <span className="ml-auto text-xs font-bold text-brand-green">DOĞRU CEVAP</span>}
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="mt-4 space-y-3">
                          <textarea
                            className="w-full h-32 bg-background border border-border rounded-xl p-4 text-sm outline-none focus:border-brand-green resize-none"
                            placeholder="Çözümünü buraya yaz... (bu bir önizleme, kaydedilmez)"
                          />
                          {showAnswer && (
                            <div className="rounded-xl border border-brand-green/30 bg-brand-green/5 p-4 text-sm">
                              <span className="font-bold text-brand-green">Beklenen cevap: </span>
                              {generatedQ.correct_answer}
                            </div>
                          )}
                        </div>
                      )}

                      {showAnswer && generatedQ.explanation && (
                        <div className="mt-4 rounded-xl border border-border bg-surface-muted/50 p-4 text-sm text-foreground/80">
                          <span className="font-bold text-foreground">Çözüm: </span>
                          {generatedQ.explanation}
                        </div>
                      )}

                      <div className="mt-6 pt-6 border-t border-border flex justify-between items-center">
                        <div className="text-xs text-foreground/50 font-medium">✨ Gemini tarafından üretildi — havuzda değil</div>
                        <button
                          onClick={() => setShowAnswer((v) => !v)}
                          className="bg-brand-green hover:bg-brand-green-600 text-white font-bold py-2 px-6 rounded-full transition-colors text-sm shadow-sm active:scale-95">
                          {showAnswer ? 'Cevabı Gizle' : 'Cevabı Kontrol Et'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
                      {examSubjects.length === 0 && (
                        <p className="col-span-full text-sm text-foreground/50">Henüz sınav havuzu hazır olan bir ders yok.</p>
                      )}
                      {examSubjects.map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => { setExamSubjectId(sub.id); setExamSubject(sub.name); setExamStep(2); }}
                          className="p-4 rounded-xl border border-border bg-background hover:border-brand-green hover:bg-brand-green/5 transition-all hover:scale-[1.02] font-medium text-center shadow-sm">
                          {sub.name}
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
                      {examKazanimlar.map(kaz => (
                        <label key={kaz.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-background hover:bg-surface-muted hover:border-brand-yellow/50 cursor-pointer transition-all">
                          <input type="checkbox" className="w-4 h-4 text-brand-yellow accent-brand-yellow-600 rounded cursor-pointer" />
                          <span className="text-sm font-medium">{kaz.name}</span>
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

      case 'chat': {
        const grouped: Record<string, ChatSessionSummary[]> = {};
        for (const s of chatSessions) {
          const label = sessionDayLabel(s.createdAt);
          if (!grouped[label]) {
            grouped[label] = [];
          }
          grouped[label].push(s);
        }
        const dayOrder = ["Bugün", "Dün", "Daha önce"];

        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 h-full flex flex-col -mx-4 -mb-4 lg:-mx-12 lg:-mb-12">

            <div className="flex h-[calc(100vh-theme(spacing.24))] border-t border-border mt-4">

              <div className="w-64 border-r border-border bg-surface flex flex-col shrink-0">
                <div className="p-4 border-b border-border bg-background/50">
                  <button
                    onClick={handleNewChatSession}
                    className="w-full flex items-center justify-center gap-2 bg-brand-green text-white font-semibold py-3 rounded-xl text-sm hover:bg-brand-green-600 transition-transform active:scale-95 shadow-sm">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Yeni Soru Sor
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar bg-surface">
                  {chatSessionsLoading && (
                    <div className="text-xs text-foreground/40 px-3 py-2">Yükleniyor…</div>
                  )}
                  {!chatSessionsLoading && chatSessions.length === 0 && (
                    <div className="text-xs text-foreground/40 px-3 py-2">Henüz sohbet yok — &quot;Yeni Soru Sor&quot; ile başla.</div>
                  )}
                  {dayOrder
                    .filter((label) => grouped[label]?.length)
                    .map((label) => (
                      <div key={label}>
                        <div className="text-xs font-bold text-foreground/40 uppercase tracking-widest pl-3 pt-3 mb-2">{label}</div>
                        {grouped[label].map((s) => (
                          <button
                            key={s.id}
                            onClick={() => handleSelectChatSession(s.id)}
                            className={`w-full text-left p-3 rounded-xl border text-sm truncate transition-colors ${
                              s.id === activeChatSessionId
                                ? "bg-surface-muted border-border font-semibold text-brand-green shadow-sm"
                                : "hover:bg-surface-muted border-transparent font-medium text-foreground/70"
                            }`}>
                            {s.title || "Yeni sohbet"}
                          </button>
                        ))}
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex-1 bg-background flex flex-col relative overflow-hidden">
                <div className="absolute top-0 w-full p-4 flex items-center justify-between bg-background/80 backdrop-blur-md border-b border-border z-10">
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading font-semibold text-lg text-foreground">İkiz Asistan</h2>
                  </div>
                </div>

                <div className="flex-1 p-8 pt-20 overflow-y-auto space-y-6 custom-scrollbar">
                  {chatMessages.length === 0 && (
                    <p className="text-sm text-foreground/50">
                      Bir soru yaz ya da fotoğrafını yükle — okulda gördüğün yöntemle, adım adım anlatılır.
                    </p>
                  )}

                  {chatMessages.map((m) => (
                    <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      {m.role === "user" ? (
                        <div className="bg-surface p-5 rounded-2xl rounded-tr-sm max-w-lg shadow-sm border border-border">
                          <p className="text-sm font-medium whitespace-pre-wrap">{m.text}</p>
                          {m.imagePreview && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.imagePreview} alt="Gönderilen soru görseli" className="mt-4 max-h-40 rounded-xl border border-border object-contain" />
                          )}
                        </div>
                      ) : (
                        <div className="bg-surface-muted/50 p-6 rounded-2xl rounded-tl-sm max-w-2xl shadow-sm border border-brand-green/20">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="bg-brand-green/10 p-1.5 rounded-full">
                              <TwinMark size={18} />
                            </div>
                            <span className="text-xs font-bold text-brand-green uppercase tracking-wider">İkiz Asistan</span>
                          </div>
                          <div className="text-sm text-foreground/80 leading-relaxed space-y-3">
                            <Markdown>{m.text}</Markdown>
                          </div>
                          {(m.topicLabel || m.sourceReference) && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {m.topicLabel && (
                                <span className="rounded-full bg-background px-2.5 py-1 text-xs font-medium text-brand-coffee-600 border border-border">
                                  {m.topicLabel}
                                </span>
                              )}
                              {m.sourceReference && (
                                <span className="rounded-full bg-background px-2.5 py-1 text-xs font-medium text-brand-green border border-border">
                                  📖 {m.sourceReference}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {chatPending && <div className="text-xs text-brand-green">yazıyor…</div>}
                  {chatError && <p className="text-sm text-red-600">{chatError}</p>}
                </div>

                <div className="p-6 bg-background">
                  {chatImage && (
                    <div className="max-w-4xl mx-auto mb-3 flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={chatImage.previewUrl} alt="Eklenecek soru görseli" className="h-14 w-14 rounded-lg border border-border object-cover" />
                      <button onClick={() => setChatImage(null)} className="text-xs text-foreground/50 hover:text-red-600">
                        görseli kaldır
                      </button>
                    </div>
                  )}
                  <div className="max-w-4xl mx-auto flex gap-3 relative bg-surface border border-border rounded-2xl p-2 shadow-sm focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                    <input
                      ref={chatFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleChatImagePick}
                      className="hidden"
                      id="ogrenci-chat-image-input"
                    />
                    <label
                      htmlFor="ogrenci-chat-image-input"
                      className="p-3 bg-surface-muted rounded-xl hover:bg-surface border border-transparent hover:border-border transition-colors text-foreground/60 active:scale-95 cursor-pointer flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                    </label>
                    <input
                      type="text"
                      value={chatDraft}
                      onChange={(e) => setChatDraft(e.target.value)}
                      onKeyDown={handleChatKeyDown}
                      placeholder="İkiz Asistan'a soru sor..."
                      className="flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-foreground/40 font-medium"
                    />
                    <button
                      onClick={handleChatSend}
                      disabled={chatPending || (!chatDraft.trim() && !chatImage)}
                      className="px-5 bg-brand-green text-white font-bold rounded-xl hover:bg-brand-green-600 transition-all shadow-sm active:scale-95 disabled:opacity-60">
                      Gönder
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        );
      }

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
          <Link href="/" className="flex items-center gap-2.5 mb-2 hover:opacity-80 transition-opacity h-12">
            <TwinMark className="h-full" />
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
