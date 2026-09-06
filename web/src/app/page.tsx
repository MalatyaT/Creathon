"use client";

import { useState } from "react";
import Link from "next/link";
import { TwinMark } from "@/components/brand/twin-mark";
import { GraduationCap, User, FileEdit, Settings, Users, Image as ImageIcon, Send, Heart, MessageCircle } from "lucide-react";

type Post = {
  id: number;
  author: string;
  avatar: string;
  role: string;
  title: string;
  content: string;
  image?: string;
  likes: number;
};

const initialPosts: Post[] = [
  {
    id: 1,
    author: "Ayşe Öğretmen",
    avatar: "👩‍🏫",
    role: "Öğretmen",
    title: "Bugün Doğayı Keşfettik! 🍃",
    content: "Çocuklarımızla bahçede yaprak topladık ve renklerini inceledik. İnce motor becerilerini geliştirirken doğayı tanımak çok keyifliydi.",
    image: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    likes: 12
  },
  {
    id: 2,
    author: "Mehmet'in Annesi",
    avatar: "👩‍👦",
    role: "Veli",
    title: "Evde Sayı Sayma Oyunu 🎲",
    content: "Öğretmenimizin tavsiyesi üzerine evdeki oyuncak bloklarla toplama oyunu oynadık. Mehmet çok eğlendi!",
    likes: 8
  }
];

export default function LandingPage() {
  const [selectedTier, setSelectedTier] = useState<"anaokulu" | "lgs" | "yks">("lgs");
  const [activePortal, setActivePortal] = useState<string | null>(null);

  // Social Feed State
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImage, setNewPostImage] = useState("");

  const isAnaokulu = selectedTier === "anaokulu";

  const allPortals = [
    { slug: "ogretmen", label: "Öğretmen", desc: isAnaokulu ? "Sınıfınızın etkinliklerini paylaşın, öğrencilerin gelişimini velilerle birlikte takip edin." : "Öğrencilerin gelişimini ve ödevlerini yapay zeka ile takip et.", icon: GraduationCap },
    { slug: "ogrenci", label: "Öğrenci", desc: "Dijital ikizinle zayıf noktalarını keşfet ve netlerini artır.", icon: User },
    { slug: "kaynak-uretici", label: "İçerik Üreticisi", desc: "Akıllı soru havuzuna sorularını ekle ve analiz et.", icon: FileEdit },
    { slug: "yonetici", label: "Yönetici", desc: "Öğretmen atamalarını, sınıfları ve müfredatı okul genelinde yönet.", icon: Settings },
    { slug: "veli", label: "Veli", desc: isAnaokulu ? "Çocuğunuzun eğlenceli ve öğretici etkinliklerle olan gelişimini yakından takip edin ve birlikte öğrenin." : "Çocuğunuzun gelişim raporlarını ve analizlerini takip edin.", icon: Users }
  ];

  const portals = isAnaokulu 
    ? allPortals.filter(p => p.slug === "ogretmen" || p.slug === "veli")
    : allPortals.filter(p => p.slug !== "veli");

  const getPortalLink = (slug: string) => {
    if (isAnaokulu && slug === "veli") return "/panel/veli-cocuk";
    if (isAnaokulu && slug === "ogretmen") return "/panel/ogretmen-cocuk";
    if (slug === "ogrenci") return "/panel/ogrenci";
    return `/panel/${slug}`;
  };

  const handleAddPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle || !newPostContent) return;
    
    const post: Post = {
      id: Date.now(),
      author: "Ziyaretçi Veli",
      avatar: "👤",
      role: "Veli",
      title: newPostTitle,
      content: newPostContent,
      image: newPostImage || undefined,
      likes: 0
    };
    
    setPosts([post, ...posts]);
    setNewPostTitle("");
    setNewPostContent("");
    setNewPostImage("");
  };

  const toggleLike = (id: number) => {
    setPosts(posts.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
  };

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

      <main className="flex-1 flex flex-col items-center p-6 sm:p-10 relative overflow-hidden transition-all duration-700">
        {/* Background decorative elements */}
        <div className={`absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full blur-3xl pointer-events-none transition-all duration-1000 fixed ${isAnaokulu ? 'bg-purple-500/30 scale-150' : 'bg-brand-yellow/20'}`} />
        <div className={`absolute bottom-[20%] right-[-5%] w-[40%] h-[40%] rounded-full blur-3xl pointer-events-none transition-all duration-1000 fixed ${isAnaokulu ? 'bg-blue-500/30 scale-150' : 'bg-brand-green/10'}`} />
        <div className={`absolute top-[40%] right-[20%] w-[20%] h-[20%] rounded-full blur-3xl pointer-events-none transition-all duration-1000 fixed ${isAnaokulu ? 'bg-pink-400/20 scale-125' : 'opacity-0'}`} />

        <div className="max-w-4xl w-full text-center mb-12 relative z-10 mt-6 pt-10">
          <h1 className="font-heading text-4xl sm:text-6xl font-semibold tracking-tight text-foreground mb-6 leading-tight transition-all">
            Her öğrencinin, hatasını unutmayan bir <span className={`transition-colors duration-500 ${isAnaokulu ? 'text-purple-600' : 'text-brand-yellow-600'}`}>ikizi</span> var.
          </h1>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            {isAnaokulu 
              ? "Anaokulu ve İlkokul döneminde çocuğunuzun eğlenceli etkinliklerle öğrenmesine eşlik edin. Öğretmenler ve veliler olarak bu keyifli yolculukta bir aradayız." 
              : <><span className="uppercase font-semibold">{selectedTier}</span> maratonunda çözdüğün sorularla eğitilen ikizin sayesinde, tam zayıf olduğun noktalara özel testler ve ödevlerle başarıya ulaş.</>}
          </p>
        </div>

        <div className={`w-full max-w-6xl bg-surface/80 backdrop-blur-xl p-8 sm:p-12 rounded-3xl border border-border shadow-xl relative z-10 border-t-4 transition-colors duration-500 ${isAnaokulu ? 'border-t-purple-500' : 'border-t-brand-yellow'}`}>
          <h2 className="text-2xl font-heading font-semibold text-center mb-10 transition-colors">
            <span className={`uppercase font-bold ${isAnaokulu ? 'text-purple-600' : 'text-brand-green'}`}>{isAnaokulu ? "İkiz Çocuk" : selectedTier}</span> Platformuna Giriş Yap
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
                      href={getPortalLink(portal.slug)}
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

        {/* İkiz Çocuk - Topluluk Akışı (Sadece Anaokulu modunda) */}
        {isAnaokulu && (
          <div className="w-full max-w-4xl mt-20 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center mb-10">
              <h2 className="font-heading text-3xl font-bold text-foreground mb-3 flex items-center justify-center gap-3">
                <span className="text-purple-600">İkiz Çocuk</span> Topluluğu 🌟
              </h2>
              <p className="text-foreground/70 text-lg">Öğretmenlerimizin ve velilerimizin harika etkinlik paylaşımları!</p>
            </div>

            {/* Yeni Gönderi Ekleme */}
            <form onSubmit={handleAddPost} className="bg-surface/90 backdrop-blur-md border border-purple-200/50 rounded-3xl p-6 mb-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-2xl shrink-0">
                  👤
                </div>
                <div className="flex-1 flex flex-col gap-3">
                  <input 
                    type="text" 
                    placeholder="Etkinlik Başlığı..." 
                    className="w-full px-4 py-3 bg-background/50 border border-border rounded-xl outline-none focus:border-purple-400 focus:bg-background font-semibold transition-colors"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                  />
                  <textarea 
                    placeholder="Bugün çocuğunuzla ne yaptınız? Deneyiminizi paylaşın..." 
                    className="w-full px-4 py-3 bg-background/50 border border-border rounded-xl outline-none focus:border-purple-400 focus:bg-background min-h-[100px] resize-none text-sm transition-colors"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                  />
                  <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                    <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-background/50 border border-border rounded-xl focus-within:border-purple-400 focus-within:bg-background transition-colors min-w-[250px]">
                      <ImageIcon size={18} className="text-purple-500 shrink-0" />
                      <input 
                        type="url" 
                        placeholder="Görsel URL'si (Opsiyonel)" 
                        className="w-full bg-transparent outline-none text-sm"
                        value={newPostImage}
                        onChange={(e) => setNewPostImage(e.target.value)}
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={!newPostTitle || !newPostContent}
                      className="bg-purple-600 text-white px-8 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg w-full sm:w-auto"
                    >
                      <Send size={18} />
                      Paylaş
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Gönderi Akışı */}
            <div className="flex flex-col gap-8">
              {posts.map((post) => (
                <div key={post.id} className="bg-surface/90 backdrop-blur-md rounded-3xl overflow-hidden border border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-2xl shadow-sm">
                        {post.avatar}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">{post.author}</h4>
                        <span className="text-xs font-semibold text-purple-600 bg-purple-100/50 px-2.5 py-1 rounded-md">{post.role}</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-heading font-semibold mb-3">{post.title}</h3>
                    <p className="text-foreground/80 leading-relaxed text-sm mb-4">
                      {post.content}
                    </p>
                  </div>
                  
                  {post.image && (
                    <div className="w-full h-[350px] sm:h-[450px] bg-surface-muted overflow-hidden relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.image} alt="Etkinlik Görseli" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                    </div>
                  )}

                  <div className="px-6 py-4 border-t border-border bg-surface-muted/30 flex items-center gap-6">
                    <button 
                      onClick={() => toggleLike(post.id)} 
                      className="flex items-center gap-2 text-foreground/60 hover:text-pink-500 transition-colors font-medium text-sm group"
                    >
                      <Heart size={20} className={`transition-all ${post.likes > 0 ? 'fill-pink-500 text-pink-500' : 'group-hover:fill-pink-500 group-hover:text-pink-500 group-active:scale-125'}`} />
                      {post.likes > 0 ? <span className="text-pink-500 font-bold">{post.likes} Beğeni</span> : 'Beğen'}
                    </button>
                    <button className="flex items-center gap-2 text-foreground/60 hover:text-purple-600 transition-colors font-medium text-sm">
                      <MessageCircle size={20} />
                      Yorum Yap
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="px-6 py-8 text-center text-sm text-foreground/50 relative z-10 bg-background/80 backdrop-blur-md">
        İkiz Eğitim Platformu © {new Date().getFullYear()} — Tüm Hakları Saklıdır.
      </footer>
    </div>
  );
}
