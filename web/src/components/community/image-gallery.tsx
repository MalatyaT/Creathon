"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, FileText, Image as ImageIcon } from "lucide-react";

type ImageGalleryProps = {
  images: string[];
  title: string;
};

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="w-full h-40 flex items-center justify-center text-foreground/20 bg-surface-muted">
        <ImageIcon size={48} />
      </div>
    );
  }

  const active = images[activeIndex];
  const isPdf = active.startsWith('data:application/pdf');

  return (
    <div className="w-full bg-surface-muted">
      <div className="relative w-full max-h-80 flex items-center justify-center overflow-hidden">
        {isPdf ? (
          <a href={active} download={`${title}.pdf`} className="w-full py-10 flex flex-col items-center justify-center text-red-500 bg-red-50 hover:bg-red-100 transition-colors">
            <FileText size={48} className="mb-2" />
            <span className="font-bold text-sm underline">PDF İndir</span>
          </a>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={active} alt={`${title} - ${activeIndex + 1}`} className="w-full max-h-80 object-contain" />
        )}

        {images.length > 1 && (
          <>
            <button
              onClick={() => setActiveIndex(i => (i - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors"
              aria-label="Önceki görsel"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setActiveIndex(i => (i + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors"
              aria-label="Sonraki görsel"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex items-center justify-center gap-2 py-3">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === activeIndex ? 'bg-foreground w-6' : 'bg-foreground/20'}`}
              aria-label={`${i + 1}. görsele git`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
