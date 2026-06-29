import { Icon } from "@/components/icons";

// App-open loading page. Next renders this during navigation / server work.
// It is a Server Component and cannot read the language context, so the visual
// is language-agnostic: the brand mark, a spinner, and the static wordmark.
export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="flex flex-col items-center gap-4">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-xl font-bold text-surface shadow-sm">
          C
        </span>
        <Icon name="spinner" className="h-6 w-6 text-muted" />
        <span className="text-sm font-medium tracking-tight text-muted">Costas</span>
      </div>
    </main>
  );
}
