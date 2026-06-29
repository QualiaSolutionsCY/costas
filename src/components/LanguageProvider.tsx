"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { translations, type Lang, type Translation } from "@/lib/i18n";

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: Translation };

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("el");

  // Φόρτωση επιλογής μετά το hydration (αποφυγή mismatch).
  useEffect(() => {
    const saved = localStorage.getItem("lang");
    if (saved === "el" || saved === "en") setLangState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("lang", l);
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang(): Ctx {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
