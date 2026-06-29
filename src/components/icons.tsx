// Minimal inline icon set — keeps the prototype dependency-free.
const base = "h-[18px] w-[18px]";
const stroke = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function Icon({ name, className }: { name: string; className?: string }) {
  const cls = `${base} ${className ?? ""}`;
  switch (name) {
    case "grid":
      return (
        <svg className={cls} viewBox="0 0 24 24" {...stroke}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "car":
      return (
        <svg className={cls} viewBox="0 0 24 24" {...stroke}>
          <path d="M5 17h14M3 13l2-5a2 2 0 0 1 1.9-1.4h10.2A2 2 0 0 1 19 8l2 5v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
          <circle cx="7.5" cy="14.5" r="1" /><circle cx="16.5" cy="14.5" r="1" />
        </svg>
      );
    case "key":
      return (
        <svg className={cls} viewBox="0 0 24 24" {...stroke}>
          <circle cx="7.5" cy="15.5" r="4.5" /><path d="m10.7 12.3 8.3-8.3M15 5l3 3M13 7l2 2" />
        </svg>
      );
    case "wrench":
      return (
        <svg className={cls} viewBox="0 0 24 24" {...stroke}>
          <path d="M14.7 6.3a4 4 0 0 1 5 5l-9.4 9.4a2 2 0 0 1-2.8-2.8l9.4-9.4a4 4 0 0 1-2.2-1.2z" />
          <path d="M14.7 6.3 9.5 11.5" />
        </svg>
      );
    case "cog":
      return (
        <svg className={cls} viewBox="0 0 24 24" {...stroke}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M5 5l2 2M17 17l2 2M2 12h3M19 12h3M5 19l2-2M17 7l2-2" />
        </svg>
      );
    case "tag":
      return (
        <svg className={cls} viewBox="0 0 24 24" {...stroke}>
          <path d="M3 11.5V4a1 1 0 0 1 1-1h7.5a1 1 0 0 1 .7.3l8 8a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-8-8a1 1 0 0 1-.3-.7z" />
          <circle cx="7.5" cy="7.5" r="1.3" />
        </svg>
      );
    case "orders":
      return (
        <svg className={cls} viewBox="0 0 24 24" {...stroke}>
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      );
    case "message":
      return (
        <svg className={cls} viewBox="0 0 24 24" {...stroke}>
          <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-4.1A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z" />
        </svg>
      );
    case "settings":
      return (
        <svg className={cls} viewBox="0 0 24 24" {...stroke}>
          <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case "search":
      return (
        <svg className={cls} viewBox="0 0 24 24" {...stroke}>
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
      );
    case "bell":
      return (
        <svg className={cls} viewBox="0 0 24 24" {...stroke}>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      );
    case "pin":
      return (
        <svg className={`h-3.5 w-3.5 ${className ?? ""}`} viewBox="0 0 24 24" {...stroke}>
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case "star":
      return (
        <svg className={`h-3.5 w-3.5 ${className ?? ""}`} viewBox="0 0 24 24" fill="currentColor">
          <path d="m12 2 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.3 6.2 20.4l1.1-6.5L2.6 8.8l6.5-.9z" />
        </svg>
      );
    case "heart":
      return (
        <svg className={cls} viewBox="0 0 24 24" {...stroke}>
          <path d="M19 5.6a4.5 4.5 0 0 0-7 1A4.5 4.5 0 0 0 5 5.6a4.7 4.7 0 0 0 0 6.6L12 19l7-6.8a4.7 4.7 0 0 0 0-6.6z" />
        </svg>
      );
    case "plus":
      return (
        <svg className={cls} viewBox="0 0 24 24" {...stroke} strokeWidth={2.2}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "menu":
      return (
        <svg className={cls} viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      );
    case "close":
      return (
        <svg className={cls} viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      );
    case "users":
      return (
        <svg className={cls} viewBox="0 0 24 24" {...stroke}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "calendar":
      return (
        <svg className={cls} viewBox="0 0 24 24" {...stroke}>
          <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      );
    case "clock":
      return (
        <svg className={cls} viewBox="0 0 24 24" {...stroke}>
          <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
        </svg>
      );
    case "shield":
      return (
        <svg className={cls} viewBox="0 0 24 24" {...stroke}>
          <path d="M12 3 4 6v6c0 5 3.4 7.7 8 9 4.6-1.3 8-4 8-9V6z" /><path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "upload":
      return (
        <svg className={cls} viewBox="0 0 24 24" {...stroke}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 9l5-5 5 5" /><path d="M12 4v12" />
        </svg>
      );
    case "file":
      return (
        <svg className={cls} viewBox="0 0 24 24" {...stroke}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
        </svg>
      );
    case "chevron":
      return (
        <svg className={cls} viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      );
    case "check":
      return (
        <svg className={cls} viewBox="0 0 24 24" {...stroke} strokeWidth={2.4}>
          <path d="m20 6-11 11-5-5" />
        </svg>
      );
    case "spinner":
      return (
        <svg className={`${cls} animate-spin`} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.2" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case "history":
      return (
        <svg className={cls} viewBox="0 0 24 24" {...stroke}>
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 4v4h4" /><path d="M12 8v4l3 2" />
        </svg>
      );
    default:
      return null;
  }
}
