"use client";

import { useState, useEffect } from "react";

export type WeekStatus = "bekliyor" | "isleniyor" | "tamamlandi";

export interface CurriculumWeek {
  id: number;
  term: number;
  week: number;
  topic: string;
}

export const YKS_MATH_CURRICULUM: CurriculumWeek[] = [
  // 1. Dönem
  { id: 1, term: 1, week: 1, topic: "Üstel fonksiyon" },
  { id: 2, term: 1, week: 2, topic: "Üstel fonksiyonun özellikleri ve grafikleri" },
  { id: 3, term: 1, week: 3, topic: "Üstel fonksiyonlarla ilgili problemler" },
  { id: 4, term: 1, week: 4, topic: "Logaritma kavramı" },
  { id: 5, term: 1, week: 5, topic: "Logaritma fonksiyonu ve özellikleri" },
  { id: 6, term: 1, week: 6, topic: "Logaritmik fonksiyonun grafiği" },
  { id: 7, term: 1, week: 7, topic: "Logaritma kuralları ve işlemleri" },
  { id: 8, term: 1, week: 8, topic: "Üstel ve logaritmik denklemler" },
  { id: 9, term: 1, week: 9, topic: "Üstel ve logaritmik eşitsizlikler" },
  { id: 10, term: 1, week: 10, topic: "Üstel ve logaritmik fonksiyon problemleri + tekrar" },
  { id: 11, term: 1, week: 11, topic: "Diziler – dizi kavramı" },
  { id: 12, term: 1, week: 12, topic: "Aritmetik diziler" },
  { id: 13, term: 1, week: 13, topic: "Aritmetik dizinin genel terimi" },
  { id: 14, term: 1, week: 14, topic: "Aritmetik dizilerde toplam" },
  { id: 15, term: 1, week: 15, topic: "Geometrik diziler" },
  { id: 16, term: 1, week: 16, topic: "Geometrik dizinin genel terimi" },
  { id: 17, term: 1, week: 17, topic: "Geometrik dizilerde toplam" },
  { id: 18, term: 1, week: 18, topic: "Diziler genel tekrar ve değerlendirme" },
  // 2. Dönem
  { id: 19, term: 2, week: 19, topic: "Trigonometriye giriş ve trigonometrik fonksiyonlar" },
  { id: 20, term: 2, week: 20, topic: "Toplam-fark formülleri" },
  { id: 21, term: 2, week: 21, topic: "İki açının toplamı ve farkının trigonometrik değerleri" },
  { id: 22, term: 2, week: 22, topic: "İki kat açı formülleri" },
  { id: 23, term: 2, week: 23, topic: "Yarım açı ve trigonometrik özdeşlikler" },
  { id: 24, term: 2, week: 24, topic: "Trigonometrik denklemler" },
  { id: 25, term: 2, week: 25, topic: "Dönüşümler – öteleme ve dönme" },
  { id: 26, term: 2, week: 26, topic: "Yansıma ve simetri" },
  { id: 27, term: 2, week: 27, topic: "Fonksiyonlarda dönüşümler" },
  { id: 28, term: 2, week: 28, topic: "Türev kavramına giriş" },
  { id: 29, term: 2, week: 29, topic: "Türev ve değişim hızı" },
  { id: 30, term: 2, week: 30, topic: "Türev alma kuralları" },
  { id: 31, term: 2, week: 31, topic: "Fonksiyonların türevleri" },
  { id: 32, term: 2, week: 32, topic: "Türev uygulamaları" },
  { id: 33, term: 2, week: 33, topic: "Artan-azalan fonksiyonlar ve ekstremum" },
  { id: 34, term: 2, week: 34, topic: "İntegral kavramına giriş" },
  { id: 35, term: 2, week: 35, topic: "Belirsiz integral ve integral alma" },
  { id: 36, term: 2, week: 36, topic: "Belirli integral" },
  { id: 37, term: 2, week: 37, topic: "İntegralin uygulamaları ve alan" },
  { id: 38, term: 2, week: 38, topic: "Genel tekrar – AYT Matematik hazırlığı" },
];

export interface WeekState {
  status: WeekStatus;
  hasTwinWarning: boolean;
}

export type CurriculumState = Record<number, WeekState>;

// Default state if nothing in localStorage
const DEFAULT_STATE: CurriculumState = {};
YKS_MATH_CURRICULUM.forEach((week) => {
  let status: WeekStatus = "bekliyor";
  let hasTwinWarning = false;
  
  if (week.id <= 12) status = "tamamlandi";
  else if (week.id === 13) status = "isleniyor";
  
  if (week.id === 4 || week.id === 11) hasTwinWarning = true;
  
  DEFAULT_STATE[week.id] = { status, hasTwinWarning };
});

export function useCurriculum() {
  const [state, setState] = useState<CurriculumState | null>(null);

  useEffect(() => {
    // Load from local storage on mount
    const stored = localStorage.getItem("ikiz_curriculum");
    if (stored) {
      try {
        setState(JSON.parse(stored));
      } catch (e) {
        setState(DEFAULT_STATE);
      }
    } else {
      setState(DEFAULT_STATE);
    }
  }, []);

  const updateWeek = (id: number, updates: Partial<WeekState>) => {
    setState((prev) => {
      if (!prev) return prev;
      const newState = {
        ...prev,
        [id]: { ...prev[id], ...updates },
      };
      localStorage.setItem("ikiz_curriculum", JSON.stringify(newState));
      return newState;
    });
  };

  return { state, updateWeek, isLoading: state === null };
}
