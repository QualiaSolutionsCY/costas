// Loading placeholders that mirror the real content's shape, so the layout
// doesn't shift when data arrives. All neutral tokens — `.skeleton` (globals.css)
// carries the shimmer + reduced-motion handling.

export function Skeleton({ className }: { className?: string }) {
  return <span className={`skeleton block ${className ?? ""}`} aria-hidden="true" />;
}

/** Mirrors the owner ServiceLog history timeline rows. */
export function TimelineSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <ol className="mt-3" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="relative flex gap-4 pb-5 last:pb-0">
          {i !== rows - 1 && (
            <span className="absolute left-[15px] top-9 h-[calc(100%-1.5rem)] w-px bg-border" />
          )}
          <Skeleton className="h-8 w-8 shrink-0 !rounded-full" />
          <div className="min-w-0 flex-1 rounded-xl border bg-surface px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-14" />
            </div>
            <Skeleton className="mt-2 h-3 w-28" />
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Mirrors the mechanic recent-entries rows. */
export function RowSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <ul className="mt-3 space-y-2" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 rounded-xl border bg-surface px-4 py-3">
          <Skeleton className="h-8 w-8 shrink-0" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-44" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-3 w-12" />
        </li>
      ))}
    </ul>
  );
}
