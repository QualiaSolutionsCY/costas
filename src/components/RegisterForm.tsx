"use client";

import { useRef, useState } from "react";
import { workshop } from "@/lib/data";
import { Icon } from "./icons";
import { useLang } from "./LanguageProvider";
import { LanguageToggle } from "./LanguageToggle";

function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function RegisterForm() {
  const { t } = useLang();
  const [name, setName] = useState("");
  const [serial, setSerial] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function setSelected(f: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(f && f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setSelected(f);
  }

  const valid = name.trim() && serial.trim() && file;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || submitting) return;
    // Simulated submit — Phase 3 swaps this for the real upload + insert action.
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 800);
  }

  function reset() {
    setSelected(null);
    setName("");
    setSerial("");
    setSubmitted(false);
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-positive/12 text-positive">
          <Icon name="check" className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-lg font-semibold tracking-tight">{t.regDone}</h1>
        <p className="mt-1 text-sm text-muted">{t.regDoneSub}</p>
        <div className="mt-6 rounded-xl border bg-surface p-4 text-left text-sm">
          <div className="flex justify-between gap-3 border-b py-1.5"><span className="text-muted">{t.nameLabel}</span><span className="font-medium">{name}</span></div>
          <div className="flex justify-between gap-3 border-b py-1.5"><span className="text-muted">{t.shopDefaultLabel}</span><span className="font-medium">{workshop.name}</span></div>
          <div className="flex justify-between gap-3 border-b py-1.5"><span className="text-muted">{t.serialLabel}</span><span className="font-mono font-medium">{serial}</span></div>
          <div className="flex justify-between gap-3 py-1.5"><span className="text-muted">{t.certLabel}</span><span className="truncate font-medium">{file?.name}</span></div>
        </div>
        <button onClick={reset} className="mt-5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-2">
          {t.registerAnother}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:py-12">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-base font-bold text-surface shadow-sm">C</span>
        <div className="min-w-0">
          <h1 className="text-base font-semibold tracking-tight">{t.regTitle}</h1>
          <p className="truncate text-xs text-muted">{t.regSubtitle}</p>
        </div>
        <div className="ml-auto"><LanguageToggle /></div>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl border bg-surface p-5">
        {/* Όνομα */}
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">{t.nameLabel}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.namePlaceholder}
            className="w-full rounded-lg border bg-surface-2 px-3 py-2.5 text-sm outline-none placeholder:text-muted focus:border-foreground focus:bg-surface"
          />
        </label>

        {/* Κατάστημα — προεπιλογή (read-only) */}
        <div>
          <span className="mb-1 block text-xs font-medium text-muted">{t.shopDefaultLabel}</span>
          <div className="flex items-center gap-2 rounded-lg border border-dashed bg-surface-2 px-3 py-2.5 text-sm text-muted">
            <Icon name="wrench" className="h-4 w-4" />
            <span className="font-medium text-foreground">{workshop.name}</span>
          </div>
        </div>

        {/* Σειριακός αριθμός */}
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">{t.serialLabel}</span>
          <input
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            placeholder={t.serialPlaceholder}
            className="w-full rounded-lg border bg-surface-2 px-3 py-2.5 text-sm uppercase tracking-wider outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-muted focus:border-foreground focus:bg-surface"
          />
        </label>

        {/* Πιστοποιητικό — upload */}
        <div>
          <span className="mb-1 block text-xs font-medium text-muted">{t.certLabel}</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => setSelected(e.target.files?.[0] ?? null)}
          />

          {!file ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`flex w-full flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-7 text-center transition-colors ${
                dragging ? "border-foreground bg-surface-2" : "hover:bg-surface-2"
              }`}
            >
              <Icon name="upload" className="h-6 w-6 text-muted" />
              <span className="text-xs text-muted">{t.certHint}</span>
            </button>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border bg-surface-2 p-3">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="h-12 w-12 shrink-0 rounded-lg border object-cover" />
              ) : (
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border bg-surface text-muted">
                  <Icon name="file" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted">{fileSize(file.size)}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1 text-xs">
                <button type="button" onClick={() => inputRef.current?.click()} className="font-medium text-accent hover:underline">{t.changeFile}</button>
                <button type="button" onClick={() => setSelected(null)} className="text-muted hover:text-negative">{t.removeFile}</button>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!valid || submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting && <Icon name="spinner" className="h-4 w-4" />}
          {submitting ? t.submitting : t.submitReg}
        </button>
      </form>
    </div>
  );
}
