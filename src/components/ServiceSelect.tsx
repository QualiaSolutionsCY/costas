"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";

type Props = {
  value: number; // index, -1 = none
  onChange: (i: number) => void;
  options: string[];
  placeholder: string;
  className?: string;
};

export function ServiceSelect({ value, onChange, options, placeholder, className }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = value >= 0 ? options[value] : null;

  function pick(i: number) {
    onChange(i);
    setOpen(false);
    btnRef.current?.focus();
  }

  const optionButtons = options.map((opt, i) => {
    const active = i === value;
    return (
      <button
        key={i}
        type="button"
        role="option"
        aria-selected={active}
        onClick={() => pick(i)}
        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
          active ? "bg-surface-2 font-medium text-foreground" : "text-foreground hover:bg-surface-2"
        }`}
      >
        <span className="flex-1 truncate">{opt}</span>
        {active && <Icon name="check" className="h-4 w-4 shrink-0 text-accent" />}
      </button>
    );
  });

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm outline-none transition-colors ${
          open ? "border-foreground bg-surface" : "bg-surface-2 hover:border-foreground/30"
        } ${selected ? "text-foreground" : "text-muted"}`}
      >
        <span className="truncate">{selected ?? placeholder}</span>
        <Icon name="chevron" className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          {/* Desktop / tablet popover */}
          <div
            role="listbox"
            className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-30 hidden max-h-64 overflow-auto rounded-xl border bg-surface p-1 shadow-[0_16px_50px_-12px_rgba(0,0,0,0.28)] sm:block"
            style={{ animation: "popIn .12s ease-out" }}
          >
            {optionButtons}
          </div>

          {/* Mobile bottom sheet */}
          <div className="fixed inset-0 z-40 sm:hidden">
            <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <div
              role="listbox"
              className="absolute inset-x-0 bottom-0 max-h-[72vh] overflow-auto rounded-t-2xl border-t bg-surface p-2 pb-7 shadow-2xl"
              style={{ animation: "sheetUp .2s ease-out" }}
            >
              <div className="mx-auto mb-2 mt-1 h-1 w-10 rounded-full bg-border" />
              <p className="px-3 pb-1 text-xs font-medium text-muted">{placeholder}</p>
              {optionButtons}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
