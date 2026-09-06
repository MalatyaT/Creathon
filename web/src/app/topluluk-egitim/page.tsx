"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { TwinMark } from "@/components/brand/twin-mark";
import { Search, Heart, Plus, Filter, Image as ImageIcon, X, FileText } from "lucide-react";
import { getCommunityPosts, createCommunityPost, likeCommunityPost, type CommunityPost } from "./actions";

export default function ToplulukLibrary() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [activeTag, setActiveTag] = useState<string>("Tümü");
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [imagePreview, setImagePreview] = useState("");

  const allTags = ["Tümü", "TYT", "AYT", "LGS", "Matematik", "Fizik", "Ders Notu", "Soru Çözümü"];

  const fetchPosts = async () => {
    const data = await getCommunityPosts(activeTag === "Tümü" ? undefined : activeTag);
    setPosts(data);
  };

  useEffect(() => {
    fetchPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTag]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImageBase64(reader.result as string);
          setImagePreview("pdf");
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          const img = new Image();
          img.src = reader.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1000;
            const MAX_HEIGHT = 1000;
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setImageBase64(dataUrl);
            setImagePreview(dataUrl);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("tags", tags);
      formData.append("image_base64", imageBase64);
      formData.append("author", "Ziyaretçi Veli");
      formData.append("role", "Veli");

      await createCommunityPost(formData);
      
      setShowUploadModal(false);
      setTitle("");
      setContent("");
      setTags("");
      setImageBase64("");
      setImagePreview("");
      await fetchPosts();
    } catch (err) {
      console.error(err);
      alert("Gönderi paylaşılırken bir hata oluştu.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleLike = async (id: string) => {
    // Optimistic UI update
    setPosts(posts.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
    await likeCommunityPost(id);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Navbar */}
      <header className="flex flex-wrap items-center justify-between px-6 py-4 bg-white border-b border-border shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/panel/ogrenci" className="flex items-center gap-2 hover:opacity-80 transition-opacity h-12 sm:h-16">
            <TwinMark variant="egitim" className="h-full" />
          </Link>
          <div className="h-6 w-px bg-border mx-2 hidden sm:block"></div>
          <span className="text-foreground/70 font-medium hidden sm:block">Eğitim Kütüphanesi</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowUploadModal(true)}
            className="bg-brand-green text-white px-5 py-2.5 rounded-full font-semibold flex items-center gap-2 hover:bg-brand-green-600 transition-all shadow-md hover:shadow-lg"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Yeni Kaynak Ekle</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6 sm:p-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-heading font-bold text-foreground mb-3">Keşfet</h1>
            <p className="text-foreground/60 text-lg">Öğretmenlerimizin ve öğrencilerimizin paylaştığı ders notları, soru çözümleri ve taktikler.</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={20} />
            <input 
              type="text" 
              placeholder="Soru, not veya konu ara..." 
              className="w-full bg-white border border-border rounded-full py-3 pl-12 pr-4 outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-10">
          <span className="text-foreground/50 font-medium mr-2 flex items-center gap-2">
            <Filter size={18} /> Filtreler:
          </span>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-5 py-2 rounded-full font-medium transition-all ${activeTag === tag ? 'bg-foreground text-background shadow-md' : 'bg-white text-foreground border border-border hover:border-foreground/30 hover:bg-surface'}`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Masonry/Grid Feed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-[max-content]">
          {posts.length === 0 && (
            <div className="col-span-full py-20 text-center text-foreground/50 text-lg">
              Henüz bu kategoride kaynak paylaşılmamış. İlk paylaşan siz olun!
            </div>
          )}
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-3xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col">
              {/* Image Thumbnail */}
              <div className="w-full relative bg-surface-muted aspect-[4/3] overflow-hidden">
                {post.image_base64 ? (
                  post.image_base64.startsWith('data:application/pdf') ? (
                    <a href={post.image_base64} download={`${post.title}.pdf`} className="w-full h-full flex flex-col items-center justify-center text-red-500 bg-red-50 group-hover:bg-red-100 transition-colors">
                      <FileText size={48} className="mb-2" />
                      <span className="font-bold text-sm underline">PDF İndir</span>
                    </a>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.image_base64} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-foreground/20">
                    <ImageIcon size={48} />
                  </div>
                )}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  {post.tags.map(tag => (
                    <span key={tag} className="bg-white/90 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full text-brand-green shadow-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Content */}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-lg mb-2 line-clamp-2 leading-tight">{post.title}</h3>
                <p className="text-foreground/70 text-sm mb-4 line-clamp-3 flex-1">{post.content}</p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center text-sm shadow-inner text-brand-green">
                      {post.role === 'Öğretmen' ? '👨‍🏫' : '👨‍🎓'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold leading-none">{post.author}</span>
                      <span className="text-[10px] text-foreground/50">{post.role}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1.5 text-foreground/50 hover:text-pink-500 transition-colors"
                  >
                    <Heart size={18} className={post.likes > 0 ? 'fill-pink-500 text-pink-500' : ''} />
                    <span className={`text-sm font-medium ${post.likes > 0 ? 'text-pink-500' : ''}`}>{post.likes}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="text-2xl font-bold font-heading">Yeni Kaynak Paylaş</h2>
              <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-surface rounded-full transition-colors text-foreground/50 hover:text-foreground">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUploadSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold mb-2">Başlık</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green" 
                  placeholder="Örn: 2024 YKS Matematik Denemesi Zor Sorular"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-2">Açıklama / Soru Çözümü</label>
                <textarea 
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green min-h-[120px] resize-none" 
                  placeholder="Soru çözümü veya notlarınızı buraya ekleyin..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Etiketler (Virgülle ayırın)</label>
                <input 
                  type="text" 
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green" 
                  placeholder="TYT, AYT, Matematik, Soru Çözümü"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Dosya (Fotoğraf veya PDF)</label>
                {imagePreview ? (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden border border-border flex items-center justify-center bg-surface">
                    {imagePreview === 'pdf' ? (
                      <div className="flex flex-col items-center justify-center text-red-500">
                         <FileText size={48} className="mb-2" />
                         <span className="font-bold">PDF Eklendi</span>
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imagePreview} alt="Önizleme" className="w-full h-full object-cover" />
                    )}
                    <button 
                      type="button"
                      onClick={() => { setImagePreview(""); setImageBase64(""); if(fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-foreground/50 hover:text-brand-green hover:border-brand-green hover:bg-brand-green/5 cursor-pointer transition-all"
                  >
                    <ImageIcon size={32} className="mb-2" />
                    <span className="text-brand-green font-semibold">Tıklayarak resim seçin</span> veya buraya sürükleyin
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button 
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-6 py-3 font-semibold text-foreground/70 hover:bg-surface-muted rounded-xl transition-colors"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  disabled={isUploading || !title || !content}
                  className="bg-brand-green text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isUploading ? "Paylaşılıyor..." : "Paylaş"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
