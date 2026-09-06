"use client";

import { useRef, useState } from "react";
import { Image as ImageIcon, X, FileText } from "lucide-react";
import { createCommunityPost } from "../actions";

type UploadModalProps = {
  onClose: () => void;
  onCreated: () => Promise<void>;
};

export function UploadModal({ onClose, onCreated }: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [imagePreview, setImagePreview] = useState("");

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

  const handleSubmit = async (e: React.FormEvent) => {
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
      await onCreated();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Gönderi paylaşılırken bir hata oluştu.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-2xl font-bold font-heading">Yeni Etkinlik Paylaş</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface rounded-full transition-colors text-foreground/50 hover:text-foreground">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold mb-2">Etkinlik Başlığı</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              placeholder="Örn: Evde Renk Avı Oyunu"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Açıklama / Deneyim</label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 min-h-[120px] resize-none"
              placeholder="Etkinliği nasıl yaptınız? Çocuklar nasıl tepki verdi?"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Etiketler (Virgülle ayırın)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              placeholder="Doğa, Eğitici Oyun, Renkler"
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
                  onClick={() => { setImagePreview(""); setImageBase64(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-foreground/50 hover:text-purple-600 hover:border-purple-400 hover:bg-purple-50/50 cursor-pointer transition-all"
              >
                <ImageIcon size={32} className="mb-2" />
                <span className="font-medium">Bilgisayardan/Telefondan Seç</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*,application/pdf"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold text-foreground/60 hover:bg-surface transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-md disabled:opacity-50"
            >
              {isUploading ? "Yükleniyor..." : "Kütüphaneye Ekle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
