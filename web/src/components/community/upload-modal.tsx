"use client";

import { useRef, useState } from "react";
import { Image as ImageIcon, X, FileText, Plus } from "lucide-react";
import { createCommunityPost } from "@/lib/community/actions";
import type { CommunityTheme } from "@/lib/community/theme";

const FULL_MAX_DIM = 1000;

type Attachment = {
  full: string;
  thumbnail: string | null; // null for PDFs (card shows a static file icon instead)
  isPdf: boolean;
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function resizeImageDataUrl(dataUrl: string, maxDim: number, quality: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxDim) {
          height *= maxDim / width;
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width *= maxDim / height;
          height = maxDim;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
}

async function processFile(file: File): Promise<Attachment> {
  const dataUrl = await readFileAsDataUrl(file);
  if (file.type === 'application/pdf') {
    return { full: dataUrl, thumbnail: null, isPdf: true };
  }
  const full = await resizeImageDataUrl(dataUrl, FULL_MAX_DIM, 0.8);
  // Cards use the same full-quality image as their cover — only PDFs (which never
  // render as an image anyway) are excluded from the list query's payload.
  return { full, thumbnail: full, isPdf: false };
}

type UploadModalProps = {
  theme: CommunityTheme;
  onClose: () => void;
  onCreated: () => Promise<void>;
};

export function UploadModal({ theme, onClose, onCreated }: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setIsProcessingFiles(true);
    try {
      const processed = await Promise.all(files.map(processFile));
      setAttachments(prev => [...prev, ...processed]);
    } finally {
      setIsProcessingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("tags", tags);
      attachments.forEach(a => formData.append("images", a.full));
      const cover = attachments[0];
      formData.append("cover_thumbnail", cover?.thumbnail ?? "");
      formData.append("cover_is_pdf", String(cover?.isPdf ?? false));
      formData.append("author", "Ziyaretçi Veli");
      formData.append("role", "Veli");

      await createCommunityPost(formData, theme.category, theme.basePath);
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
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-border sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold font-heading">{theme.uploadModalTitle}</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface rounded-full transition-colors text-foreground/50 hover:text-foreground">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold mb-2">{theme.titleFieldLabel}</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full bg-surface border border-border rounded-xl px-4 py-3 outline-none ${theme.accentBorderFocus} focus:ring-1 ${theme.accentRingFocus}`}
              placeholder={theme.titleFieldPlaceholder}
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">{theme.contentFieldLabel}</label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`w-full bg-surface border border-border rounded-xl px-4 py-3 outline-none ${theme.accentBorderFocus} focus:ring-1 ${theme.accentRingFocus} min-h-[120px] resize-none`}
              placeholder={theme.contentFieldPlaceholder}
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Etiketler (Virgülle ayırın)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className={`w-full bg-surface border border-border rounded-xl px-4 py-3 outline-none ${theme.accentBorderFocus} focus:ring-1 ${theme.accentRingFocus}`}
              placeholder={theme.tags.filter(t => t !== "Tümü").slice(0, 3).join(", ")}
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Dosyalar (Fotoğraf veya PDF, birden fazla seçilebilir)</label>
            <div className="flex flex-wrap gap-3">
              {attachments.map((att, index) => (
                <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border flex items-center justify-center bg-surface shrink-0">
                  {att.isPdf ? (
                    <div className="flex flex-col items-center justify-center text-red-500">
                      <FileText size={24} />
                      <span className="text-[10px] font-bold mt-1">PDF</span>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={att.full} alt={`Ek ${index + 1}`} className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingFiles}
                className={`w-24 h-24 shrink-0 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-foreground/50 ${theme.accentHoverText} ${theme.accentHoverBorder} cursor-pointer transition-all disabled:opacity-50`}
              >
                <Plus size={20} className="mb-1" />
                <span className="text-[11px] font-medium text-center px-1">{isProcessingFiles ? "Yükleniyor..." : "Ekle"}</span>
              </button>
            </div>
            {attachments.length === 0 && (
              <p className="text-xs text-foreground/40 mt-2 flex items-center gap-1">
                <ImageIcon size={14} /> İhtiyaç duyulan malzemeleri göstermek için birden fazla fotoğraf ekleyebilirsiniz.
              </p>
            )}
            <input
              type="file"
              accept="image/*,application/pdf"
              multiple
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
              disabled={isUploading || isProcessingFiles}
              className={`${theme.accentBg} text-white px-8 py-3 rounded-xl font-bold ${theme.accentBgHover} transition-colors shadow-md disabled:opacity-50`}
            >
              {isUploading ? "Yükleniyor..." : "Kütüphaneye Ekle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
